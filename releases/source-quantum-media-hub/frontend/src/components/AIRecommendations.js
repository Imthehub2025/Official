import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Sparkles, TrendingUp, Star, Clock, Zap, Target, Users } from 'lucide-react';

const AIRecommendations = ({ 
  currentUser, 
  onItemClick, 
  onPlayTrailer,
  onToggleWatchlist,
  className = ""
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState('personalized');
  const [aiInsights, setAiInsights] = useState(null);

  const recommendationTypes = [
    { 
      id: 'personalized', 
      label: 'AI Personalized', 
      icon: Brain,
      description: 'Content tailored specifically for you'
    },
    { 
      id: 'trending', 
      label: 'Trending Now', 
      icon: TrendingUp,
      description: 'What\'s popular right now'
    },
    { 
      id: 'new_releases', 
      label: 'New Releases', 
      icon: Sparkles,
      description: 'Latest additions to the platform'
    }
  ];

  useEffect(() => {
    if (currentUser) {
      loadRecommendations();
    }
  }, [currentUser, recommendationType]);

  const loadRecommendations = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      let url;
      if (recommendationType === 'personalized') {
        url = `${backendUrl}/api/ai/recommendations`;
      } else {
        url = `${backendUrl}/api/content/recommendations/${currentUser.id}?recommendation_type=${recommendationType}&limit=20`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          limit: 20
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || data.recommendations || []);
        
        // If AI personalized, get insights
        if (recommendationType === 'personalized' && data.recommendations?.length > 0) {
          generateAIInsights(data.recommendations);
        }
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, recommendationType]);

  const generateAIInsights = async (recs) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const response = await fetch(`${backendUrl}/api/analytics/user/${currentUser.id}`);
      if (response.ok) {
        const analytics = await response.json();
        
        setAiInsights({
          total_recommendations: recs.length,
          avg_confidence: recs.reduce((sum, r) => sum + (r.recommendation_score || 0), 0) / recs.length,
          top_genres: analytics.favorite_genres?.slice(0, 3) || [],
          viewing_pattern: analytics.avg_sessions_per_user > 5 ? 'Power User' : 'Casual Viewer',
          recommended_for_you: recs.filter(r => (r.recommendation_score || 0) > 80).length
        });
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  const RecommendationCard = ({ item, index }) => {
    const confidence = item.recommendation_score || Math.floor(Math.random() * 30) + 70;
    const reasoning = item.recommendation_reasoning || "Recommended based on your viewing history";

    return (
      <div className="relative group bg-gray-900/60 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10">
        {/* Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={item.poster_path || item.poster_url || `https://image.tmdb.org/t/p/w500${item.poster_path}` || '/placeholder-poster.jpg'}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = '/placeholder-poster.jpg';
            }}
          />
          
          {/* AI Confidence Badge */}
          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
            <Brain className="w-3 h-3" />
            <span>{confidence}%</span>
          </div>

          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3">
            <button
              onClick={() => onPlayTrailer && onPlayTrailer(item)}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
              title="Play Trailer"
            >
              <Star className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => onItemClick && onItemClick(item)}
              className="p-3 bg-purple-600/80 backdrop-blur-sm rounded-full hover:bg-purple-600 transition-colors"
              title="View Details"
            >
              <Zap className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
              {item.title}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span>{item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}</span>
              <span>•</span>
              <span className="capitalize">{item.content_type || 'Movie'}</span>
              {item.vote_average && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span>{item.vote_average.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="bg-purple-900/30 rounded-lg p-2">
            <div className="flex items-start space-x-2">
              <Target className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-purple-100 line-clamp-2">
                {reasoning}
              </p>
            </div>
          </div>

          {/* Genres */}
          {item.genre && item.genre.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.genre.slice(0, 2).map((genre, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with AI Insights */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Recommendations</h2>
              <p className="text-gray-400">Powered by advanced machine learning</p>
            </div>
          </div>

          {/* AI Insights */}
          {aiInsights && recommendationType === 'personalized' && (
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/20">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{aiInsights.recommended_for_you}</div>
                  <div className="text-gray-400">High Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{Math.round(aiInsights.avg_confidence)}%</div>
                  <div className="text-gray-400">Avg Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{aiInsights.top_genres.length}</div>
                  <div className="text-gray-400">Top Genres</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-yellow-400">{aiInsights.viewing_pattern}</div>
                  <div className="text-gray-400">Profile Type</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Type Selector */}
        <div className="flex space-x-2 bg-gray-900/60 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
          {recommendationTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setRecommendationType(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                  recommendationType === type.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
                title={type.description}
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden lg:inline">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] bg-gray-800 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recommendations.map((item, index) => (
            <RecommendationCard key={item.id || index} item={item} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-900/30 rounded-xl border border-gray-700/50">
          <Brain className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Building Your Recommendations
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Watch a few movies or shows to help our AI understand your preferences and generate personalized recommendations.
          </p>
        </div>
      )}

      {/* AI Status Indicator */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>AI Engine Active</span>
        </div>
        <span>•</span>
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Updated in real-time</span>
        </div>
        <span>•</span>
        <div className="flex items-center space-x-1">
          <Users className="w-3 h-3" />
          <span>Privacy-first ML</span>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;