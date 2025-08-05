import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle, Loader2, Crown, Zap, Users, Clock } from 'lucide-react';
import { AuthAPI } from '../services/authAPI';
import { useToast } from '../hooks/use-toast';

const Pricing = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const { isAuthenticated, hasActiveSubscription, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    loadPackages();
    checkPaymentReturn();
  }, []);

  const loadPackages = async () => {
    const result = await AuthAPI.getSubscriptionPackages();
    if (result.success) {
      setPackages(result.data);
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de charger les offres",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const checkPaymentReturn = () => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Redirect to thank you page
      navigate(`/thank-you?session_id=${sessionId}`, { replace: true });
    }
  };

  const handleSubscribe = async (packageId) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    if (hasActiveSubscription()) {
      toast({
        title: "Déjà abonné",
        description: "Vous avez déjà un abonnement actif",
        variant: "destructive"
      });
      return;
    }

    setCheckoutLoading(packageId);

    const result = await AuthAPI.createCheckoutSession(packageId);

    if (result.success) {
      // Redirect to Stripe checkout
      window.location.href = result.data.url;
    } else {
      toast({
        title: "Erreur de paiement",
        description: result.error,
        variant: "destructive"
      });
      setCheckoutLoading(null);
    }
  };

  const getPlanIcon = (packageId) => {
    switch (packageId) {
      case 'monthly': return Crown;
      case 'yearly': return Zap;
      default: return Users;
    }
  };

  const getPlanColor = (packageId) => {
    switch (packageId) {
      case 'monthly': return 'from-blue-500 to-blue-600';
      case 'yearly': return 'from-emerald-500 to-emerald-600';
      default: return 'from-purple-500 to-purple-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2D2D2D] to-[#1A1A1A] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xl font-medium">Chargement des offres...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2D2D2D] to-[#1A1A1A] font-['Inter',sans-serif]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1B5E47] shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choisissez votre plan
            </h1>
            <p className="text-xl text-emerald-200 mb-6">
              Accédez aux analyses poker les plus avancées
            </p>
            {hasActiveSubscription() && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Abonnement actif
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {packages.map((pkg) => {
            const Icon = getPlanIcon(pkg.id);
            const isPopular = pkg.id === 'yearly';
            
            return (
              <Card key={pkg.id} className={`relative bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] border-gray-700/50 shadow-2xl transition-all duration-300 hover:scale-105 ${isPopular ? 'ring-2 ring-emerald-500/50' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 text-sm font-semibold">
                      ⭐ Plus populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-8">
                  <div className={`mx-auto mb-4 w-16 h-16 bg-gradient-to-br ${getPlanColor(pkg.id)} rounded-2xl flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    {pkg.name}
                  </CardTitle>
                  <p className="text-gray-400 text-sm">{pkg.description}</p>
                  <div className="mt-6">
                    <div className="flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">{pkg.price.toFixed(0)}€</span>
                      <span className="text-gray-400 ml-2">/{pkg.id === 'yearly' ? 'an' : 'mois'}</span>
                    </div>
                    {pkg.id === 'yearly' && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          2 mois offerts
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(pkg.id)}
                    disabled={checkoutLoading === pkg.id || hasActiveSubscription()}
                    className={`w-full py-4 font-semibold text-lg transition-all duration-300 ${
                      isPopular 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white hover:shadow-xl hover:shadow-emerald-500/25' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-xl hover:shadow-blue-500/25'
                    } ${hasActiveSubscription() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {checkoutLoading === pkg.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Redirection...
                      </>
                    ) : hasActiveSubscription() ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Déjà abonné
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5 mr-2" />
                        {isAuthenticated ? 'S\'abonner' : 'S\'inscrire'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-[#2A2A2A] to-[#1F1F1F] rounded-2xl border border-gray-700/50 p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Pourquoi choisir Poker Pro Calculator ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-white font-semibold">Calculs instantanés</p>
                <p className="text-gray-400 text-sm">100k+ simulations Monte Carlo</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-white font-semibold">Analyses avancées</p>
                <p className="text-gray-400 text-sm">Recommandations stratégiques</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-white font-semibold">Interface pro</p>
                <p className="text-gray-400 text-sm">Expérience utilisateur optimale</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;