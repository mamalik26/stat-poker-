from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
import logging
from pathlib import Path
from models import AnalysisRequest, AnalysisResponse, HandHistory
from poker_engine import PokerEngine, Card
from auth_routes import router as auth_router, get_current_subscribed_user, get_current_user
from community_routes import router as community_router
from auth_models import User
from usage_tracking import UsageTracker
from permissions_service import PermissionsService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="Poker Pro Calculator API",
    description="Advanced Texas Hold'em probability analysis with Monte Carlo simulations",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize poker engine and services
poker_engine = PokerEngine()
usage_tracker = UsageTracker(db)
permissions_service = PermissionsService(db)

# Get database function for dependency injection
def get_db() -> AsyncIOMotorDatabase:
    return db

@api_router.post("/analyze-hand", response_model=AnalysisResponse)
async def analyze_hand(
    request: AnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Analyze a poker hand and return win probabilities, hand strength, and strategic recommendations.
    
    Now includes usage tracking for free users with daily limits.
    """
    try:
        # Check permissions and usage limits
        usage_result = await usage_tracker.check_and_increment_usage(current_user.dict())
        
        if not usage_result['can_analyze']:
            # User has exceeded daily limit
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "limit_reached",
                    "message": "Vous avez atteint votre limite quotidienne de 5 analyses gratuites. Abonnez-vous pour un accès illimité.",
                    "remaining_analyses": usage_result['remaining_analyses'],
                    "reset_time": usage_result.get('reset_time'),
                    "is_premium": usage_result['is_premium']
                }
            )
        
        # Log the usage for analytics
        await permissions_service.log_feature_access_attempt(
            current_user.dict(), 'basic_calculator', True
        )
        
        # Validate card formats before conversion
        def validate_card_format(card):
            if not card:
                return True  # None is allowed
            if not hasattr(card, 'rank') or not hasattr(card, 'suit'):
                return False
            valid_ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
            valid_suits = ['hearts', 'diamonds', 'clubs', 'spades']
            return card.rank in valid_ranks and card.suit in valid_suits
        
        # Check hole cards format
        for i, card in enumerate(request.hole_cards):
            if not validate_card_format(card):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid hole card format at position {i+1}: {card}"
                )
        
        # Check community cards format
        for i, card in enumerate(request.community_cards):
            if not validate_card_format(card):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid community card format at position {i+1}: {card}"
                )
        
        # Convert request cards to engine format
        try:
            hole_cards = [Card(rank=card.rank, suit=card.suit) for card in request.hole_cards if card]
            community_cards = [
                Card(rank=card.rank, suit=card.suit) if card else None 
                for card in request.community_cards
            ]
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error converting card format: {str(e)}"
            )
        
        # Validate hole cards
        if len(hole_cards) != 2:
            raise HTTPException(
                status_code=400, 
                detail="Exactly 2 hole cards are required"
            )
        
        # Validate community cards count
        community_count = len([c for c in community_cards if c])
        if community_count > 5:
            raise HTTPException(
                status_code=400, 
                detail="Maximum 5 community cards allowed"
            )
        
        # Check for duplicate cards
        all_cards = hole_cards + [c for c in community_cards if c]
        card_strings = [f"{c.rank}_{c.suit}" for c in all_cards]
        if len(card_strings) != len(set(card_strings)):
            raise HTTPException(
                status_code=400,
                detail="Duplicate cards detected"
            )
        
        # Perform analysis
        result = poker_engine.analyze_hand(
            hole_cards=hole_cards,
            community_cards=community_cards,
            player_count=request.player_count,
            simulation_iterations=request.simulation_iterations
        )
        
        # Convert to response format with usage info
        response_dict = {
            'win_probability': result.win_probability,
            'tie_probability': result.tie_probability,
            'lose_probability': result.lose_probability,
            'hand_strength': result.hand_strength.__dict__,
            'opponent_ranges': [range.__dict__ for range in result.opponent_ranges],
            'recommendation': result.recommendation.__dict__,
            'calculations': result.calculations.__dict__,
            'usage_info': {
                'remaining_analyses': usage_result['remaining_analyses'],
                'is_premium': usage_result['is_premium'],
                'daily_limit': UsageTracker.FREE_DAILY_LIMIT if not usage_result['is_premium'] else None
            }
        }
        
        # Store in database (optional) - create response object for storage
        try:
            response_for_storage = AnalysisResponse(
                win_probability=result.win_probability,
                tie_probability=result.tie_probability,
                lose_probability=result.lose_probability,
                hand_strength=result.hand_strength.__dict__,
                opponent_ranges=[range.__dict__ for range in result.opponent_ranges],
                recommendation=result.recommendation.__dict__,
                calculations=result.calculations.__dict__
            )
            hand_history = HandHistory(
                analysis_request=request,
                analysis_response=response_for_storage,
                user_id=current_user.id
            )
            await db.hand_history.insert_one(hand_history.dict())
        except Exception as e:
            logging.warning(f"Failed to save hand history: {e}")
        
        return response_dict
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error analyzing hand: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during analysis: {str(e)}"
        )

@api_router.get("/usage-stats")
async def get_user_usage_stats(
    current_user: User = Depends(get_current_user)
):
    """Get current user's usage statistics"""
    try:
        stats = await usage_tracker.get_usage_stats(current_user.dict())
        return {
            "user_id": current_user.id,
            "daily_analyses": {
                "used": stats['current_count'],
                "remaining": stats['remaining_analyses'],
                "limit": UsageTracker.FREE_DAILY_LIMIT,
                "unlimited": stats['remaining_analyses'] == -1
            },
            "is_premium": stats['is_premium'],
            "limit_reached": stats['limit_reached'],
            "reset_time": stats.get('reset_time')
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting usage stats: {str(e)}"
        )

@api_router.get("/permissions")
async def get_user_permissions(
    current_user: User = Depends(get_current_user)
):
    """Get complete user permissions and feature access"""
    try:
        permissions = await permissions_service.get_user_permissions_summary(current_user.dict())
        return permissions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting permissions: {str(e)}"
        )

