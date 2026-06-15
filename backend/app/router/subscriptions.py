from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel

from app.auth.authentication import get_current_user
from services.subscription_service import (
    activate_subscription,
    cancel_subscription,
    create_checkout_session,
    get_current_subscription_details,
    parse_webhook_event,
    process_webhook_event,
)

import stripe


router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


class CheckoutRequest(BaseModel):
    plan: str
    user_email: str


class ActivateRequest(BaseModel):
    plan: str


@router.post("/create-checkout-session")
async def checkout(body: CheckoutRequest, decoded=Depends(get_current_user)):
    try:
        url = create_checkout_session(decoded["uid"], body.plan, body.user_email)
        return {"url": url}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except stripe.error.StripeError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/activate")
async def activate(body: ActivateRequest, decoded=Depends(get_current_user)):
    try:
        activate_subscription(decoded["uid"], body.plan)
        return {"status": "activated"}
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/current")
async def current(decoded=Depends(get_current_user)):
    try:
        return get_current_subscription_details(decoded["uid"])
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/cancel")
async def cancel(decoded=Depends(get_current_user)):
    try:
        result = cancel_subscription(decoded["uid"])
        return {"status": "cancel_scheduled", **result}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except stripe.error.StripeError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/webhook")
async def webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
):
    payload = await request.body()

    try:
        event = parse_webhook_event(payload, stripe_signature)
        process_webhook_event(event)
        return {"received": True}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except stripe.error.SignatureVerificationError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))