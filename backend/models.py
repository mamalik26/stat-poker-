from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class Card(BaseModel):
    rank: str = Field(..., description="Card rank: 2-9, 10, J, Q, K, A")
    suit: str = Field(..., description="Card suit: hearts, diamonds, clubs, spades")

class AnalysisRequest(BaseModel):
    hole_cards: List[Card] = Field(..., description="Player's two hole cards")
    community_cards: List[Optional[Card]] = Field(..., description="Community cards (flop, turn, river)")
    player_count: int = Field(2, ge=2, le=10, description="Number of players in the hand")
    simulation_iterations: int = Field(100000, ge=10000, le=500000, description="Monte Carlo simulation iterations")

class HandStrength(BaseModel):
    name: str = Field(..., description="Name of the hand (e.g., 'Pair', 'Straight')")
    description: str = Field(..., description="Detailed description (e.g., 'Pair of Kings')")
    strength: int = Field(..., ge=1, le=9, description="Hand strength rating (1-9, higher is better)")
    category: str = Field(..., description="Hand category (e.g., 'made_hand', 'drawing_hand')")

class OpponentRange(BaseModel):
    profile: str = Field(..., description="Player profile (e.g., 'Tight-Aggressive')")
    range: str = Field(..., description="Estimated range percentage")
    likely_holdings: List[str] = Field(..., description="List of likely hand types")

class Recommendation(BaseModel):
    action: str = Field(..., description="Recommended action (Fold, Check/Call, Bet/Raise)")
    reason: str = Field(..., description="Explanation for the recommendation")
    confidence: str = Field(..., description="Confidence level in the recommendation")

class CalculationDetails(BaseModel):
    method: str = Field(..., description="Calculation method used")
    confidence: str = Field(..., description="Statistical confidence interval")
    cards_remaining: int = Field(..., description="Number of unknown cards remaining")
    simulation_time_ms: int = Field(..., description="Time taken for calculations in milliseconds")

class AnalysisResponse(BaseModel):
    win_probability: float = Field(..., ge=0, le=100, description="Probability of winning (%)")
    tie_probability: float = Field(..., ge=0, le=100, description="Probability of tying (%)")
    lose_probability: float = Field(..., ge=0, le=100, description="Probability of losing (%)")
    hand_strength: HandStrength
    opponent_ranges: List[OpponentRange]
    recommendation: Recommendation
    calculations: CalculationDetails

class HandHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    analysis_request: AnalysisRequest
    analysis_response: AnalysisResponse
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None