#!/usr/bin/env python3
"""
Script to create a moderator account with full access to all features
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from auth_service import AuthService
from auth_models import UserCreate

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_moderator():
    """Create moderator account"""
    
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Initialize auth service
    auth_service = AuthService(db)
    
    # Moderator credentials
    moderator_data = UserCreate(
        name="Poker Pro Modérateur",
        email="moderateur@pokerpro.com",
        password="PokerMod2024!"
    )
    
    try:
        # Check if moderator already exists
        existing_user = await auth_service.get_user_by_email(moderator_data.email)
        if existing_user:
            print(f"❌ Moderator account already exists with email: {moderator_data.email}")
            
            # Update existing user to moderator role
            await db.users.update_one(
                {"email": moderator_data.email},
                {"$set": {"role": "moderator", "subscription_status": "active"}}
            )
            print(f"✅ Updated existing user to moderator role")
        else:
            # Create new user
            user = await auth_service.create_user(moderator_data)
            
            # Update user to moderator role and active subscription
            await db.users.update_one(
                {"id": user.id},
                {"$set": {"role": "moderator", "subscription_status": "active"}}
            )
            
            print(f"✅ Moderator account created successfully!")
        
        print("\n🔐 MODERATOR CREDENTIALS:")
        print(f"📧 Email: {moderator_data.email}")
        print(f"🔑 Password: {moderator_data.password}")
        print(f"👤 Role: moderator")
        print(f"💳 Subscription: active (permanent)")
        print(f"🎯 Access: Full calculator access + admin features")
        
    except Exception as e:
        print(f"❌ Error creating moderator account: {e}")
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_moderator())