@api_router.post("/check-feature-access/{feature}")
async def check_feature_access(
    feature: str,
    current_user: User = Depends(get_current_user)
):
    """Check if user can access a specific feature"""
    try:
        access_result = await permissions_service.can_use_feature(current_user.dict(), feature)
        
        # Log the access attempt
        await permissions_service.log_feature_access_attempt(
            current_user.dict(), feature, access_result['allowed']
        )
        
        # Add upsell message if access is blocked
        if not access_result['allowed']:
            upsell = await permissions_service.get_premium_upsell_message(feature)
            access_result['upsell'] = upsell
        
        return access_result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error checking feature access: {str(e)}"
        )

@api_router.get("/hand-rankings")
async def get_hand_rankings():
    """
    Get poker hand rankings for reference.
    """
    rankings = [
        {"rank": 1, "name": "Royal Flush", "description": "A, K, Q, J, 10, all the same suit"},
        {"rank": 2, "name": "Straight Flush", "description": "Five cards in sequence, all the same suit"},
        {"rank": 3, "name": "Four of a Kind", "description": "Four cards of the same rank"},
        {"rank": 4, "name": "Full House", "description": "Three of a kind plus a pair"},
        {"rank": 5, "name": "Flush", "description": "Five cards of the same suit"},
        {"rank": 6, "name": "Straight", "description": "Five cards in sequence"},
        {"rank": 7, "name": "Three of a Kind", "description": "Three cards of the same rank"},
        {"rank": 8, "name": "Two Pair", "description": "Two different pairs"},
        {"rank": 9, "name": "One Pair", "description": "Two cards of the same rank"},
        {"rank": 10, "name": "High Card", "description": "When no other hand is achieved"}
    ]
    return {"rankings": rankings}

# Premium feature endpoints (require subscription or special access)
@api_router.get("/hand-history")
async def get_hand_history(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """Get user's hand history - Premium feature"""
    # Check feature access
    access_result = await permissions_service.can_use_feature(current_user.dict(), 'hand_history')
    
    if not access_result['allowed']:
        upsell = await permissions_service.get_premium_upsell_message('hand_history')
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "premium_required",
                "message": upsell['message'],
                "upsell": upsell
            }
        )
    
    try:
        # Get hand history for the user
        history_cursor = db.hand_history.find({"user_id": current_user.id}).sort("created_at", -1).skip(offset).limit(limit)
        history = await history_cursor.to_list(length=limit)
        
        # Count total for pagination
        total_count = await db.hand_history.count_documents({"user_id": current_user.id})
        
        return {
            "history": history,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving hand history: {str(e)}"
        )

@api_router.get("/")
async def root():
    return {"message": "Poker Probability Calculator API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "engine": "operational",
        "database": "connected" if client else "disconnected"
    }

# Include the router in the main app
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(community_router)

# Get allowed origins from environment
allowed_origins = [
    "http://localhost:3000",  # Local development
    "https://86fa4beb-2f95-4b09-9924-af4fde58ca53.preview.emergentagent.com",  # Production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()