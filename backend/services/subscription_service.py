import os
import json

import stripe

from app.database.db import db


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


if not stripe.api_key:
    raise RuntimeError("STRIPE_SECRET_KEY missing from environment")


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
    normalized_plan = plan.lower().strip()
    if normalized_plan not in PRICE_IDS:
        raise ValueError(f"Unknown plan: {plan}")

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


def activate_subscription(user_id: str, plan: str) -> None:
    normalized_plan = plan.lower().strip()
    db.collection("users").document(user_id).set(
        {
            "plan": normalized_plan,
            "subscription_plan": normalized_plan,
            "subscription_status": "active",
        },
        merge=True,
    )


def parse_webhook_event(payload: bytes, signature: str | None):
    if STRIPE_WEBHOOK_SECRET:
        if not signature:
            raise ValueError("Missing Stripe-Signature header")
        return stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)

    # Development fallback when webhook secret is not configured yet.
    return json.loads(payload.decode("utf-8"))


def process_webhook_event(event) -> None:
    event_type = event.get("type")
    if event_type != "checkout.session.completed":
        return

    session = event.get("data", {}).get("object", {})
    metadata = session.get("metadata") or {}

    user_id = metadata.get("user_id")
    plan = str(metadata.get("plan") or "pro").lower().strip()

    if user_id:
        activate_subscription(user_id, plan)
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

    activate_subscription(user_doc.id, plan)