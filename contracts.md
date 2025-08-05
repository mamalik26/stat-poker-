# Poker Calculator Integration Contracts

## API Contracts

### POST /api/analyze-hand
**Purpose**: Analyze poker hand probabilities using Monte Carlo simulation and combinatorics

**Request Body:**
```json
{
  "hole_cards": [
    {"rank": "A", "suit": "spades"},
    {"rank": "K", "suit": "hearts"}
  ],
  "community_cards": [
    {"rank": "Q", "suit": "diamonds"},
    {"rank": "J", "suit": "clubs"},
    null,
    null,
    null
  ],
  "player_count": 3,
  "simulation_iterations": 100000
}
```

**Response Body:**
```json
{
  "win_probability": 45.67,
  "tie_probability": 3.21,
  "lose_probability": 51.12,
  "hand_strength": {
    "name": "Straight Draw",
    "description": "Open-ended straight draw",
    "strength": 4,
    "category": "drawing_hand"
  },
  "opponent_ranges": [
    {
      "profile": "Tight-Aggressive",
      "range": "22% of hands",
      "likely_holdings": ["High pairs (JJ+)", "Suited connectors"]
    }
  ],
  "recommendation": {
    "action": "Bet/Raise",
    "reason": "Strong drawing hand with fold equity",
    "confidence": "78%"
  },
  "calculations": {
    "method": "Monte Carlo (100,000 simulations)",
    "confidence": "±0.8%",
    "cards_remaining": 47,
    "simulation_time_ms": 234
  }
}
```

### GET /api/hand-rankings
**Purpose**: Return poker hand rankings for reference

**Response**: Array of hand types with relative strengths

## Frontend Integration Plan

### Current Mock Data (to be replaced):

1. **mock.js - getMockAnalysis()**: Replace with API call to `/api/analyze-hand`
2. **Random probabilities**: Replace with actual Monte Carlo simulation results
3. **Static hand strength**: Replace with real hand evaluation using poker library
4. **Mock opponent ranges**: Replace with calculated ranges based on player profiles

### Frontend Changes Required:

1. **Add API service layer** (`/src/services/pokerAPI.js`)
2. **Update App.js** to make real API calls instead of using mock data
3. **Add loading states** during simulation calculations
4. **Error handling** for invalid card combinations
5. **Remove mock.js dependencies** from components

## Backend Implementation Plan

### Phase 1: Core Engine (MVP)
- **Hand Evaluation**: Use `treys` or `deuces` library for fast hand ranking
- **Monte Carlo Simulation**: 100k+ iterations for preflop/flop scenarios
- **Combinatorial Analysis**: Exact enumeration for turn/river scenarios
- **Card Removal**: Account for known cards when calculating probabilities

### Phase 2: Advanced Features
- **Opponent Range Modeling**: Based on player profiles (tight/loose/aggressive/passive)
- **Strategic Recommendations**: EV-based decision making
- **Performance Optimization**: Caching and fast simulation algorithms

### Technology Stack:
- **Poker Library**: `treys` for hand evaluation (52-card deck representation)
- **Simulation**: Custom Monte Carlo implementation
- **API Framework**: FastAPI (already in place)
- **Database**: MongoDB for storing hand history (optional)

## Data Models

### Card Representation:
```python
class Card:
    rank: str  # '2'-'9', 'T', 'J', 'Q', 'K', 'A'
    suit: str  # 'hearts', 'diamonds', 'clubs', 'spades'
```

### Analysis Request:
```python
class AnalysisRequest:
    hole_cards: List[Card]
    community_cards: List[Optional[Card]]
    player_count: int
    simulation_iterations: int = 100000
```

### Analysis Response:
```python
class AnalysisResponse:
    win_probability: float
    tie_probability: float
    lose_probability: float
    hand_strength: HandStrength
    opponent_ranges: List[OpponentRange]
    recommendation: Recommendation
    calculations: CalculationDetails
```

## Testing Strategy

### Backend Testing:
1. **Unit tests** for hand evaluation accuracy
2. **Simulation validation** against known poker scenarios
3. **Performance benchmarks** for Monte Carlo speed
4. **Edge case handling** (invalid inputs, rare hand combinations)

### Integration Testing:
1. **API endpoint validation**
2. **Frontend-backend data flow**
3. **Real-time calculation performance**
4. **Error handling and user feedback**

## Performance Requirements

- **Simulation Speed**: < 500ms for 100k Monte Carlo iterations
- **Accuracy**: ±0.8% confidence interval for simulations
- **Combinatorial Precision**: Exact calculations when feasible (turn/river)
- **Concurrent Users**: Support multiple simultaneous calculations

## Error Handling

### Invalid Inputs:
- Duplicate cards selected
- Invalid card combinations
- Player count out of range (2-10)

### Calculation Errors:
- Simulation timeouts
- Library initialization failures
- Memory constraints for large simulations

This contract ensures seamless integration between the existing frontend and the new backend poker calculation engine.