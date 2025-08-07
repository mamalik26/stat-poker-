import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { TranslationProvider } from './hooks/useTranslation';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from './components/ui/toaster';
import UsageCounter from './components/UsageCounter';
import PremiumFeatureLock from './components/PremiumFeatureLock';

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
import CommunitySupport from './pages/CommunitySupport';

// Layout
import AppLayout from './components/AppLayout';

// Original calculator components
import PokerTable from './components/PokerTable';
import ProbabilityDashboard from './components/ProbabilityDashboard';
import TestCalculator from './TestCalculator';
import { AuthAPI } from './services/authAPI';
import { validateCards } from './services/pokerAPI';
import { useToast } from './hooks/use-toast';
import { useSettings } from './contexts/SettingsContext';

// Calculator component (protected) with usage limits
const Calculator = () => {
  const [analysis, setAnalysis] = useState(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCards, setCurrentCards] = useState({ holeCards: [null, null], communityCards: [null, null, null, null, null] });
  const [usageStats, setUsageStats] = useState(null);
  const { toast } = useToast();
  const { settings } = useSettings();

  const handleCardsChange = (holeCards, communityCards) => {
    console.log('Cards changed:', { holeCards, communityCards });
    setCurrentCards({ holeCards, communityCards });
    setAnalysis(null);
  };

  const fetchUsageStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/usage-stats`, {
        credentials: 'include',
        headers: AuthAPI.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
    return null;
  };

  const handleCalculate = async () => {
    const { holeCards, communityCards } = currentCards;
    
    const validHoleCards = holeCards.filter(Boolean);
    if (validHoleCards.length < 2) {
      toast({
        title: "Main incomplète",
        description: "Veuillez sélectionner vos deux cartes fermées avant de calculer",
        variant: "destructive",
      });
      return;
    }

    const validationErrors = validateCards(holeCards, communityCards);
    if (validationErrors.length > 0) {
      toast({
        title: "Cartes invalides",
        description: validationErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    console.log('🎯 Starting calculator analysis...');
    
    setIsLoading(true);
    
    try {
      // Check authentication status before making API call
      const authHeaders = AuthAPI.getAuthHeaders();
      console.log('🔐 Auth headers for analysis:', authHeaders);
      
      if (!authHeaders.Authorization) {
        console.log('❌ No authorization header found!');
        toast({
          title: "Authentification requise",
          description: "Connectez-vous pour utiliser le calculateur de probabilités.",
          variant: "destructive",
        });
        return;
      }

      // Use settings for simulation iterations
      const simulationIterations = settings.simulations || 100000;
      
      const requestPayload = {
        hole_cards: holeCards.filter(Boolean),
        community_cards: communityCards,
        player_count: playerCount,
        simulation_iterations: simulationIterations
      };
      
      console.log('📤 Sending request to analyze-hand:', requestPayload);
      console.log('📤 Headers:', {
        'Content-Type': 'application/json',
        ...authHeaders
      });
      
      // Use authenticated poker API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analyze-hand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        credentials: 'include',
        body: JSON.stringify(requestPayload)
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', [...response.headers.entries()]);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Analysis successful:', data);
        setAnalysis(data);
        
        // Update usage stats after successful analysis
        await fetchUsageStats();
        
        // Play success sound if enabled
        if (settings.soundEffects) {
          // This would be handled by the SettingsProvider
        }
        
        // Show notification if enabled
        if (settings.notifications) {
          toast({
            title: "Analyse terminée",
            description: `Probabilité de victoire: ${data.win_probability}%`,
          });
        }
      } else if (response.status === 429) {
        // Handle rate limit error
        const errorData = await response.json();
        console.log('⚠️ Rate limit reached:', errorData);
        const detail = errorData.detail;
        
        if (detail.error === 'limit_reached') {
          toast({
            title: "Limite quotidienne atteinte",
            description: detail.message,
            variant: "destructive",
          });
          
          // Update usage stats
          await fetchUsageStats();
          
          // Show premium upsell
          setAnalysis({
            error: 'limit_reached',
            message: detail.message,
            show_premium_upsell: true,
            remaining_analyses: detail.remaining_analyses,
            reset_time: detail.reset_time
          });
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: errorText };
        }
        
        console.log('❌ Parsed error data:', errorData);
        
        // Special handling for authentication errors
        if (response.status === 401) {
          toast({
            title: "Erreur d'authentification",
            description: "Votre session a expiré. Veuillez vous reconnecter.",
            variant: "destructive",
          });
          // Optionally redirect to login
        } else {
          toast({
            title: "Échec de l'analyse",
            description: errorData.detail || "Impossible d'analyser la main",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('❌ Network/Unexpected Error during analysis:', error);
      toast({
        title: "Erreur réseau",
        description: "Une erreur de réseau s'est produite lors de l'analyse",
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

  // Fetch usage stats on component mount
  React.useEffect(() => {
    fetchUsageStats();
  }, []);

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
            
            {/* Usage Counter Display */}
            <div className="mt-4 max-w-md mx-auto">
              <UsageCounter showDetails={true} />
            </div>
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
                title={canCalculate ? `Run Monte Carlo simulation (${(settings.simulations || 100000).toLocaleString()} iterations)` : "Select both hole cards to enable calculation"}
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analysing Hand...
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
              {analysis?.error === 'limit_reached' ? (
                <PremiumFeatureLock 
                  feature="unlimited_analyses"
                  size="large"
                  className="h-full"
                />
              ) : (
                <ProbabilityDashboard 
                  analysis={analysis} 
                  playerCount={playerCount}
                  isLoading={isLoading}
                />
              )}
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
      <SettingsProvider>
        <TranslationProvider>
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
                  
                  <Route path="/community-support" element={
                    <ProtectedRoute>
                      <CommunitySupport />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/thank-you" element={
                    <ProtectedRoute>
                      <ThankYou />
                    </ProtectedRoute>
                  } />

                  <Route path="/calculator" element={
                    <ProtectedRoute requireSubscription={false}>
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
        </TranslationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;