import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API service for poker calculations
export class PokerAPI {
  static async analyzeHand(holeCards, communityCards, playerCount = 2, simulationIterations = 100000) {
    try {
      // Convert frontend card format to API format
      const formatCard = (card) => {
        if (!card) return null;
        return {
          rank: card.rank,
          suit: card.suit
        };
      };

      const requestData = {
        hole_cards: holeCards.map(formatCard).filter(Boolean),
        community_cards: communityCards.map(formatCard),
        player_count: playerCount,
        simulation_iterations: simulationIterations
      };

      const response = await axios.post(`${API}/analyze-hand`, requestData, {
        timeout: 30000 // 30 second timeout for simulations
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error analyzing hand:', error);
      
      let errorMessage = 'Failed to analyze hand';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Analysis timeout - try reducing simulation iterations';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  static async getHandRankings() {
    try {
      const response = await axios.get(`${API}/hand-rankings`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching hand rankings:', error);
      return {
        success: false,
        error: 'Failed to fetch hand rankings'
      };
    }
  }

  static async healthCheck() {
    try {
      const response = await axios.get(`${API}/health`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: 'API health check failed'
      };
    }
  }
}

// Helper function to validate card format
export const validateCards = (holeCards, communityCards) => {
  const errors = [];
  
  // Check hole cards
  if (!holeCards || holeCards.length !== 2) {
    errors.push('Exactly 2 hole cards are required');
  }
  
  // Check for valid cards
  const allCards = [...holeCards.filter(Boolean), ...communityCards.filter(Boolean)];
  const cardStrings = allCards.map(card => `${card.rank}_${card.suit}`);
  const uniqueCards = [...new Set(cardStrings)];
  
  if (cardStrings.length !== uniqueCards.length) {
    errors.push('Duplicate cards detected');
  }
  
  // Check community cards count
  const communityCount = communityCards.filter(Boolean).length;
  if (communityCount > 5) {
    errors.push('Maximum 5 community cards allowed');
  }
  
  return errors;
};