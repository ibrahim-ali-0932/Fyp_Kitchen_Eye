import os
import json
from datetime import datetime, timezone

import stripe

from app.database.db import db
from services.plan_limits_service import (
    build_quantifiable_features,
    get_account_owner_id,
    get_plan_limits,
    get_usage_for_owner,
)


if not os.getenv("STRIPE_SECRET_KEY"):
    from dotenv import load_dotenv
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parents[1]
    env_path = backend_dir / ".env" / "backend.env"
    if env_path.is_file():
        load_dotenv(env_path)


stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
PRICE_IDS = {
    "pro": os.getenv("STRIPE_PRO_PRICE_ID"),
    "enterprise": os.getenv("STRIPE_ENTERPRISE_PRICE_ID"),
}
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
ACTIVE_LIKE_STATUSES = {"active", "trialing", "past_due", "cancel_at_period_end"}


if not stripe.api_key:
    raise RuntimeError("STRIPE_SECRET_KEY missing from environment")


def _normalize_plan(value: str | None) -> str:
    return str(value or "").lower().strip()


def _format_timestamp(value) -> str | None:
    if value in (None, ""):
        return None
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc).isoformat()
    except Exception:
        return None


def _get_user_subscription_doc(user_id: str) -> dict:
    snap = db.collection("users").document(user_id).get()
    return snap.to_dict() or {}


def _is_duplicate_plan_request(user_id: str, requested_plan: str) -> bool:
    data = _get_user_subscription_doc(user_id)
    current_plan = _normalize_plan(data.get("plan") or data.get("subscription_plan"))
    current_status = _normalize_plan(data.get("subscription_status"))
    requested_plan = _normalize_plan(requested_plan)

    if not current_plan or requested_plan != current_plan:
        return False

    return current_status in ACTIVE_LIKE_STATUSES


def _resolve_price_id(plan: str) -> str:
    identifier = PRICE_IDS.get(plan)

    if not identifier:
        raise ValueError(f"Missing Stripe identifier for plan: {plan}")

    if identifier.startswith("price_"):
        return identifier

    if identifier.startswith("prod_"):
        product = stripe.Product.retrieve(identifier)
        default_price = getattr(product, "default_price", None)
        if isinstance(default_price, dict):
            default_price = default_price.get("id")
        if default_price:
            return str(default_price)
        raise ValueError(
            f"Stripe product {identifier} has no default_price. Set a default price in Stripe or replace it with a price_ id."
        )

    raise ValueError(
        f"Invalid Stripe identifier for {plan}: {identifier}. Expected price_... or prod_..."
    )


def create_checkout_session(user_id: str, plan: str, user_email: str) -> str:
    normalized_plan = _normalize_plan(plan)
    if normalized_plan not in PRICE_IDS:
        raise ValueError(f"Unknown plan: {plan}")

    if _is_duplicate_plan_request(user_id, normalized_plan):
        raise ValueError(f"You are already subscribed to the {normalized_plan} plan.")

    price_id = _resolve_price_id(normalized_plan)

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        customer_email=user_email,
        success_url=(
            f"{FRONTEND_URL}/success?plan={normalized_plan}"
            f"&session_id={{CHECKOUT_SESSION_ID}}"
        ),
        cancel_url=f"{FRONTEND_URL}/cancel",
        metadata={"user_id": user_id, "plan": normalized_plan},
    )
    return session.url


def activate_subscription(
    user_id: str,
    plan: str,
    stripe_subscription_id: str | None = None,
    stripe_customer_id: str | None = None,
    current_period_start=None,
    current_period_end=None,
    subscription_status: str = "active",
) -> None:
    normalized_plan = _normalize_plan(plan)
    subscription_data = {
        "plan": normalized_plan,
        "subscription_plan": normalized_plan,
        "subscription_status": subscription_status,
    }

    if stripe_subscription_id:
        subscription_data["stripe_subscription_id"] = stripe_subscription_id
    if stripe_customer_id:
        subscription_data["stripe_customer_id"] = stripe_customer_id
    if current_period_start is not None:
        subscription_data["current_period_start"] = _format_timestamp(current_period_start)
    if current_period_end is not None:
        subscription_data["current_period_end"] = _format_timestamp(current_period_end)
        subscription_data["next_billing_date"] = _format_timestamp(current_period_end)

    db.collection("users").document(user_id).set(subscription_data, merge=True)


