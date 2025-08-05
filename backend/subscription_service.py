import os
from typing import Dict, List
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse, CheckoutStatusResponse
from auth_models import SubscriptionPackage, PaymentTransaction
from datetime import datetime

# Predefined subscription packages - NEVER accept amounts from frontend
SUBSCRIPTION_PACKAGES: Dict[str, SubscriptionPackage] = {
    "monthly": SubscriptionPackage(
        id="monthly",
        name="Monthly Pro",
        price=29.00,
        currency="usd",
        description="Accès illimité pendant 1 mois",
        features=[
            "Analyses illimitées",
            "Calculs Monte Carlo avancés",
            "Historique des mains",
            "Support prioritaire"
        ]
    ),
    "yearly": SubscriptionPackage(
        id="yearly", 
        name="Yearly Pro",
        price=290.00,
        currency="usd",
        description="Accès illimité pendant 1 an (2 mois gratuits)",
        features=[
            "Analyses illimitées",
            "Calculs Monte Carlo avancés",
            "Historique des mains",
            "Support prioritaire",
            "2 mois gratuits",
            "Accès beta aux nouvelles fonctionnalités"
        ]
    )
}

class SubscriptionService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not self.stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe API key not configured")
    
    def get_packages(self) -> List[SubscriptionPackage]:
        """Get all available subscription packages"""
        return list(SUBSCRIPTION_PACKAGES.values())
    
    def get_package(self, package_id: str) -> SubscriptionPackage:
        """Get specific package by ID"""
        if package_id not in SUBSCRIPTION_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package ID")
        return SUBSCRIPTION_PACKAGES[package_id]
    
    async def create_checkout_session(self, package_id: str, origin_url: str, user_id: str) -> CheckoutSessionResponse:
        """Create Stripe checkout session"""
        # Get package (validates package_id)
        package = self.get_package(package_id)
        
        # Initialize Stripe checkout
        webhook_url = f"{origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=self.stripe_api_key, webhook_url=webhook_url)
        
        # Build success and cancel URLs
        success_url = f"{origin_url}/thank-you?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/pricing"
        
        # Create checkout session request
        checkout_request = CheckoutSessionRequest(
            amount=package.price,
            currency=package.currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "package_id": package_id,
                "user_id": user_id,
                "package_name": package.name
            }
        )
        
        # Create checkout session
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store payment transaction
        transaction = PaymentTransaction(
            user_id=user_id,
            session_id=session.session_id,
            amount=package.price,
            currency=package.currency,
            package_id=package_id,
            payment_status="pending",
            status="initiated",
            metadata={
                "package_id": package_id,
                "user_id": user_id,
                "package_name": package.name
            }
        )
        
        await self.db.payment_transactions.insert_one(transaction.dict())
        
        return session
    
    async def check_payment_status(self, session_id: str) -> CheckoutStatusResponse:
        """Check payment status from Stripe"""
        # Initialize Stripe checkout
        stripe_checkout = StripeCheckout(api_key=self.stripe_api_key, webhook_url="")
        
        # Get checkout status
        status_response = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        await self._update_transaction_status(session_id, status_response)
        
        return status_response
    
    async def _update_transaction_status(self, session_id: str, status_response: CheckoutStatusResponse):
        """Update payment transaction status in database"""
        # Find existing transaction
        transaction = await self.db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            return
        
        # Check if already processed to prevent duplicate processing
        if transaction.get("payment_status") == "paid":
            return
        
        # Update transaction status
        update_data = {
            "payment_status": status_response.payment_status,
            "status": status_response.status,
            "updated_at": datetime.utcnow()
        }
        
        await self.db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # If payment is successful, update user subscription
        if status_response.payment_status == "paid":
            user_id = transaction.get("user_id")
            if user_id:
                # Import here to avoid circular imports
                from auth_service import AuthService
                auth_service = AuthService(self.db)
                await auth_service.update_user_subscription(
                    user_id=user_id,
                    subscription_status="active",
                    subscription_id=session_id
                )
    
    async def handle_webhook(self, webhook_body: bytes, signature: str):
        """Handle Stripe webhook"""
        stripe_checkout = StripeCheckout(api_key=self.stripe_api_key, webhook_url="")
        
        try:
            webhook_response = await stripe_checkout.handle_webhook(webhook_body, signature)
            
            # Update transaction based on webhook
            if webhook_response.session_id:
                await self._process_webhook_event(webhook_response)
                
            return {"received": True}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")
    
    async def _process_webhook_event(self, webhook_response):
        """Process webhook event"""
        session_id = webhook_response.session_id
        
        # Find transaction
        transaction = await self.db.payment_transactions.find_one({"session_id": session_id})
        if not transaction:
            return
        
        # Prevent duplicate processing
        if transaction.get("payment_status") == "paid":
            return
        
        # Update transaction
        update_data = {
            "payment_status": webhook_response.payment_status,
            "status": webhook_response.event_type,
            "updated_at": datetime.utcnow()
        }
        
        await self.db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # If payment successful, activate subscription
        if webhook_response.payment_status == "paid":
            user_id = transaction.get("user_id")
            if user_id:
                from auth_service import AuthService
                auth_service = AuthService(self.db)
                await auth_service.update_user_subscription(
                    user_id=user_id,
                    subscription_status="active",
                    subscription_id=session_id
                )