// Mock data for poker calculator frontend demo
export const CARD_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
export const CARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦', 
  clubs: '♣',
  spades: '♠'
};

export const SUIT_COLORS = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900',
  spades: 'text-gray-900'
};

// Mock calculation results
export const getMockAnalysis = (holeCards, communityCards) => {
  // Simulate different scenarios based on cards selected
  const totalCards = [...holeCards.filter(Boolean), ...communityCards.filter(Boolean)];
  const cardCount = totalCards.length;
  
  if (cardCount < 2) {
    return null;
  }

  // Mock probabilities that change based on cards
  const mockResults = {
    winProbability: Math.random() * 60 + 20, // 20-80%
    tieProbability: Math.random() * 10 + 2,  // 2-12%
    loseProbability: 0, // Will be calculated
    handStrength: getHandStrength(totalCards),
    opponentRanges: getMockOpponentRanges(),
    recommendation: getStrategicRecommendation(),
    calculations: {
      method: cardCount >= 5 ? 'Combinatorial' : 'Monte Carlo (100,000 simulations)',
      confidence: '±0.8%',
      cardsRemaining: 52 - cardCount
    }
  };

  mockResults.loseProbability = 100 - mockResults.winProbability - mockResults.tieProbability;
  return mockResults;
};

const getHandStrength = (cards) => {
  const strengths = [
    { name: 'High Card', description: 'Ace high', strength: 1 },
    { name: 'Pair', description: 'Pair of Kings', strength: 2 },
    { name: 'Two Pair', description: 'Kings and Tens', strength: 3 },
    { name: 'Three of a Kind', description: 'Trip Aces', strength: 4 },
    { name: 'Straight', description: 'Ten-high straight', strength: 5 },
    { name: 'Flush', description: 'Ace-high flush', strength: 6 },
    { name: 'Full House', description: 'Aces full of Kings', strength: 7 },
    { name: 'Four of a Kind', description: 'Quad Aces', strength: 8 },
    { name: 'Straight Flush', description: 'Royal flush', strength: 9 }
  ];
  
  return strengths[Math.floor(Math.random() * strengths.length)];
};

const getMockOpponentRanges = () => {
  const profiles = ['Tight-Aggressive', 'Loose-Passive', 'Maniac', 'Unknown'];
  return profiles.map(profile => ({
    profile,
    range: `${Math.floor(Math.random() * 30 + 10)}% of hands`,
    likelyHoldings: ['High pairs (JJ+)', 'Suited connectors', 'Broadway cards'].slice(0, Math.floor(Math.random() * 3) + 1)
  }));
};

const getStrategicRecommendation = () => {
  const actions = ['Fold', 'Check/Call', 'Bet/Raise', 'All-in'];
  const reasons = [
    'Strong hand with good pot odds',
    'Drawing hand with implied odds',
    'Weak hand, fold to preserve stack',
    'Bluff spot with fold equity',
    'Value bet with strong holding'
  ];
  
  return {
    action: actions[Math.floor(Math.random() * actions.length)],
    reason: reasons[Math.floor(Math.random() * reasons.length)],
    confidence: Math.floor(Math.random() * 40 + 60) + '%'
  };
};

// Generate all possible cards
export const generateDeck = () => {
  const deck = [];
  CARD_SUITS.forEach(suit => {
    CARD_RANKS.forEach(rank => {
      deck.push({ rank, suit, id: `${rank}_${suit}` });
    });
  });
  return deck;
};