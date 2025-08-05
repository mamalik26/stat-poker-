import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Skeleton } from './ui/skeleton';
import { TrendingUp, Target, Users, Calculator, CheckCircle, XCircle, AlertCircle, Loader2, BarChart3, Zap, Brain } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = "blue", isLoading = false }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-300 border-blue-500/30 shadow-blue-500/10",
    green: "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 text-emerald-300 border-emerald-500/30 shadow-emerald-500/10", 
    red: "bg-gradient-to-br from-red-500/10 to-red-600/5 text-red-300 border-red-500/30 shadow-red-500/10",
    yellow: "bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-300 border-amber-500/30 shadow-amber-500/10"
  };

  const iconColorClasses = {
    blue: "text-blue-400",
    green: "text-emerald-400", 
    red: "text-red-400",
    yellow: "text-amber-400"
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-current/20 backdrop-blur-sm hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold opacity-90 mb-1 tracking-wide">{title}</p>
          {isLoading ? (
            <Skeleton className="h-10 w-20 bg-gray-600/50 rounded-lg" />
          ) : (
            <p className="text-3xl font-black tracking-tight">{value}</p>
          )}
          {subtitle && !isLoading && <p className="text-xs opacity-75 mt-2 font-medium">{subtitle}</p>}
        </div>
        <div className="ml-4">
          <div className={`p-3 rounded-2xl bg-black/20 ${iconColorClasses[color]}`}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingCard = ({ title, icon: Icon }) => (
  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gray-700/50">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm text-gray-400 font-medium">Computing probabilities...</span>
        </div>
        <Skeleton className="h-4 w-full bg-gray-700/50 rounded-lg" />
        <Skeleton className="h-4 w-3/4 bg-gray-700/50 rounded-lg" />
      </div>
    </div>
  </div>
);

const ProbabilityDashboard = ({ analysis, playerCount, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6 h-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-gray-100">Probability Analysis</h2>
          </div>
          <div className="w-20 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full mx-auto"></div>
        </div>

        {/* Loading Probability Overview */}
        <div className="grid grid-cols-1 gap-4">
          <StatCard
            title="Win Probability"
            value="..."
            subtitle="Calculating..."
            icon={TrendingUp}
            color="green"
            isLoading={true}
          />
          <StatCard
            title="Tie Probability" 
            value="..."
            subtitle="Calculating..."
            icon={Target}
            color="yellow"
            isLoading={true}
          />
          <StatCard
            title="Lose Probability"
            value="..."
            subtitle="Calculating..."
            icon={Users}
            color="red"
            isLoading={true}
          />
        </div>

        {/* Loading Cards */}
        <div className="space-y-4">
          <LoadingCard title="Hand Strength Analysis" icon={Target} />
          <LoadingCard title="Strategic Recommendation" icon={CheckCircle} />
          <LoadingCard title={`Opponent Analysis (${playerCount - 1} opponents)`} icon={Users} />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Calculator className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Ready for Analysis</h3>
            <p className="text-gray-500 font-medium">Select your hole cards to begin</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span>Powered by Monte Carlo simulations</span>
          </div>
        </div>
      </div>
    );
  }

  const getRecommendationIcon = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('fold')) return XCircle;
    if (actionLower.includes('check') || actionLower.includes('call')) return AlertCircle;
    if (actionLower.includes('bet') || actionLower.includes('raise') || actionLower.includes('all-in')) return CheckCircle;
    return AlertCircle;
  };

  const getRecommendationColor = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('fold')) return 'bg-gradient-to-r from-red-500/20 to-red-600/10 text-red-300 border-red-500/30';
    if (actionLower.includes('check') || actionLower.includes('call')) return 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-500/30';
    if (actionLower.includes('bet') || actionLower.includes('raise') || actionLower.includes('all-in')) return 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-300 border-emerald-500/30';
    return 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-300 border-blue-500/30';
  };

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-gray-100">Analysis Results</h2>
        </div>
        <div className="w-20 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full mx-auto"></div>
      </div>

      {/* Probability Overview */}
      <div className="grid grid-cols-1 gap-4">
        <StatCard
          title="Win Probability"
          value={`${analysis.win_probability?.toFixed(1) || '0.0'}%`}
          subtitle="Chance to win at showdown"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Tie Probability" 
          value={`${analysis.tie_probability?.toFixed(1) || '0.0'}%`}
          subtitle="Chance of split pot"
          icon={Target}
          color="yellow"
        />
        <StatCard
          title="Lose Probability"
          value={`${analysis.lose_probability?.toFixed(1) || '0.0'}%`}
          subtitle="Chance opponents win"
          icon={Users}
          color="red"
        />
      </div>

      {/* Hand Strength Analysis */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-2xl border border-gray-700/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/20">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100">Hand Strength</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-300">Current Hand:</span>
            <Badge variant="outline" className="text-base px-4 py-2 bg-emerald-500/10 text-emerald-300 border-emerald-500/30 rounded-xl font-semibold">
              {analysis.hand_strength?.name || 'Unknown'}
            </Badge>
          </div>
          <p className="text-gray-400 font-medium leading-relaxed">{analysis.hand_strength?.description || 'No description available'}</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-300">Hand Strength</span>
              <span className="text-emerald-400">{analysis.hand_strength?.strength || 0}/9</span>
            </div>
            <Progress 
              value={((analysis.hand_strength?.strength || 0) / 9) * 100} 
              className="h-3 bg-gray-800 rounded-full overflow-hidden"
            />
          </div>
        </div>
      </div>

      {/* Strategic Recommendation */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-2xl border border-gray-700/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-500/20">
            {React.createElement(
              getRecommendationIcon(analysis.recommendation?.action || ''), 
              { className: "w-5 h-5 text-blue-400" }
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-100">Strategic Recommendation</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`px-6 py-3 rounded-2xl border-2 font-bold text-lg tracking-wide ${getRecommendationColor(analysis.recommendation?.action || '')}`}>
              {analysis.recommendation?.action || 'Unknown'}
            </div>
            <div className="text-sm text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-gray-500" />
                <span>Confidence: {analysis.recommendation?.confidence || 'N/A'}</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 leading-relaxed font-medium">{analysis.recommendation?.reason || 'No recommendation available'}</p>
        </div>
      </div>

      {/* Opponent Range Analysis */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-2xl border border-gray-700/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-purple-500/20">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100">Opponent Analysis</h3>
          <div className="ml-auto">
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-300 border-purple-500/30 rounded-xl font-medium">
              {playerCount - 1} opponents
            </Badge>
          </div>
        </div>
        <div className="space-y-4">
          {analysis.opponent_ranges?.slice(0, playerCount - 1).map((opponent, index) => (
            <div key={index} className="bg-gradient-to-r from-gray-700/30 to-gray-800/20 rounded-2xl p-4 border border-gray-600/30">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-200">Player {index + 1}</span>
                <Badge variant="secondary" className="bg-gray-600/30 text-gray-300 border-gray-500/30 rounded-xl text-xs font-medium">
                  {opponent.profile}
                </Badge>
              </div>
              <div className="text-sm text-gray-400 space-y-2 font-medium">
                <div><span className="text-gray-300 font-semibold">Range:</span> {opponent.range}</div>
                <div><span className="text-gray-300 font-semibold">Likely holdings:</span> {opponent.likely_holdings?.join(', ') || 'N/A'}</div>
              </div>
            </div>
          )) || (
            <p className="text-gray-500 text-center py-6 font-medium">No opponent data available</p>
          )}
        </div>
      </div>

      {/* Calculation Details */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-2xl border border-gray-700/50 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gray-500/20">
            <Calculator className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100">Calculation Details</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-700/50">
            <span className="text-gray-400 font-medium">Method:</span>
            <span className="text-gray-200 font-semibold">{analysis.calculations?.method || 'Unknown'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700/50">
            <span className="text-gray-400 font-medium">Confidence:</span>
            <span className="text-emerald-400 font-semibold">{analysis.calculations?.confidence || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-700/50">
            <span className="text-gray-400 font-medium">Cards Remaining:</span>
            <span className="text-blue-400 font-semibold">{analysis.calculations?.cards_remaining || 0}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400 font-medium">Calculation Time:</span>
            <span className="text-purple-400 font-semibold">{analysis.calculations?.simulation_time_ms || 0}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProbabilityDashboard;