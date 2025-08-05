import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Crown, Zap, AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsageCounter = ({ showDetails = false, className = '' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageStats();
  }, [user]);

  const fetchUsageStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/usage-stats`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${document.cookie.split('access_token=')[1]?.split(';')[0]?.replace('"', '')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsageStats(data);
      } else {
        console.error('Failed to fetch usage stats');
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (!user || !usageStats) {
    return null;
  }

  const isPremium = usageStats.is_premium;
  const dailyAnalyses = usageStats.daily_analyses;
  const limitReached = usageStats.limit_reached;

  // Premium user display
  if (isPremium) {
    return (
      <Card className={`bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
              <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Analyses illimitées
                </span>
              </div>
              {showDetails && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Profitez de toutes les fonctionnalités sans restriction
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Free user display
  const usedAnalyses = dailyAnalyses.used;
  const remainingAnalyses = dailyAnalyses.remaining;
  const totalLimit = dailyAnalyses.limit;
  const progressPercentage = (usedAnalyses / totalLimit) * 100;

  const getProgressColor = () => {
    if (limitReached) return 'bg-red-500';
    if (remainingAnalyses <= 1) return 'bg-orange-500';
    if (remainingAnalyses <= 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = () => {
    if (limitReached) return 'text-red-600 dark:text-red-400';
    if (remainingAnalyses <= 1) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card className={`${limitReached ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'} ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${limitReached ? 'bg-red-100 dark:bg-red-900/50' : 'bg-blue-100 dark:bg-blue-900/50'}`}>
                {limitReached ? (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                ) : (
                  <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <span className="text-sm font-medium">
                {limitReached ? 'Limite atteinte' : 'Analyses restantes'}
              </span>
            </div>
            
            <Badge variant={limitReached ? 'destructive' : 'secondary'}>
              {remainingAnalyses} / {totalLimit}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className="h-2"
              // Custom styling would need to be handled differently
            />
            <div className="flex justify-between text-xs">
              <span className={getStatusColor()}>
                {usedAnalyses} utilisées
              </span>
              <span className={getStatusColor()}>
                {remainingAnalyses} restantes
              </span>
            </div>
          </div>

          {/* Status message and actions */}
          {showDetails && (
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              {limitReached ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <Clock className="h-3 w-3" />
                    <span>Reset à minuit</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    onClick={() => navigate('/pricing')}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Passer au Premium
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {remainingAnalyses === 1 ? 'Plus qu\'une analyse gratuite aujourd\'hui' : 
                     remainingAnalyses === 0 ? 'Plus d\'analyses gratuites aujourd\'hui' :
                     `${remainingAnalyses} analyses gratuites restantes aujourd\'hui`}
                  </p>
                  {remainingAnalyses <= 2 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
                      onClick={() => navigate('/pricing')}
                    >
                      <Crown className="h-3 w-3 mr-2" />
                      Analyses illimitées
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageCounter;