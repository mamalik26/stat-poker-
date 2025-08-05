import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Crown, Lock, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumFeatureLock = ({ 
  feature = 'premium_feature',
  title = 'Fonctionnalité Premium',
  description = 'Cette fonctionnalité est réservée aux membres premium.',
  benefits = [],
  size = 'default', // 'small', 'default', 'large'
  showBenefits = true,
  className = ''
}) => {
  const navigate = useNavigate();

  const getFeatureConfig = (feature) => {
    const configs = {
      hand_history: {
        title: 'Historique des Mains',
        description: 'Gardez une trace de toutes vos analyses et suivez votre progression.',
        icon: '📊',
        benefits: [
          'Historique complet de vos analyses',
          'Statistiques de performance',
          'Export des données',
          'Analyse de progression'
        ]
      },
      pdf_reports: {
        title: 'Rapports PDF',
        description: 'Générez des rapports professionnels de vos sessions.',
        icon: '📄',
        benefits: [
          'Rapports PDF détaillés',
          'Graphiques et statistiques',
          'Format professionnel',
          'Partage facilité'
        ]
      },
      hand_comparator: {
        title: 'Comparateur de Mains',
        description: 'Comparez différentes mains dans des situations identiques.',
        icon: '⚖️',
        benefits: [
          'Comparaison côte à côte',
          'Analyse différentielle',
          'Recommandations adaptées',
          'Interface intuitive'
        ]
      },
      training_mode: {
        title: 'Mode Entraînement',
        description: 'Perfectionnez vos compétences avec des scénarios personnalisés.',
        icon: '🎯',
        benefits: [
          'Scénarios d\'entraînement',
          'Feedback détaillé',
          'Progression trackée',
          'Défis personnalisés'
        ]
      },
      custom_ranges: {
        title: 'Ranges Personnalisées',
        description: 'Créez et gérez vos propres ranges de mains.',
        icon: '🎨',
        benefits: [
          'Création de ranges custom',
          'Sauvegarde et partage',
          'Templates avancés',
          'Import/Export'
        ]
      },
      unlimited_analyses: {
        title: 'Analyses Illimitées',
        description: 'Analysez autant de mains que vous le souhaitez, sans limite.',
        icon: '♾️',
        benefits: [
          'Analyses illimitées par jour',
          'Pas de restrictions',
          'Accès instantané',
          'Sessions prolongées'
        ]
      }
    };

    return configs[feature] || {
      title,
      description,
      icon: '🔒',
      benefits
    };
  };

  const config = getFeatureConfig(feature);
  const finalBenefits = showBenefits ? (benefits.length > 0 ? benefits : config.benefits) : [];

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'p-4';
      case 'large':
        return 'p-8';
      default:
        return 'p-6';
    }
  };

  return (
    <Card className={`border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 ${className}`}>
      <CardContent className={getSizeClasses()}>
        <div className="text-center space-y-6">
          
          {/* Header with icon and badge */}
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-2xl shadow-lg">
              {config.icon}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-3 py-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {config.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {config.description}
              </p>
            </div>
          </div>

          {/* Benefits list */}
          {finalBenefits.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Avantages Premium
              </h4>
              
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {finalBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/pricing')}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size={size === 'large' ? 'lg' : 'default'}
            >
              <Crown className="h-4 w-4 mr-2" />
              Débloquer Premium
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/pricing')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Voir tous les avantages Premium
            </Button>
          </div>

          {/* Pricing teaser */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              À partir de <span className="font-bold text-emerald-600 dark:text-emerald-400">9,99€/mois</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Annulable à tout moment • Satisfaction garantie
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumFeatureLock;