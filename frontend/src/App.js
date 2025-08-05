import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/toaster';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import ThankYou from './pages/ThankYou';
import Account from './pages/Account';
import Settings from './pages/Settings';

// Layout
import AppLayout from './components/AppLayout';

// Original calculator components
import PokerTable from './components/PokerTable';
import ProbabilityDashboard from './components/ProbabilityDashboard';
import TestCalculator from './TestCalculator';
import { AuthAPI } from './services/authAPI';
import { validateCards } from './services/pokerAPI';
import { useToast } from './hooks/use-toast';

// Calculator component (protected)
const Calculator = () => {
  const [analysis, setAnalysis] = useState(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCards, setCurrentCards] = useState({ holeCards: [null, null], communityCards: [null, null, null, null, null] });
  const { toast } = useToast();

  const handleCardsChange = (holeCards, communityCards) => {
    console.log('Cards changed:', { holeCards, communityCards });
    setCurrentCards({ holeCards, communityCards });
    setAnalysis(null);
  };

  const handleCalculate = async () => {
    const { holeCards, communityCards } = currentCards;
    
    const validHoleCards = holeCards.filter(Boolean);
    if (validHoleCards.length < 2) {
      toast({
        title: "Incomplete Hand",
        description: "Please select both hole cards before calculating",
        variant: "destructive",
      });
      return;
    }

    const validationErrors = validateCards(holeCards, communityCards);
    if (validationErrors.length > 0) {
      toast({
        title: "Invalid Cards",
        description: validationErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Use authenticated poker API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analyze-hand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthAPI.getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({
          hole_cards: holeCards.filter(Boolean),
          community_cards: communityCards,
          player_count: playerCount,
          simulation_iterations: 100000
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        const errorData = await response.json();
        toast({
          title: "Analysis Failed",
          description: errorData.detail || "Failed to analyze hand",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayersChange = (count) => {
    setPlayerCount(count);
    setAnalysis(null);
  };

  const canCalculate = currentCards.holeCards.filter(Boolean).length === 2;
  console.log('Can calculate:', canCalculate, 'Current cards:', currentCards);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2D2D2D] to-[#1A1A1A] font-['Inter',sans-serif] text-gray-100">
      <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1B5E47] shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              ♠️ Poker Pro Calculator
            </h1>
            <p className="text-lg text-emerald-200 opacity-90 font-medium">
              Advanced Texas Hold'em Probability Analysis
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
                aria-label="Calculate hand probabilities using Monte Carlo simulation"
                title={canCalculate ? "Run Monte Carlo simulation (100,000 iterations)" : "Select both hole cards to enable calculation"}
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing Hand...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🎯</span>
                    Calculate Probabilities
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <AppLayout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              <Route path="/account" element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="/thank-you" element={
                <ProtectedRoute>
                  <ThankYou />
                </ProtectedRoute>
              } />

              <Route path="/calculator" element={
                <ProtectedRoute requireSubscription={true}>
                  <Calculator />
                </ProtectedRoute>
              } />

              {/* Test route for card selector */}
              <Route path="/test-calculator" element={<TestCalculator />} />
            </Routes>
          </AppLayout>
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;