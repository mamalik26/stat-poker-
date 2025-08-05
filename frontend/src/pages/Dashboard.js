import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  User, 
  CreditCard, 
  LogOut, 
  Calculator, 
  BarChart3, 
  Settings,
  CheckCircle,
  XCircle,
  Crown,
  Zap
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const { user, logout, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
    navigate('/login');
  };

  const handleManageSubscription = () => {
    // TODO: Implement Stripe customer portal redirect
    toast({
      title: "Bientôt disponible",
      description: "La gestion d'abonnement sera disponible prochainement",
    });
  };

  const getSubscriptionStatusBadge = () => {
    if (hasActiveSubscription()) {
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
          <CheckCircle className="w-4 h-4 mr-2" />
          Abonnement actif
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 px-3 py-1">
          <XCircle className="w-4 h-4 mr-2" />
          Aucun abonnement
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2D2D2D] to-[#1A1A1A] font-['Inter',sans-serif]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1B5E47] shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                👋 Bonjour, {user?.name}
              </h1>
              <p className="text-emerald-200">
                Bienvenue dans votre espace Poker Pro
              </p>
            </div>
            <div className="hidden md:block">
              {getSubscriptionStatusBadge()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        
        {/* Status Card */}
        <Card className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] border-gray-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <User className="w-6 h-6 text-emerald-400" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-gray-300 font-medium mb-2">Nom</h3>
                <p className="text-white text-lg">{user?.name}</p>
              </div>
              <div>
                <h3 className="text-gray-300 font-medium mb-2">Email</h3>
                <p className="text-white text-lg">{user?.email}</p>
              </div>
            </div>
            
            <Separator className="bg-gray-700/50" />
            
            <div>
              <h3 className="text-gray-300 font-medium mb-3">Statut de l'abonnement</h3>
              <div className="flex items-center justify-between">
                {getSubscriptionStatusBadge()}
                <div className="flex gap-3">
                  {hasActiveSubscription() ? (
                    <Button 
                      onClick={handleManageSubscription}
                      variant="outline" 
                      className="bg-transparent border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Gérer l'abonnement
                    </Button>
                  ) : (
                    <Link to="/pricing">
                      <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                        <Crown className="w-4 h-4 mr-2" />
                        Voir les offres
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Calculator Access */}
          <Card className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Calculateur Poker
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Analysez vos mains avec des simulations Monte Carlo avancées
              </p>
              {hasActiveSubscription() ? (
                <Link to="/calculator">
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                    <Calculator className="w-4 h-4 mr-2" />
                    Ouvrir le calculateur
                  </Button>
                </Link>
              ) : (
                <Link to="/pricing">
                  <Button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed" disabled>
                    <Crown className="w-4 h-4 mr-2" />
                    Abonnement requis
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] border-gray-700/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Statistiques
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Consultez l'historique de vos analyses
              </p>
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-xs text-gray-400">Mains analysées</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account */}
          <Card className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] border-gray-700/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Mon Compte
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Gérez vos informations personnelles
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700/50"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message for Non-Subscribers */}
        {!hasActiveSubscription() && (
          <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Crown className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Débloquez tout le potentiel de Poker Pro
                </h3>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Accédez aux analyses poker les plus avancées avec nos simulations Monte Carlo 
                  et recommandations stratégiques professionnelles.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <Zap className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-white font-semibold">Calculs instantanés</div>
                  <div className="text-gray-400 text-sm">100,000+ simulations</div>
                </div>
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-semibold">Analyses détaillées</div>
                  <div className="text-gray-400 text-sm">Probabilités précises</div>
                </div>
                <div className="text-center">
                  <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-white font-semibold">Support premium</div>
                  <div className="text-gray-400 text-sm">Aide prioritaire</div>
                </div>
              </div>
              
              <Link to="/pricing">
                <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold">
                  <Crown className="w-5 h-5 mr-2" />
                  Choisir un plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;