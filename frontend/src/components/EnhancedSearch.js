import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Star,
  Play,
  Plus,
  Check
} from 'lucide-react';
import { searchApi } from '../services/tmdbApi';
import { libraryService } from '../services/libraryService';
import { watchlistService } from '../services/userService';

// Enhanced Search Component
export const EnhancedSearch = ({ 
  isOpen, 
  onClose, 
  onItemClick, 
  onPlayTrailer, 
  currentUser, 
  onToggleWatchlist 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [libraryResults, setLibraryResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setResults([]);
        setLibraryResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = async (searchQuery) => {
    setLoading(true);
    
    try {
      // Search TMDB
      const tmdbResults = await searchApi.multi(searchQuery);
      
      // Search Library
      const libraryContent = libraryService.getLibraryContent();
      const libraryMatches = libraryContent.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.filename && item.filename.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setResults(tmdbResults.results || []);
      setLibraryResults(libraryMatches);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setLibraryResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedResults = () => {
    let allResults = [];
    
    switch (activeTab) {
      case 'tmdb':
        allResults = results;
        break;
      case 'library':
        allResults = libraryResults;
        break;
      case 'all':
      default:
        allResults = [
          ...libraryResults.map(item => ({ ...item, source: 'library' })),
          ...results.map(item => ({ ...item, source: 'tmdb' }))
        ];
        break;
    }

    // Filter by type
    if (filterBy !== 'all') {
      allResults = allResults.filter(item => {
        if (filterBy === 'movies') {
          return item.media_type === 'movie' || item.title;
        } else if (filterBy === 'tv') {
          return item.media_type === 'tv' || item.name;
        } else if (filterBy === 'library') {
          return item.source === 'library';
        }
        return true;
      });
    }

    // Sort results
    switch (sortBy) {
      case 'rating':
        allResults.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'year':
        allResults.sort((a, b) => {
          const yearA = new Date(a.release_date || a.first_air_date || '1900').getFullYear();
          const yearB = new Date(b.release_date || b.first_air_date || '1900').getFullYear();
          return yearB - yearA;
        });
        break;
      case 'title':
        allResults.sort((a, b) => {
          const titleA = (a.title || a.name || '').toLowerCase();
          const titleB = (b.title || b.name || '').toLowerCase();
          return titleA.localeCompare(titleB);
        });
        break;
      case 'relevance':
      default:
        // Keep original order (relevance)
        break;
    }

    return allResults;
  };

  const filteredResults = getFilteredAndSortedResults();

  const tabs = [
    { id: 'all', label: 'All', count: results.length + libraryResults.length },
    { id: 'tmdb', label: 'Movies & TV', count: results.length },
    { id: 'library', label: 'My Library', count: libraryResults.length }
  ];

  const filterOptions = [
    { id: 'all', label: 'All Content' },
    { id: 'movies', label: 'Movies' },
    { id: 'tv', label: 'TV Shows' },
    { id: 'library', label: 'Library Only' }
  ];

  const sortOptions = [
    { id: 'relevance', label: 'Relevance' },
    { id: 'rating', label: 'Rating' },
    { id: 'year', label: 'Year' },
    { id: 'title', label: 'Title' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      >
        <div className="h-full flex flex-col">
          {/* Search Header */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gray-900/90 backdrop-blur-md border-b border-gray-700 p-4"
          >
            <div className="max-w-4xl mx-auto">
              {/* Search Input */}
              <div className="relative mb-4">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search movies, TV shows, and your library..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-12 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors text-lg"
                  />
                  {query && (
                    <motion.button
                      onClick={() => setQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X size={20} />
                    </motion.button>
                  )}
                </div>
                <motion.button
                  onClick={onClose}
                  className="absolute -right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={24} />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-6">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-2 transition-colors ${
                        activeTab === tab.id
                          ? 'text-white border-b-2 border-purple-500'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {tab.label} ({tab.count})
                    </motion.button>
                  ))}
                </div>

                {/* Filter and Sort */}
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <motion.button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Filter size={16} />
                      <span>Filters</span>
                    </motion.button>

                    <AnimatePresence>
                      {showFilters && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg p-3 min-w-48 z-10"
                        >
                          <div className="space-y-3">
                            <div>
                              <p className="text-white text-sm font-medium mb-2">Filter by:</p>
                              <select
                                value={filterBy}
                                onChange={(e) => setFilterBy(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                              >
                                {filterOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium mb-2">Sort by:</p>
                              <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
                              >
                                {sortOptions.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search Results */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Searching...</p>
                  </div>
                </div>
              ) : query && filteredResults.length === 0 ? (
                <div className="text-center py-16">
                  <Search size={64} className="text-gray-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-400 mb-2">
                    No results found for "{query}"
                  </h2>
                  <p className="text-gray-500">
                    Try different keywords or check your spelling.
                  </p>
                </div>
              ) : query ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                  {filteredResults.map((item, index) => (
                    <SearchResultCard
                      key={`${item.id}-${item.source}-${index}`}
                      item={item}
                      onItemClick={onItemClick}
                      onPlayTrailer={onPlayTrailer}
                      currentUser={currentUser}
                      onToggleWatchlist={onToggleWatchlist}
                      index={index}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <Search size={64} className="text-gray-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-400 mb-2">
                    Search for content
                  </h2>
                  <p className="text-gray-500">
                    Find movies, TV shows, and content from your library.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Search Result Card Component
export const SearchResultCard = ({ 
  item, 
  onItemClick, 
  onPlayTrailer, 
  currentUser, 
  onToggleWatchlist, 
  index 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    if (currentUser && item && item.source === 'tmdb') {
      setIsInWatchlist(
        watchlistService.isInWatchlist(
          currentUser.id, 
          item.id, 
          item.media_type || (item.title ? 'movie' : 'tv')
        )
      );
    }
  }, [currentUser, item]);

  const handleToggleWatchlist = (e) => {
    e.stopPropagation();
    if (item.source === 'tmdb') {
      onToggleWatchlist(item);
      setIsInWatchlist(!isInWatchlist);
    }
  };

  const getImageUrl = () => {
    if (item.source === 'library') {
      return item.thumbnail || 'https://via.placeholder.com/300x450/1f2937/gray?text=No+Image';
    }
    return item.poster_path || 'https://via.placeholder.com/300x450/1f2937/gray?text=No+Image';
  };

  const getTitle = () => {
    return item.title || item.name || 'Untitled';
  };

  const getYear = () => {
    const date = item.release_date || item.first_air_date || item.addedAt;
    return date ? new Date(date).getFullYear() : null;
  };

  const getSourceBadge = () => {
    switch (item.source) {
      case 'library':
        return <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">Library</span>;
      case 'tmdb':
        return <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">TMDB</span>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onItemClick(item)}
    >
      <div className="relative">
        <img
          src={getImageUrl()}
          alt={getTitle()}
          className="w-full aspect-[2/3] object-cover rounded-lg"
          loading="lazy"
        />

        {/* Source Badge */}
        <div className="absolute top-2 left-2">
          {getSourceBadge()}
        </div>

        {/* Watchlist Indicator */}
        {isInWatchlist && item.source === 'tmdb' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Check size={14} className="text-white" />
          </motion.div>
        )}

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 rounded-lg flex flex-col justify-end p-3"
            >
              <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                {getTitle()}
              </h3>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  {item.vote_average && (
                    <>
                      <Star size={12} className="text-yellow-400" fill="currentColor" />
                      <span className="text-white text-xs">{item.vote_average.toFixed(1)}</span>
                    </>
                  )}
                  {getYear() && (
                    <>
                      <span className="text-gray-400 text-xs">•</span>
                      <span className="text-gray-400 text-xs">{getYear()}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.source === 'library') {
                      // Handle library content playback
                      onItemClick(item);
                    } else {
                      onPlayTrailer(item);
                    }
                  }}
                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Play size={14} fill="currentColor" className="text-black ml-0.5" />
                </motion.button>

                {item.source === 'tmdb' && (
                  <motion.button
                    onClick={handleToggleWatchlist}
                    className={`w-8 h-8 border-2 rounded-full flex items-center justify-center transition-colors ${
                      isInWatchlist 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-400 hover:border-white'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isInWatchlist ? <Check size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};