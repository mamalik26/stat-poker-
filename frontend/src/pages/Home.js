import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  BarChart3, 
  Brain, 
  Calculator, 
  Sparkles, 
  CheckCircle, 
  TrendingUp,
  Users,
  Target,
  ArrowRight
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  const features = [
    {
      icon: <BarChart3 className="h-8 w-8 text-emerald-400" />,
      title: "Calculs probabilistes en direct",
      description: "Obtenez les pourcentages de victoire, égalité et défaite en temps réel pour chaque main."
    },
    {
      icon: <Brain className="h-8 w-8 text-emerald-400" />,
      title: "Simulation Monte Carlo",
      description: "Plus de 100 000 simulations par analyse pour des résultats d'une précision exceptionnelle."
    },
    {
      icon: <Calculator className="h-8 w-8 text-emerald-400" />,
      title: "Analyse des ranges adverses",
      description: "Évaluez les mains possibles de vos adversaires selon le contexte et leur style de jeu."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-emerald-400" />,
      title: "Recommandations stratégiques",
      description: "Recevez des conseils basés sur les mathématiques : check, bet, fold ou raise selon l'EV."
    }
  ];

  const advantages = [
    "Interface intuitive pour les joueurs débutants comme expérimentés",
    "Mise à jour dynamique à chaque carte révélée (flop, turn, river)",
    "Analyse basée sur les mathématiques, pas sur l'intuition",
    "Prise en compte du nombre de joueurs et des styles de jeu",
    "Calculs de combinatorics et inférences bayésiennes avancées"
  ];

  const plans = [
    {
      name: "Découverte",
      price: "Gratuit",
      description: "Accès limité pour tester l'outil",
      features: ["5 analyses par jour", "Fonctionnalités de base", "Support communautaire"]
    },
    {
      name: "Pro",
      price: "29€/mois",
      description: "Accès complet pour joueurs sérieux",
      features: ["Analyses illimitées", "Toutes les fonctionnalités", "Support prioritaire"],
      popular: true
    },
    {
      name: "Pro Annuel",
      price: "290€/an",
      description: "Économisez 2 mois sur l'abonnement annuel",
      features: ["Analyses illimitées", "Toutes les fonctionnalités", "Support prioritaire", "2 mois offerts"]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-emerald-950/20" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Maîtrisez le poker avec les 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500"> probabilités</span> et 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500"> l'IA</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Un outil stratégique qui vous aide à prendre des décisions plus intelligentes à chaque main, 
                  grâce à une analyse probabiliste en temps réel.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  {user ? 'Accéder au calculateur' : 'Commencer gratuitement'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={handleViewPricing}
                  variant="outline" 
                  className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10 px-8 py-3 text-lg font-semibold transition-all duration-300"
                >
                  Voir les formules
                </Button>
              </div>
            </div>
            
            <div className="mt-12 lg:mt-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-3xl blur-3xl" />
                <div className="relative bg-card/50 backdrop-blur-sm border border-emerald-600/20 rounded-2xl p-8">
                  <div className="text-center space-y-4">
                    <div className="text-2xl font-bold text-emerald-400">Exemple d'analyse</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-green-500/20 rounded-lg p-3">
                        <div className="text-green-400 font-semibold">Victoire</div>
                        <div className="text-2xl font-bold">63.75%</div>
                      </div>
                      <div className="bg-yellow-500/20 rounded-lg p-3">
                        <div className="text-yellow-400 font-semibold">Égalité</div>
                        <div className="text-2xl font-bold">1.81%</div>
                      </div>
                      <div className="bg-red-500/20 rounded-lg p-3">
                        <div className="text-red-400 font-semibold">Défaite</div>
                        <div className="text-2xl font-bold">34.44%</div>
                      </div>
                      <div className="bg-blue-500/20 rounded-lg p-3">
                        <div className="text-blue-400 font-semibold">Recommandation</div>
                        <div className="text-lg font-bold">BET</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ce que vous pouvez faire avec notre outil
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Des fonctionnalités avancées pour transformer votre jeu de poker
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-muted/50 border-emerald-600/20 hover:border-emerald-600/40 transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Pourquoi choisir cet outil ?
              </h2>
              <div className="space-y-4">
                {advantages.map((advantage, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">{advantage}</p>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <Button 
                  onClick={handleGetStarted}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {user ? 'Accéder maintenant' : 'Essayer gratuitement'}
                </Button>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-green-600/10 rounded-2xl blur-2xl" />
                <div className="relative bg-card border border-emerald-600/20 rounded-xl p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Interface Poker Pro</h3>
                      <Badge className="bg-emerald-600/20 text-emerald-400">Live</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">Précision</div>
                        <div className="text-lg font-bold">99.8%</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">Joueurs</div>
                        <div className="text-lg font-bold">2-10</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <Target className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">Simulations</div>
                        <div className="text-lg font-bold">100K+</div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 text-center">
                        <Calculator className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">Temps</div>
                        <div className="text-lg font-bold">&lt;1s</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choisissez votre formule
            </h2>
            <p className="text-xl text-muted-foreground">
              Des options adaptées à tous les niveaux de jeu
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-emerald-600 bg-emerald-600/5' : 'border-muted-foreground/20'} transition-all duration-300 hover:scale-105`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white">
                    Populaire
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-emerald-400 mt-2">{plan.price}</div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              onClick={handleViewPricing}
              variant="outline" 
              className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/10"
            >
              Voir toutes les formules
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-3xl blur-3xl opacity-20" />
            <div className="relative bg-gradient-to-r from-emerald-600/90 to-green-600/90 rounded-2xl p-12 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Essayez l'outil gratuitement dès maintenant
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Rejoignez les joueurs qui ont déjà amélioré leur jeu grâce aux mathématiques
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!user ? (
                  <>
                    <Button 
                      onClick={() => navigate('/register')}
                      size="lg"
                      className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-8 py-3 transition-all duration-300 transform hover:scale-105"
                    >
                      Créer un compte
                    </Button>
                    <Button 
                      onClick={() => navigate('/login')}
                      variant="outline" 
                      size="lg"
                      className="border-white text-white hover:bg-white/10 px-8 py-3 transition-all duration-300"
                    >
                      Se connecter
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => navigate('/calculator')}
                    size="lg"
                    className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-8 py-3 transition-all duration-300 transform hover:scale-105"
                  >
                    Accéder au calculateur
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
              </div>
              
              <div className="mt-6">
                <Link 
                  to="/pricing" 
                  className="text-white/80 hover:text-white underline text-sm transition-colors duration-300"
                >
                  Comparer les formules avant de s'inscrire
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;