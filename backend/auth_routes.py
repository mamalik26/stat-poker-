from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth_models import *
from auth_service import AuthService
from subscription_service import SubscriptionService
import os
from datetime import timedelta

router = APIRouter(prefix="/api/auth")
security = HTTPBearer()

# Get database dependency
def get_db() -> AsyncIOMotorDatabase:
    from server import db
    return db

# Get current user from JWT token (from cookie or Authorization header)
async def get_current_user(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> User:
    auth_service = AuthService(db)
    
    # Debug: Log all headers and cookies
    print(f"🔍 [AUTH DEBUG] Request headers: {dict(request.headers)}")
    print(f"🔍 [AUTH DEBUG] Request cookies: {request.cookies}")
    
    # Try to get token from cookie first, then from Authorization header
    token = None
    
    # Check cookie first
    cookie_token = request.cookies.get("access_token")
    print(f"🔍 [AUTH DEBUG] Raw cookie token: {cookie_token}")
    
    if cookie_token:
        if cookie_token.startswith('"Bearer ') and cookie_token.endswith('"'):
            # Handle quoted Bearer token: "Bearer token"
            token = cookie_token[8:-1]  # Remove "Bearer and trailing quote
            print(f"🔧 [AUTH DEBUG] Extracted token from quoted Bearer cookie: {token[:20]}...")
        elif cookie_token.startswith("Bearer "):
            # Handle Bearer token: Bearer token
            token = cookie_token.split(" ")[1]
            print(f"🔧 [AUTH DEBUG] Extracted token from Bearer cookie: {token[:20]}...")
        else:
            # Handle raw token
            token = cookie_token
            print(f"🔧 [AUTH DEBUG] Using raw token from cookie: {token[:20]}...")
    
    # If no cookie token, check Authorization header
    if not token:
        authorization = request.headers.get("Authorization")
        print(f"🔍 [AUTH DEBUG] Authorization header: {authorization}")
        
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            print(f"🔧 [AUTH DEBUG] Extracted token from Authorization header: {token[:20]}...")
    
    if not token:
        print("❌ [AUTH DEBUG] No token found in cookies or headers")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ [AUTH DEBUG] Token found, verifying: {token[:20]}...")
    
    # Verify token
    payload = auth_service.verify_token(token)
    if payload is None:
        print("❌ [AUTH DEBUG] Token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ [AUTH DEBUG] Token verified, payload: {payload}")
    
    # Get user
    user_id = payload.get("sub")
    if user_id is None:
        print("❌ [AUTH DEBUG] No user ID in token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = await auth_service.get_user_by_id(user_id)
    if user is None:
        print(f"❌ [AUTH DEBUG] User not found for ID: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    print(f"✅ [AUTH DEBUG] User authenticated: {user.email}")
    return user

# Get current user with active subscription or moderator role
async def get_current_subscribed_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role in ["moderator", "admin"]:
        return current_user  # Moderators and admins have full access
    
    if current_user.subscription_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active subscription required"
        )
    return current_user

@router.post("/register", response_model=Token)
async def register(
    user_create: UserCreate,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Register new user"""
    auth_service = AuthService(db)
    
    # Create user
    user = await auth_service.create_user(user_create)
    
    # Create access token
    access_token = auth_service.create_access_token(
        data={"sub": user.id, "email": user.email}
    )
    
    # Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=False,  # Allow JavaScript access for debugging
        max_age=30 * 24 * 60 * 60,  # 30 days
        samesite="lax",
        secure=False  # Allow on HTTP for local development
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            subscription_status=user.subscription_status,
            role=user.role,
            created_at=user.created_at
        )
    )

@router.post("/login", response_model=Token)
async def login(
    user_login: UserLogin,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Login user"""
    auth_service = AuthService(db)
    
    # Authenticate user
    user = await auth_service.authenticate_user(user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = auth_service.create_access_token(
        data={"sub": user.id, "email": user.email}
    )
    
    # Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=False,  # Allow JavaScript access for debugging
        max_age=30 * 24 * 60 * 60,  # 30 days
        samesite="lax",
        secure=False  # Allow on HTTP for local development
    )
    
    return Token(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            subscription_status=user.subscription_status,
            role=user.role,
            created_at=user.created_at
        )
    )

@router.post("/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Request password reset"""
    auth_service = AuthService(db)
    
    # Check if user exists
    user = await auth_service.get_user_by_email(request.email)
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Create reset token
    reset_token = await auth_service.create_password_reset_token(user.id)
    
    # TODO: Send email with reset link
    # For now, we'll just return the token (remove in production)
    return {
        "message": "Password reset link sent to your email",
        "reset_token": reset_token  # Remove this in production
    }

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Reset password with token"""
    auth_service = AuthService(db)
    
    # Reset password
    success = await auth_service.reset_password(request.token, request.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {"message": "Password successfully reset"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        subscription_status=current_user.subscription_status,
        role=current_user.role,
        created_at=current_user.created_at
    )

# Subscription routes
@router.get("/packages")
async def get_subscription_packages(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get available subscription packages"""
    subscription_service = SubscriptionService(db)
    return subscription_service.get_packages()

@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create Stripe checkout session"""
    subscription_service = SubscriptionService(db)
    
    session = await subscription_service.create_checkout_session(
        package_id=request.package_id,
        origin_url=request.origin_url,
        user_id=current_user.id
    )
    
    return session

@router.get("/payment/status/{session_id}")
async def check_payment_status(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Check payment status"""
    subscription_service = SubscriptionService(db)
    return await subscription_service.check_payment_status(session_id)

@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Handle Stripe webhooks"""
    subscription_service = SubscriptionService(db)
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    return await subscription_service.handle_webhook(body, signature)