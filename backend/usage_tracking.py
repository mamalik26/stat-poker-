from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, date
from typing import Optional, Dict, Any
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class DailyUsage(BaseModel):
    """Model for tracking daily usage per user"""
    user_id: str
    analysis_count: int = 0
    last_analysis_date: str
    created_at: datetime = None
    updated_at: datetime = None

    def __init__(self, **data):
        if 'created_at' not in data:
            data['created_at'] = datetime.utcnow()
        if 'updated_at' not in data:
            data['updated_at'] = datetime.utcnow()
        super().__init__(**data)

class UsageTracker:
    """Service for tracking and limiting user usage"""
    
    # Configuration constants
    FREE_DAILY_LIMIT = 5
    PREMIUM_ROLES = ['moderator', 'admin']
    PREMIUM_SUBSCRIPTION_STATUSES = ['active']
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.daily_usage
    
    async def is_premium_user(self, user: Dict[str, Any]) -> bool:
        """Check if user has premium access"""
        return (
            user.get('role') in self.PREMIUM_ROLES or
            user.get('subscription_status') in self.PREMIUM_SUBSCRIPTION_STATUSES
        )
    
    async def get_today_string(self) -> str:
        """Get today's date as string"""
        return date.today().isoformat()
    
    async def get_user_daily_usage(self, user_id: str) -> Optional[DailyUsage]:
        """Get user's daily usage record"""
        try:
            usage_data = await self.collection.find_one({"user_id": user_id})
            if usage_data:
                return DailyUsage(**usage_data)
            return None
        except Exception as e:
            logger.error(f"Error getting daily usage for user {user_id}: {e}")
            return None
    
    async def create_or_update_usage(self, user_id: str, analysis_count: int = 0) -> DailyUsage:
        """Create or update daily usage record"""
        today = await self.get_today_string()
        
        try:
            usage = DailyUsage(
                user_id=user_id,
                analysis_count=analysis_count,
                last_analysis_date=today
            )
            
            await self.collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "analysis_count": analysis_count,
                        "last_analysis_date": today,
                        "updated_at": datetime.utcnow()
                    },
                    "$setOnInsert": {
                        "created_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            return usage
            
        except Exception as e:
            logger.error(f"Error updating usage for user {user_id}: {e}")
            raise
    
    async def check_and_increment_usage(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if user can make another analysis and increment counter
        Returns: {
            'can_analyze': bool,
            'remaining_analyses': int,
            'is_premium': bool,
            'limit_reached': bool,
            'reset_time': str (if limit reached)
        }
        """
        user_id = user.get('id')
        is_premium = await self.is_premium_user(user)
        today = await self.get_today_string()
        
        # Premium users have unlimited access
        if is_premium:
            # Still track usage for premium users (for analytics)
            usage = await self.get_user_daily_usage(user_id)
            if usage and usage.last_analysis_date == today:
                await self.create_or_update_usage(user_id, usage.analysis_count + 1)
            else:
                await self.create_or_update_usage(user_id, 1)
            
            return {
                'can_analyze': True,
                'remaining_analyses': -1,  # -1 indicates unlimited
                'is_premium': True,
                'limit_reached': False,
                'reset_time': None,
                'current_count': 0
            }
        
        # Get current usage
        usage = await self.get_user_daily_usage(user_id)
        current_count = 0
        
        # Reset counter if it's a new day
        if not usage or usage.last_analysis_date != today:
            current_count = 1
            await self.create_or_update_usage(user_id, current_count)
        else:
            current_count = usage.analysis_count
            
            # Check if limit reached
            if current_count >= self.FREE_DAILY_LIMIT:
                return {
                    'can_analyze': False,
                    'remaining_analyses': 0,
                    'is_premium': False,
                    'limit_reached': True,
                    'reset_time': self._get_next_reset_time(),
                    'current_count': current_count
                }
            
            # Increment counter
            current_count += 1
            await self.create_or_update_usage(user_id, current_count)
        
        remaining = max(0, self.FREE_DAILY_LIMIT - current_count)
        
        return {
            'can_analyze': True,
            'remaining_analyses': remaining,
            'is_premium': False,
            'limit_reached': False,
            'reset_time': None,
            'current_count': current_count
        }
    
    async def get_usage_stats(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Get current usage statistics without incrementing"""
        user_id = user.get('id')
        is_premium = await self.is_premium_user(user)
        today = await self.get_today_string()
        
        if is_premium:
            return {
                'remaining_analyses': -1,  # Unlimited
                'is_premium': True,
                'limit_reached': False,
                'reset_time': None,
                'current_count': 0
            }
        
        usage = await self.get_user_daily_usage(user_id)
        current_count = 0
        
        if usage and usage.last_analysis_date == today:
            current_count = usage.analysis_count
        
        remaining = max(0, self.FREE_DAILY_LIMIT - current_count)
        limit_reached = current_count >= self.FREE_DAILY_LIMIT
        
        return {
            'remaining_analyses': remaining,
            'is_premium': False,
            'limit_reached': limit_reached,
            'reset_time': self._get_next_reset_time() if limit_reached else None,
            'current_count': current_count
        }
    
    def _get_next_reset_time(self) -> str:
        """Get the next reset time (midnight)"""
        from datetime import timedelta
        tomorrow = date.today() + timedelta(days=1)
        return f"{tomorrow.isoformat()} 00:00:00"
    
    async def can_use_advanced_features(self, user: Dict[str, Any]) -> bool:
        """Check if user can access premium features"""
        return await self.is_premium_user(user)
    
    async def get_premium_features_list(self) -> list:
        """Get list of premium-only features"""
        return [
            'unlimited_analyses',
            'hand_history',
            'pdf_reports', 
            'hand_comparator',
            'training_mode',
            'custom_ranges',
            'advanced_statistics',
            'export_data'
        ]
    
    async def reset_daily_usage(self, user_id: str) -> bool:
        """Reset daily usage for a specific user (admin function)"""
        try:
            today = await self.get_today_string()
            await self.create_or_update_usage(user_id, 0)
            logger.info(f"Reset daily usage for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error resetting usage for user {user_id}: {e}")
            return False
    
    async def get_usage_analytics(self, days: int = 7) -> Dict[str, Any]:
        """Get usage analytics for admin dashboard"""
        try:
            from datetime import timedelta
            
            end_date = date.today()
            start_date = end_date - timedelta(days=days)
            
            pipeline = [
                {
                    "$match": {
                        "last_analysis_date": {
                            "$gte": start_date.isoformat(),
                            "$lte": end_date.isoformat()
                        }
                    }
                },
                {
                    "$group": {
                        "_id": "$last_analysis_date",
                        "total_analyses": {"$sum": "$analysis_count"},
                        "active_users": {"$sum": 1},
                        "users_at_limit": {
                            "$sum": {
                                "$cond": [
                                    {"$gte": ["$analysis_count", self.FREE_DAILY_LIMIT]},
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            
            results = await self.collection.aggregate(pipeline).to_list(length=None)
            
            return {
                "daily_stats": results,
                "period": f"{start_date} to {end_date}",
                "total_days": days
            }
            
        except Exception as e:
            logger.error(f"Error getting usage analytics: {e}")
            return {"error": str(e)}