def cancel_subscription(user_id: str) -> dict:
    data = _get_user_subscription_doc(user_id)
    stripe_subscription_id = str(data.get("stripe_subscription_id") or "").strip()

    if not stripe_subscription_id:
        raise ValueError("No Stripe subscription id found for this account.")

    subscription = stripe.Subscription.retrieve(stripe_subscription_id)
    if not getattr(subscription, "cancel_at_period_end", False):
        subscription = stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=True,
        )

    period_end = _format_timestamp(getattr(subscription, "current_period_end", None))
    period_start = _format_timestamp(getattr(subscription, "current_period_start", None))
    status = str(getattr(subscription, "status", "active") or "active")

    db.collection("users").document(user_id).set(
        {
            "subscription_status": "cancel_at_period_end",
            "cancel_at_period_end": True,
            "current_period_start": period_start,
            "current_period_end": period_end,
            "next_billing_date": period_end,
        },
        merge=True,
    )

    return {
        "status": status,
        "cancel_at_period_end": True,
        "current_period_start": period_start,
        "current_period_end": period_end,
        "next_billing_date": period_end,
    }


def get_current_subscription_details(user_id: str) -> dict:
    data = _get_user_subscription_doc(user_id)
    plan = _normalize_plan(data.get("plan") or data.get("subscription_plan") or "basic")
    status = _normalize_plan(data.get("subscription_status") or "")

    stripe_subscription_id = str(data.get("stripe_subscription_id") or "").strip()
    stripe_customer_id = str(data.get("stripe_customer_id") or "").strip()

    details = {
        "plan": plan,
        "status": status or ("active" if plan in PRICE_IDS else "basic"),
        "subscription_status": status,
        "cancel_at_period_end": bool(data.get("cancel_at_period_end", False)),
        "current_period_start": data.get("current_period_start"),
        "current_period_end": data.get("current_period_end"),
        "next_billing_date": data.get("next_billing_date"),
        "stripe_subscription_id": stripe_subscription_id or None,
        "stripe_customer_id": stripe_customer_id or None,
        "features": [],
        "limits": {},
        "usage": {},
    }

    if stripe_subscription_id:
        try:
            subscription = stripe.Subscription.retrieve(stripe_subscription_id)
            details["status"] = str(getattr(subscription, "status", details["status"]))
            details["subscription_status"] = details["status"]
            details["cancel_at_period_end"] = bool(getattr(subscription, "cancel_at_period_end", False))
            details["current_period_start"] = _format_timestamp(getattr(subscription, "current_period_start", None))
            details["current_period_end"] = _format_timestamp(getattr(subscription, "current_period_end", None))
            details["next_billing_date"] = details["current_period_end"]
        except Exception:
            pass

    owner_id = get_account_owner_id(user_id)
    limits = get_plan_limits(plan)
    usage = get_usage_for_owner(owner_id)
    details["limits"] = {
        "max_branches": limits.get("max_branches"),
        "max_cameras": limits.get("max_cameras"),
        "max_users": limits.get("max_users"),
    }
    details["usage"] = usage
    details["features"] = build_quantifiable_features(limits)

    return details


def parse_webhook_event(payload: bytes, signature: str | None):
    if STRIPE_WEBHOOK_SECRET:
        if not signature:
            raise ValueError("Missing Stripe-Signature header")
        return stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)

    # Development fallback when webhook secret is not configured yet.
    return json.loads(payload.decode("utf-8"))


def process_webhook_event(event) -> None:
    event_type = event.get("type")
    if event_type == "checkout.session.completed":
        session = event.get("data", {}).get("object", {})
        metadata = session.get("metadata") or {}

        user_id = metadata.get("user_id")
        plan = str(metadata.get("plan") or "pro").lower().strip()
        stripe_subscription_id = session.get("subscription")
        stripe_customer_id = session.get("customer")

        if user_id:
            activate_subscription(
                user_id,
                plan,
                stripe_subscription_id=stripe_subscription_id,
                stripe_customer_id=stripe_customer_id,
            )
            return

        customer_email = (
            (session.get("customer_details") or {}).get("email")
            or session.get("customer_email")
        )
        if not customer_email:
            return

        docs = db.collection("users").where("email", "==", customer_email).limit(1).stream()
        user_doc = next(docs, None)
        if user_doc is None:
            return

        activate_subscription(
            user_doc.id,
            plan,
            stripe_subscription_id=stripe_subscription_id,
            stripe_customer_id=stripe_customer_id,
        )
        return

    if event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
        subscription = event.get("data", {}).get("object", {})
        metadata = subscription.get("metadata") or {}
        user_id = metadata.get("user_id")

        if not user_id and subscription.get("customer_email"):
            docs = db.collection("users").where("email", "==", subscription.get("customer_email")).limit(1).stream()
            user_doc = next(docs, None)
            user_id = user_doc.id if user_doc else None

        if not user_id:
            return

        plan = str(metadata.get("plan") or _get_user_subscription_doc(user_id).get("plan") or "basic").lower().strip()
        status = str(subscription.get("status") or "active").lower().strip()

        if event_type == "customer.subscription.deleted":
            status = "canceled"

        activate_subscription(
            user_id,
            plan,
            stripe_subscription_id=subscription.get("id"),
            stripe_customer_id=subscription.get("customer"),
            current_period_start=subscription.get("current_period_start"),
            current_period_end=subscription.get("current_period_end"),
            subscription_status=status,
        )