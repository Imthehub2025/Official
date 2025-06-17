import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Play, 
  Plus, 
  Star, 
  Calendar, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Check,
  Film,
  Tv,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';
import { watchlistService } from './services/userService';
import { getTrailerKey } from './services/tmdbApi';

// Enhanced Modal Component with detailed information
export const Modal = ({ isOpen, onClose, content, onPlayTrailer, currentUser, onToggleWatchlist }) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (content && currentUser) {
      setIsInWatchlist(
        watchlistService.isInWatchlist(
          currentUser.id, 
          content.id, 
          content.media_type
        )
      );
    }
  }, [content, currentUser]);

  if (!isOpen || !content) return null;

  const handleToggleWatchlist = () => {
    onToggleWatchlist(content);
    setIsInWatchlist(!isInWatchlist);
  };

  const genres = content.genres || [];
  const cast = content.credits?.cast?.slice(0, 6) || [];
  const crew = content.credits?.crew?.filter(person => 
    ['Director', 'Producer', 'Writer'].includes(person.job)
  ).slice(0, 6) || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gray-900 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto modal-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Background Image */}
          <div className="relative">
            <img
              src={content.backdrop_path}
              alt={content.title || content.name}
              className="w-full h-64 object-cover rounded-t-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent rounded-t-lg" />
            
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>

            <div className="absolute bottom-4 left-6 right-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                {content.title || content.name}
              </h2>
              <div className="flex items-center space-x-4 mb-4">
                <motion.button
                  onClick={() => onPlayTrailer(content)}
                  className="flex items-center space-x-2 bg-white hover:bg-gray-200 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play size={16} fill="currentColor" />
                  <span>Play Trailer</span>
                </motion.button>
                
                <motion.button
                  onClick={handleToggleWatchlist}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-colors ${
                    isInWatchlist 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isInWatchlist ? <Check size={16} /> : <Plus size={16} />}
                  <span>{isInWatchlist ? 'In My List' : 'Add to List'}</span>
                </motion.button>
                
                <motion.button
                  className="w-10 h-10 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ThumbsUp size={16} className="text-white" />
                </motion.button>
                
                <motion.button
                  className="w-10 h-10 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Share2 size={16} className="text-white" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <div className="p-6">
            <div className="flex space-x-6 mb-6 border-b border-gray-700">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'cast', label: 'Cast & Crew' },
                { id: 'details', label: 'Details' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 transition-colors ${
                    activeTab === tab.id 
                      ? 'text-white border-b-2 border-purple-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-1">
                          <Star size={16} className="text-yellow-400" fill="currentColor" />
                          <span className="text-white font-semibold">{content.vote_average?.toFixed(1)}</span>
                        </div>
                        <span className="text-gray-400">
                          {new Date(content.release_date || content.first_air_date).getFullYear()}
                        </span>
                        {content.runtime && (
                          <span className="text-gray-400">{content.runtime} min</span>
                        )}
                        {content.number_of_seasons && (
                          <span className="text-gray-400">
                            {content.number_of_seasons} Season{content.number_of_seasons > 1 ? 's' : ''}
                          </span>
                        )}
                        <div className="px-2 py-1 bg-gray-700 rounded text-xs font-semibold text-white">
                          {content.media_type === 'movie' ? 'MOVIE' : 'TV SERIES'}
                        </div>
                      </div>
                      
                      <p className="text-gray-300 leading-relaxed mb-6">
                        {content.overview}
                      </p>

                      {content.tagline && (
                        <blockquote className="text-purple-400 italic text-lg mb-4 border-l-4 border-purple-500 pl-4">
                          "{content.tagline}"
                        </blockquote>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {genres.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Genres</h4>
                          <div className="flex flex-wrap gap-2">
                            {genres.map((genre, index) => (
                              <span key={index} className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                                {typeof genre === 'string' ? genre : genre.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {content.production_companies?.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Production</h4>
                          <div className="space-y-1">
                            {content.production_companies.slice(0, 3).map((company, index) => (
                              <p key={index} className="text-gray-300 text-sm">{company.name}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'cast' && (
                  <div className="space-y-6">
                    {cast.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-4 text-lg">Cast</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {cast.map((person, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                                <Users size={20} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{person.name}</p>
                                <p className="text-gray-400 text-xs">{person.character}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {crew.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-4 text-lg">Crew</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {crew.map((person, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                                <Award size={20} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{person.name}</p>
                                <p className="text-gray-400 text-xs">{person.job}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Release Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="text-gray-300">
                              {content.release_date || content.first_air_date 
                                ? new Date(content.release_date || content.first_air_date).toLocaleDateString()
                                : 'Unknown'
                              }
                            </span>
                          </div>
                          {content.runtime && (
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-gray-400" />
                              <span className="text-gray-300">{content.runtime} minutes</span>
                            </div>
                          )}
                          {content.original_language && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Language:</span>
                              <span className="text-gray-300">{content.original_language.toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {content.budget && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Budget</h4>
                          <p className="text-gray-300 text-sm">
                            ${content.budget.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {content.revenue && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Revenue</h4>
                          <p className="text-gray-300 text-sm">
                            ${content.revenue.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-semibold mb-2">Ratings</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Star size={16} className="text-yellow-400" fill="currentColor" />
                            <span className="text-white font-medium">{content.vote_average?.toFixed(1)}</span>
                            <span className="text-gray-400 text-sm">({content.vote_count} votes)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp size={16} className="text-green-400" />
                            <span className="text-gray-300 text-sm">Popularity: {content.popularity?.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>

                      {content.status && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Status</h4>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            content.status === 'Released' || content.status === 'Ended'
                              ? 'bg-green-600 text-white'
                              : 'bg-yellow-600 text-white'
                          }`}>
                            {content.status}
                          </span>
                        </div>
                      )}

                      {content.homepage && (
                        <div>
                          <h4 className="text-white font-semibold mb-2">Official Website</h4>
                          <a 
                            href={content.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// YouTube Player Component
export const YouTubePlayer = ({ isOpen, onClose, videoKey, title }) => {
  if (!isOpen || !videoKey) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative max-w-6xl w-full mx-4 aspect-video"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.button
            onClick={onClose}
            className="absolute -top-12 right-0 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={20} />
          </motion.button>

          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3`}
            title={title}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Footer Component
export const Footer = () => {
  return (
    <footer className="bg-black text-gray-400 py-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
              Quantum Media Hub
            </div>
            <div className="text-sm text-purple-400 font-semibold mb-4">
              (Throne Edition)
            </div>
            <p className="text-sm">
              Experience the future of streaming with quantum-powered entertainment and real-time content updates.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Navigate</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Movies</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TV Shows</a></li>
              <li><a href="#" className="hover:text-white transition-colors">My List</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Recently Added</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Preferences</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Social Media</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Newsletter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 md:mb-0">
              © 2024 Quantum Media Hub (Throne Edition). All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <p className="text-xs text-purple-400 font-semibold">
                ✨POWERED BY TRILLIONS✨
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>Real-time updates via TMDB API</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Search Results Component
export const SearchResults = ({ 
  results, 
  query, 
  onItemClick, 
  onPlayTrailer, 
  currentUser, 
  onToggleWatchlist,
  loading,
  onLoadMore,
  hasMore
}) => {
  if (loading && results.length === 0) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Searching for "{query}"...</p>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-400 mb-2">
              No results found for "{query}"
            </h2>
            <p className="text-gray-500">
              Try different keywords or check the spelling.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-400">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
          {results.map((item, index) => (
            <ContentCard
              key={`${item.id}-${item.media_type}-${index}`}
              item={item}
              onItemClick={onItemClick}
              onPlayTrailer={onPlayTrailer}
              onToggleWatchlist={onToggleWatchlist}
              currentUser={currentUser}
              index={index}
            />
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <motion.button
              onClick={onLoadMore}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto"
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More Results</span>
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

// Movies Section Component
export const MoviesSection = ({ 
  popularMovies, 
  topRatedMovies, 
  nowPlayingMovies, 
  upcomingMovies,
  onItemClick, 
  onPlayTrailer, 
  currentUser, 
  onToggleWatchlist,
  loading,
  onLoadMore
}) => {
  return (
    <div className="min-h-screen bg-black pt-32 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">Movies</h1>
          <p className="text-gray-400">
            Discover the latest and greatest movies from around the world
          </p>
        </motion.div>

        <div className="space-y-8">
          <ContentRow
            title="🎬 Popular Movies"
            content={popularMovies}
            onItemClick={onItemClick}
            onPlayTrailer={onPlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={onToggleWatchlist}
            loading={loading}
            onLoadMore={() => onLoadMore('popular-movies')}
          />

          <ContentRow
            title="⭐ Top Rated Movies"
            content={topRatedMovies}
            onItemClick={onItemClick}
            onPlayTrailer={onPlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={onToggleWatchlist}
            loading={loading}
          />

          <ContentRow
            title="🎭 Now Playing"
            content={nowPlayingMovies}
            onItemClick={onItemClick}
            onPlayTrailer={onPlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={onToggleWatchlist}
            loading={loading}
          />

          <ContentRow
            title="🔮 Coming Soon"
            content={upcomingMovies}
            onItemClick={onItemClick}
            onPlayTrailer={onPlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={onToggleWatchlist}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

// TV Shows Section Component
export const TVShowsSection = ({ 
  popularTVShows, 
  topRatedTVShows, 
  onTheAirTVShows,
  onItemClick, 
  onPlayTrailer, 
  currentUser, 
  onToggleWatchlist,
  loading,
  onLoadMore
}) => {
  return (
    <div className="min-h-screen bg-black pt-32 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">TV Shows</h1>
          <p className="text-gray-400">
            Binge-watch the most popular and critically acclaimed TV series
          </p>
        </motion.div>

        <div className="space-y-8">
          <ContentRow
            title="📺 Popular TV Shows"
            content={popularTVShows}
            onItemClick={onItemClick}
            onPlayTrailer={onPlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={onToggleWatchlist}
            loading={loading}
            onLoadMore={() => onLoadMore('popular-tv')}
          />

          <ContentRow
            title="⭐ Top Rated TV Shows"
            content={topRatedTVShows}
            onItemClick={onItemClick}
            onPlayTrailer={onPlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={onToggleWatchlist}
            loading={loading}
          />

          <ContentRow
            title="📡 On The Air"
            content={onTheAirTVShows}
            onItemClick={onItemClick}
            onPlayTrailer={onPlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={onToggleWatchlist}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};