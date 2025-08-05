from datetime import datetime, timedelta
from typing import Optional
import secrets
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth_models import User, UserCreate, PasswordResetToken

# Security configuration
SECRET_KEY = "poker_calculator_secret_key_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plaintext password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        user_data = await self.db.users.find_one({"email": email})
        if user_data:
            return User(**user_data)
        return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        user_data = await self.db.users.find_one({"id": user_id})
        if user_data:
            return User(**user_data)
        return None
    
    async def create_user(self, user_create: UserCreate) -> User:
        """Create new user"""
        # Check if user already exists
        existing_user = await self.get_user_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        user = User(
            name=user_create.name,
            email=user_create.email,
            hashed_password=self.get_password_hash(user_create.password)
        )
        
        # Save to database
        await self.db.users.insert_one(user.dict())
        return user
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user
    
    async def create_password_reset_token(self, user_id: str) -> str:
        """Create password reset token"""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
        
        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        
        await self.db.password_reset_tokens.insert_one(reset_token.dict())
        return token
    
    async def verify_reset_token(self, token: str) -> Optional[PasswordResetToken]:
        """Verify password reset token"""
        token_data = await self.db.password_reset_tokens.find_one({
            "token": token,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if token_data:
            return PasswordResetToken(**token_data)
        return None
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset user password with token"""
        reset_token = await self.verify_reset_token(token)
        if not reset_token:
            return False
        
        # Update password
        hashed_password = self.get_password_hash(new_password)
        await self.db.users.update_one(
            {"id": reset_token.user_id},
            {
                "$set": {
                    "hashed_password": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Mark token as used
        await self.db.password_reset_tokens.update_one(
            {"token": token},
            {
                "$set": {
                    "used": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return True
    
    async def update_user_subscription(self, user_id: str, subscription_status: str, subscription_id: Optional[str] = None):
        """Update user subscription status"""
        update_data = {
            "subscription_status": subscription_status,
            "updated_at": datetime.utcnow()
        }
        
        if subscription_id:
            update_data["subscription_id"] = subscription_id
        
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )