from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from auth_routes import get_current_user
from auth_models import User
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/community")

# Pydantic models for community features
class CommunityQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    content: str
    tags: List[str] = []
    status: str = "open"  # open, answered, closed
    upvotes: int = 0
    downvotes: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CommunityQuestionCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=200)
    content: str = Field(..., min_length=20, max_length=2000)
    tags: List[str] = Field(default=[], max_items=5)

class CommunityAnswer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question_id: str
    user_id: str
    content: str
    is_accepted: bool = False
    upvotes: int = 0
    downvotes: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CommunityAnswerCreate(BaseModel):
    content: str = Field(..., min_length=10, max_length=1500)

class CommunityStats(BaseModel):
    total_questions: int
    total_answers: int
    active_users: int
    top_contributors: List[dict] = []

# Get database dependency
def get_db() -> AsyncIOMotorDatabase:
    from server import db
    return db

@router.get("/stats")
async def get_community_stats(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get community statistics - accessible to all users"""
    try:
        # Count questions and answers
        total_questions = await db.community_questions.count_documents({})
        total_answers = await db.community_answers.count_documents({})
        
        # Count active users (users who posted in last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        active_users_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": thirty_days_ago}
                }
            },
            {
                "$group": {
                    "_id": "$user_id"
                }
            },
            {
                "$count": "active_users"
            }
        ]
        
        active_users_result = await db.community_questions.aggregate(active_users_pipeline).to_list(1)
        active_users = active_users_result[0]["active_users"] if active_users_result else 0
        
        # Get top contributors (users with most upvotes)
        top_contributors_pipeline = [
            {
                "$group": {
                    "_id": "$user_id",
                    "total_upvotes": {"$sum": "$upvotes"},
                    "questions_count": {"$sum": 1}
                }
            },
            {
                "$sort": {"total_upvotes": -1}
            },
            {
                "$limit": 5
            }
        ]
        
        top_contributors = await db.community_questions.aggregate(top_contributors_pipeline).to_list(5)
        
        return CommunityStats(
            total_questions=total_questions,
            total_answers=total_answers,
            active_users=active_users,
            top_contributors=top_contributors
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving community stats: {str(e)}"
        )

@router.get("/questions")
async def get_questions(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    tag: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get community questions with pagination and filtering"""
    try:
        # Build filter query
        filter_query = {}
        if tag:
            filter_query["tags"] = tag
        if status:
            filter_query["status"] = status
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"content": {"$regex": search, "$options": "i"}}
            ]
        
        # Calculate skip value for pagination
        skip = (page - 1) * limit
        
        # Get questions with pagination
        questions_cursor = db.community_questions.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
        questions = await questions_cursor.to_list(length=limit)
        
        # Get total count for pagination
        total_count = await db.community_questions.count_documents(filter_query)
        
        # Format questions for response
        formatted_questions = []
        for q in questions:
            # Get user info (name only for privacy)
            user_info = await db.users.find_one({"id": q["user_id"]}, {"name": 1})
            user_name = user_info.get("name", "Utilisateur Anonyme") if user_info else "Utilisateur Anonyme"
            
            # Count answers for this question
            answer_count = await db.community_answers.count_documents({"question_id": q["id"]})
            
            formatted_questions.append({
                **q,
                "user_name": user_name,
                "answer_count": answer_count
            })
        
        return {
            "questions": formatted_questions,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "pages": (total_count + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving questions: {str(e)}"
        )

@router.post("/questions")
async def create_question(
    question_data: CommunityQuestionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new community question - accessible to all users"""
    try:
        question = CommunityQuestion(
            user_id=current_user.id,
            **question_data.dict()
        )
        
        # Insert question into database
        result = await db.community_questions.insert_one(question.dict())
        
        if result.inserted_id:
            # Get user name for response
            user_name = current_user.name or "Utilisateur Anonyme"
            
            response_data = question.dict()
            response_data["user_name"] = user_name
            response_data["answer_count"] = 0
            
            return response_data
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create question"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating question: {str(e)}"
        )

@router.get("/questions/{question_id}")
async def get_question(
    question_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a specific question with its answers"""
    try:
        # Get question
        question = await db.community_questions.find_one({"id": question_id})
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Get user info
        user_info = await db.users.find_one({"id": question["user_id"]}, {"name": 1})
        user_name = user_info.get("name", "Utilisateur Anonyme") if user_info else "Utilisateur Anonyme"
        
        # Get answers for this question
        answers_cursor = db.community_answers.find({"question_id": question_id}).sort("created_at", 1)
        answers = await answers_cursor.to_list(length=None)
        
        # Format answers with user names
        formatted_answers = []
        for answer in answers:
            answer_user_info = await db.users.find_one({"id": answer["user_id"]}, {"name": 1})
            answer_user_name = answer_user_info.get("name", "Utilisateur Anonyme") if answer_user_info else "Utilisateur Anonyme"
            
            formatted_answers.append({
                **answer,
                "user_name": answer_user_name
            })
        
        return {
            **question,
            "user_name": user_name,
            "answers": formatted_answers
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving question: {str(e)}"
        )

@router.post("/questions/{question_id}/answers")
async def create_answer(
    question_id: str,
    answer_data: CommunityAnswerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create an answer to a question - accessible to all users"""
    try:
        # Verify question exists
        question = await db.community_questions.find_one({"id": question_id})
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        answer = CommunityAnswer(
            question_id=question_id,
            user_id=current_user.id,
            **answer_data.dict()
        )
        
        # Insert answer into database
        result = await db.community_answers.insert_one(answer.dict())
        
        if result.inserted_id:
            response_data = answer.dict()
            response_data["user_name"] = current_user.name or "Utilisateur Anonyme"
            
            return response_data
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create answer"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating answer: {str(e)}"
        )

@router.post("/questions/{question_id}/vote")
async def vote_question(
    question_id: str,
    vote_type: str = Query(..., regex="^(up|down)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Vote on a question"""
    try:
        # Check if question exists
        question = await db.community_questions.find_one({"id": question_id})
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question not found"
            )
        
        # Update vote count
        update_field = "upvotes" if vote_type == "up" else "downvotes"
        
        result = await db.community_questions.update_one(
            {"id": question_id},
            {
                "$inc": {update_field: 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count > 0:
            # Get updated question
            updated_question = await db.community_questions.find_one({"id": question_id})
            return {
                "question_id": question_id,
                "upvotes": updated_question["upvotes"],
                "downvotes": updated_question["downvotes"]
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update vote"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error voting on question: {str(e)}"
        )

@router.get("/discord")
async def get_discord_info():
    """Get Discord community information"""
    return {
        "title": "Rejoignez Notre Discord",
        "description": "Connectez-vous avec d'autres joueurs de poker, partagez vos stratégies et apprenez ensemble dans notre communauté Discord active.",
        "discord_link": "https://discord.gg/pokerpro",  # Replace with actual Discord link
        "member_count": "1,200+",
        "channels": [
            {"name": "🎯 stratégie-générale", "description": "Discussions sur la stratégie poker générale"},
            {"name": "📊 analyse-de-mains", "description": "Analysez vos mains avec la communauté"},
            {"name": "🎓 débutants", "description": "Zone dédiée aux nouveaux joueurs"},
            {"name": "🏆 tournois", "description": "Organisation et discussions sur les tournois"},
            {"name": "💬 discussion-générale", "description": "Discussions libres entre membres"}
        ],
        "guidelines": [
            "Soyez respectueux envers tous les membres",
            "Partagez uniquement du contenu lié au poker",
            "Utilisez les canaux appropriés pour vos messages",
            "Aidez les nouveaux membres à s'intégrer"
        ]
    }