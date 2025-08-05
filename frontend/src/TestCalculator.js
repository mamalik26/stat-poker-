import React, { useState, useCallback } from 'react';
import PokerTable from './components/PokerTable';
import ProbabilityDashboard from './components/ProbabilityDashboard';

// Test component to showcase the improved card selector
const TestCalculator = () => {
  const [analysis, setAnalysis] = useState(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCards, setCurrentCards] = useState({ holeCards: [null, null], communityCards: [null, null, null, null, null] });

  const handleCardsChange = useCallback((holeCards, communityCards) => {
    setCurrentCards({ holeCards, communityCards });
    setAnalysis(null);
  }, []);

  const handleCalculate = useCallback(async () => {
    // Mock calculation for testing
    setIsLoading(true);
    setTimeout(() => {
      setAnalysis({
        win_probability: 45.7,
        tie_probability: 3.2,
        lose_probability: 51.1,
        hand_strength: {
          name: "High Card",
          description: "Ace high",
          strength: 2,
          category: "high_card"
        },
        opponent_ranges: [{
          profile: "Tight-Aggressive",
          range: "20% of hands",
          likely_holdings: ["High pairs", "Strong aces"]
        }],
        recommendation: {
          action: "Fold",
          reason: "Weak hand, fold to preserve stack",
          confidence: "80%"
        },
        calculations: {
          method: "Monte Carlo (100,000 simulations)",
          confidence: "±0.8%",
          cards_remaining: 50,
          simulation_time_ms: 250
        }
      });
      setIsLoading(false);
    }, 2000);
  }, [currentCards, playerCount]);

  const handlePlayersChange = useCallback((count) => {
    setPlayerCount(count);
    setAnalysis(null);
  }, []);

  const canCalculate = currentCards.holeCards.filter(Boolean).length === 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2D2D2D] to-[#1A1A1A] font-['Inter',sans-serif] text-gray-100">
      <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1B5E47] shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              ♠️ Test du Sélecteur de Cartes Amélioré
            </h1>
            <p className="text-lg text-emerald-200 opacity-90 font-medium">
              Interface compacte et ergonomique
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden">
              <PokerTable 
                onCardsChange={handleCardsChange}
                onPlayersChange={handlePlayersChange}
                isLoading={isLoading}
              />
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleCalculate}
                disabled={!canCalculate || isLoading}
                className={`
                  px-8 py-4 rounded-2xl font-bold text-lg tracking-wide transition-all duration-300
                  flex items-center gap-3 shadow-xl
                  ${canCalculate && !isLoading
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:shadow-2xl hover:shadow-emerald-500/25 hover:-translate-y-1 hover:scale-105' 
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed opacity-60'
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Test en cours...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🃏</span>
                    Tester le Calculateur
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] rounded-3xl shadow-2xl border border-gray-700/50 p-6 h-full">
              <ProbabilityDashboard 
                analysis={analysis} 
                playerCount={playerCount}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCalculator;