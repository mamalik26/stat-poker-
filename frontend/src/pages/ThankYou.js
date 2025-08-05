import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Loader2, Calculator, Crown, ArrowRight } from 'lucide-react';
import { AuthAPI } from '../services/authAPI';
import { useToast } from '../hooks/use-toast';

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const { refreshUser, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/pricing');
      return;
    }
    
    checkPaymentStatus();
  }, [sessionId]);

  const checkPaymentStatus = async (currentAttempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000; // 2 seconds

    if (currentAttempts >= maxAttempts) {
      toast({
        title: "Vérification expirée",
        description: "Vérifiez votre email pour la confirmation. Contactez le support si nécessaire.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      const result = await AuthAPI.checkPaymentStatus(sessionId);
      
      if (result.success) {
        const status = result.data;
        setPaymentStatus(status);

        if (status.payment_status === 'paid') {
          // Payment successful - refresh user data
          await refreshUser();
          setLoading(false);
          
          toast({
            title: "Paiement confirmé!",
            description: "Votre abonnement est maintenant actif",
          });
          return;
        } else if (status.status === 'expired') {
          toast({
            title: "Session expirée",
            description: "La session de paiement a expiré",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Payment still pending, continue polling
        setTimeout(() => {
          setAttempts(currentAttempts + 1);
          checkPaymentStatus(currentAttempts + 1);
        }, pollInterval);

      } else {
        toast({
          title: "Erreur de vérification",
          description: result.error,
          variant: "destructive"
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la vérification du paiement",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2D2D2D] to-[#1A1A1A] flex items-center justify-center px-4">
        <Card className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] border-gray-700/50 shadow-2xl max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Vérification du paiement
            </h2>
            <p className="text-gray-400 mb-4">
              Nous vérifions votre paiement, veuillez patienter...
            </p>
            <div className="text-sm text-gray-500">
              Tentative {attempts + 1}/5
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaymentSuccessful = paymentStatus?.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] via-[#2D2D2D] to-[#1A1A1A] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <Card className="bg-gradient-to-br from-[#2A2A2A] to-[#1F1F1F] border-gray-700/50 shadow-2xl">
          <CardHeader className="text-center pb-8 pt-12">
            <div className={`mx-auto mb-6 w-20 h-20 rounded-3xl flex items-center justify-center ${
              isPaymentSuccessful 
                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              {isPaymentSuccessful ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <Crown className="w-10 h-10 text-white" />
              )}
            </div>
            
            <CardTitle className="text-3xl font-bold text-white mb-4">
              {isPaymentSuccessful ? (
                "🎉 Merci pour votre abonnement !"
              ) : (
                "Paiement en attente"
              )}
            </CardTitle>
            
            <p className="text-gray-300 text-lg">
              {isPaymentSuccessful ? (
                "Votre abonnement Poker Pro Calculator est maintenant actif"
              ) : (
                "Votre paiement est en cours de traitement"
              )}
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pb-12">
            {isPaymentSuccessful ? (
              <>
                {/* Success Content */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                    Votre abonnement est actif
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Utilisateur:</span>
                      <div className="text-white font-medium">{user?.name}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <div className="text-white font-medium">{user?.email}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Statut:</span>
                      <div className="text-green-400 font-medium">Abonnement actif</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Montant:</span>
                      <div className="text-white font-medium">{paymentStatus?.amount_total/100}€</div>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Prochaines étapes</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                      <Calculator className="w-5 h-5 text-emerald-400" />
                      <span className="text-gray-300">Accédez au calculateur poker avancé</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                      <Crown className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">Profitez des fonctionnalités premium</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/calculator" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3 text-lg font-semibold">
                      <Calculator className="w-5 h-5 mr-2" />
                      Ouvrir le calculateur
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/dashboard" className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700/50 py-3 text-lg"
                    >
                      Tableau de bord
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Pending Content */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Paiement en cours de traitement
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Votre paiement est en cours de vérification. Cela peut prendre quelques minutes.
                  </p>
                  <p className="text-sm text-gray-400">
                    Vous recevrez un email de confirmation une fois le paiement validé.
                  </p>
                </div>

                {/* Actions for pending */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3"
                  >
                    <Loader2 className="w-4 h-4 mr-2" />
                    Vérifier à nouveau
                  </Button>
                  <Link to="/dashboard" className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700/50 py-3"
                    >
                      Tableau de bord
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThankYou;