from fastapi import APIRouter, HTTPException
import stripe
import os


stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()


@router.post("/payment-sheet")
async def create_payment_sheet():
    try:
        # 1. Create a Stripe Customer
        customer = stripe.Customer.create(
            name="Dinura Munasinghe",
            # email="user@example.com",  # add when you collect email
        )

        # 2. Create an Ephemeral Key for the customer
        ephemeral_key = stripe.EphemeralKey.create(
            customer=customer["id"],
            stripe_version="2024-06-20",
        )

        # 3. Create the PaymentIntent
        # LKR 500 → amount=50000 (Stripe uses smallest currency unit)
        payment_intent = stripe.PaymentIntent.create(
            amount=50000,
            currency="lkr",
            customer=customer["id"],
            automatic_payment_methods={"enabled": True},
            description="Advanced Tech Support – Provider+",
        )

        return {
            "paymentIntent": payment_intent["client_secret"],
            "ephemeralKey":  ephemeral_key["secret"],
            "customer":      customer["id"],
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e.user_message))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
