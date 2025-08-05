from typing import Dict, Any, List
from usage_tracking import UsageTracker
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

class PermissionsService:
    """Central service for managing user permissions and feature access"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.usage_tracker = UsageTracker(db)
        
        # Define feature categories
        self.FREE_FEATURES = [
            'basic_calculator',
            'hand_selection',
            'basic_analysis',
            'poker_rules',
            'guides',
            'community_support',
            'basic_dashboard'
        ]
        
        self.PREMIUM_FEATURES = [
            'unlimited_analyses',
            'hand_history', 
            'pdf_reports',
            'hand_comparator',
            'training_mode',
            'custom_ranges',
            'advanced_statistics',
            'export_data',
            'priority_support',
            'advanced_dashboard'
        ]
    
    async def can_use_feature(self, user: Dict[str, Any], feature: str) -> Dict[str, Any]:
        """
        Check if user can access a specific feature
        Returns: {
            'allowed': bool,
            'reason': str,
            'upgrade_required': bool,
            'remaining_uses': int (for limited features)
        }
        """
        is_premium = await self.usage_tracker.is_premium_user(user)
        
        # Premium users can access everything
        if is_premium:
            return {
                'allowed': True,
                'reason': 'premium_access',
                'upgrade_required': False,
                'remaining_uses': -1
            }
        
        # Check if it's a free feature
        if feature in self.FREE_FEATURES:
            # Special handling for basic_calculator (has daily limit)
            if feature == 'basic_calculator':
                usage_stats = await self.usage_tracker.get_usage_stats(user)
                
                if usage_stats['limit_reached']:
                    return {
                        'allowed': False,
                        'reason': 'daily_limit_reached',
                        'upgrade_required': True,
                        'remaining_uses': 0,
                        'reset_time': usage_stats['reset_time']
                    }
                
                return {
                    'allowed': True,
                    'reason': 'free_with_limit',
                    'upgrade_required': False,
                    'remaining_uses': usage_stats['remaining_analyses']
                }
            
            return {
                'allowed': True,
                'reason': 'free_feature',
                'upgrade_required': False,
                'remaining_uses': -1
            }
        
        # Premium feature - requires upgrade
        return {
            'allowed': False,
            'reason': 'premium_required',
            'upgrade_required': True,
            'remaining_uses': 0
        }
    
    async def get_user_permissions_summary(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Get complete permissions summary for a user"""
        is_premium = await self.usage_tracker.is_premium_user(user)
        usage_stats = await self.usage_tracker.get_usage_stats(user)
        
        # Get accessible features
        accessible_features = self.FREE_FEATURES.copy()
        if is_premium:
            accessible_features.extend(self.PREMIUM_FEATURES)
        
        return {
            'user_id': user.get('id'),
            'email': user.get('email'),
            'is_premium': is_premium,
            'subscription_status': user.get('subscription_status', 'inactive'),
            'role': user.get('role', 'user'),
            
            # Usage information
            'daily_analyses': {
                'used': usage_stats['current_count'],
                'remaining': usage_stats['remaining_analyses'],
                'limit': UsageTracker.FREE_DAILY_LIMIT,
                'unlimited': usage_stats['remaining_analyses'] == -1,
                'limit_reached': usage_stats['limit_reached'],
                'reset_time': usage_stats.get('reset_time')
            },
            
            # Feature access
            'accessible_features': accessible_features,
            'premium_features_locked': [f for f in self.PREMIUM_FEATURES if not is_premium],
            
            # Upgrade info
            'upgrade_available': not is_premium,
            'upgrade_benefits': self.get_upgrade_benefits() if not is_premium else []
        }
    
    def get_upgrade_benefits(self) -> List[str]:
        """Get list of benefits for upgrading to premium"""
        return [
            "Analyses illimitées chaque jour",
            "Accès à l'historique complet des mains",
            "Génération de rapports PDF détaillés", 
            "Comparateur de mains avancé",
            "Mode d'entraînement personnalisé",
            "Création de ranges personnalisées",
            "Statistiques avancées et analytics",
            "Export de données en CSV/JSON",
            "Support prioritaire"
        ]
    
    async def check_analysis_permission(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Check if user can perform an analysis (with limit checking)"""
        return await self.usage_tracker.check_and_increment_usage(user)
    
    async def get_premium_upsell_message(self, feature: str) -> Dict[str, Any]:
        """Get contextual upsell message for a blocked feature"""
        messages = {
            'hand_history': {
                'title': "Historique des Mains Premium",
                'message': "Gardez une trace de toutes vos analyses et suivez votre progression avec l'historique complet des mains.",
                'cta': "Débloquer l'Historique"
            },
            'pdf_reports': {
                'title': "Rapports PDF Professionnels", 
                'message': "Générez des rapports détaillés en PDF pour vos sessions d'étude et partagez-les avec vos coéquipiers.",
                'cta': "Générer des Rapports"
            },
            'training_mode': {
                'title': "Mode Entraînement Avancé",
                'message': "Perfectionnez vos compétences avec des scénarios personnalisés et un feedback détaillé.",
                'cta': "Commencer l'Entraînement"
            },
            'unlimited_analyses': {
                'title': "Analyses Illimitées", 
                'message': "Vous avez atteint votre limite quotidienne de 5 analyses gratuites. Passez au premium pour un accès illimité.",
                'cta': "Accès Illimité"
            },
            'default': {
                'title': "Fonctionnalité Premium",
                'message': "Cette fonctionnalité est réservée aux membres premium. Débloquez toutes les fonctionnalités avancées.",
                'cta': "Passer au Premium"
            }
        }
        
        return messages.get(feature, messages['default'])
    
    async def log_feature_access_attempt(self, user: Dict[str, Any], feature: str, allowed: bool):
        """Log feature access attempts for analytics"""
        try:
            log_entry = {
                'user_id': user.get('id'),
                'email': user.get('email'),
                'feature': feature,
                'allowed': allowed,
                'user_type': 'premium' if await self.usage_tracker.is_premium_user(user) else 'free',
                'timestamp': datetime.utcnow()
            }
            
            await self.db.feature_access_logs.insert_one(log_entry)
            
        except Exception as e:
            logger.error(f"Error logging feature access: {e}")
    
    async def get_feature_usage_analytics(self) -> Dict[str, Any]:
        """Get analytics on feature usage for business insights"""
        try:
            # Get most requested premium features by free users
            pipeline = [
                {
                    "$match": {
                        "user_type": "free",
                        "allowed": False,
                        "timestamp": {"$gte": datetime.utcnow() - timedelta(days=30)}
                    }
                },
                {
                    "$group": {
                        "_id": "$feature",
                        "requests": {"$sum": 1},
                        "unique_users": {"$addToSet": "$user_id"}
                    }
                },
                {
                    "$project": {
                        "feature": "$_id",
                        "requests": 1,
                        "unique_users": {"$size": "$unique_users"}
                    }
                },
                {"$sort": {"requests": -1}}
            ]
            
            blocked_features = await self.db.feature_access_logs.aggregate(pipeline).to_list(length=10)
            
            return {
                "most_requested_premium_features": blocked_features,
                "period": "Last 30 days"
            }
            
        except Exception as e:
            logger.error(f"Error getting feature usage analytics: {e}")
            return {"error": str(e)}