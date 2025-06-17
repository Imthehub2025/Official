import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Plus, 
  Info, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Bell, 
  User, 
  Home, 
  Film, 
  Tv, 
  Bookmark,
  X,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Check,
  Edit3,
  Trash2,
  Settings,
  LogOut,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';
import { userService, watchlistService } from './services/userService';

// Header Component with full navigation
export const Header = ({ 
  searchQuery, 
  setSearchQuery, 
  showSearch, 
  setShowSearch,
  currentSection,
  onSectionChange,
  currentUser,
  onUserChange,
  showUserMenu,
  setShowUserMenu,
  onOpenDeviceIntegration
}) => {
  const [scrolled, setScrolled] = useState(false);
  const allUsers = userService.getAllUsers();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'tv-shows', label: 'TV Shows', icon: Tv },
    { id: 'library', label: 'Library', icon: Bookmark },
    { id: 'my-list', label: 'My List', icon: Bookmark }
  ];

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/95 backdrop-blur-md' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center space-x-2 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          onClick={() => onSectionChange('home')}
        >
          <div className="text-2xl font-bold bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Quantum Media Hub
          </div>
          <div className="text-sm text-purple-400 font-semibold">
            (Throne Edition)
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex items-center space-x-2 transition-colors ${
                  currentSection === item.id 
                    ? 'text-white font-semibold' 
                    : 'text-gray-300 hover:text-white'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <AnimatePresence>
            {showSearch ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex items-center"
              >
                <input
                  type="text"
                  placeholder="Search movies, TV shows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(false)}
                  className="bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors w-64"
                  autoFocus
                />
                <motion.button
                  onClick={() => setShowSearch(false)}
                  className="ml-2 text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                onClick={() => setShowSearch(true)}
                className="text-white hover:text-gray-300 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Search size={20} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <motion.button 
            className="text-white hover:text-gray-300 transition-colors relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell size={20} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </motion.button>

          {/* User Profile Menu */}
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <ChevronRight 
                size={16} 
                className={`text-white transition-transform ${showUserMenu ? 'rotate-90' : ''}`}
              />
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-12 bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg p-4 w-64"
                >
                  {/* Current User Info */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-gray-700 mb-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-white font-semibold">{currentUser.name}</p>
                      <p className="text-gray-400 text-xs">
                        {currentUser.isKids ? 'Kids Profile' : 'Adult Profile'}
                      </p>
                    </div>
                  </div>

                  {/* Other Users */}
                  <div className="space-y-2 mb-3">
                    {allUsers.filter(user => user.id !== currentUser.id).map((user) => (
                      <motion.button
                        key={user.id}
                        onClick={() => {
                          onUserChange(user);
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-3 w-full text-left hover:bg-gray-800/50 rounded-lg p-2 transition-colors"
                        whileHover={{ scale: 1.02 }}
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-gray-300">{user.name}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Menu Options */}
                  <div className="border-t border-gray-700 pt-3 space-y-2">
                    <button className="flex items-center space-x-3 w-full text-left text-gray-300 hover:text-white transition-colors">
                      <Edit3 size={16} />
                      <span>Manage Profiles</span>
                    </button>
                    <button className="flex items-center space-x-3 w-full text-left text-gray-300 hover:text-white transition-colors">
                      <Settings size={16} />
                      <span>Account Settings</span>
                    </button>
                    <button className="flex items-center space-x-3 w-full text-left text-gray-300 hover:text-white transition-colors">
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Powered by Trillions */}
      <div className="text-center py-2 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <span className="text-xs text-purple-300 font-semibold">
          ✨POWERED BY TRILLIONS✨
        </span>
      </div>
    </motion.header>
  );
};

// Enhanced Hero Banner with real data
export const HeroBanner = ({ featuredContent, onPlayTrailer, onShowInfo, currentUser, onToggleWatchlist }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    if (featuredContent && currentUser) {
      setIsInWatchlist(
        watchlistService.isInWatchlist(
          currentUser.id, 
          featuredContent.id, 
          featuredContent.media_type
        )
      );
    }
  }, [featuredContent, currentUser]);

  if (!featuredContent) return null;

  const handleToggleWatchlist = () => {
    onToggleWatchlist(featuredContent);
    setIsInWatchlist(!isInWatchlist);
  };

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${featuredContent.backdrop_path})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {featuredContent.title || featuredContent.name}
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {featuredContent.overview}
            </motion.p>

            <motion.div 
              className="flex flex-wrap gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.button
                onClick={() => onPlayTrailer(featuredContent)}
                className="flex items-center space-x-3 bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play size={20} fill="currentColor" />
                <span>Play Trailer</span>
              </motion.button>

              <motion.button
                onClick={() => onShowInfo(featuredContent)}
                className="flex items-center space-x-3 bg-gray-600/70 hover:bg-gray-600/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Info size={20} />
                <span>More Info</span>
              </motion.button>

              <motion.button
                onClick={handleToggleWatchlist}
                className={`flex items-center space-x-3 px-8 py-3 rounded-lg font-semibold transition-colors ${
                  isInWatchlist 
                    ? 'bg-green-600/70 hover:bg-green-600/90 text-white' 
                    : 'bg-gray-800/70 hover:bg-gray-800/90 text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isInWatchlist ? <Check size={20} /> : <Plus size={20} />}
                <span>{isInWatchlist ? 'In My List' : 'Add to List'}</span>
              </motion.button>
            </motion.div>

            <motion.div 
              className="flex items-center space-x-4 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="flex items-center space-x-1">
                <Star size={16} className="text-yellow-400" fill="currentColor" />
                <span className="text-sm font-semibold">{featuredContent.vote_average?.toFixed(1)}</span>
              </div>
              <div className="text-sm text-gray-300">
                {new Date(featuredContent.release_date || featuredContent.first_air_date).getFullYear()}
              </div>
              {featuredContent.runtime && (
                <div className="text-sm text-gray-300">
                  {featuredContent.runtime} min
                </div>
              )}
              {featuredContent.number_of_seasons && (
                <div className="text-sm text-gray-300">
                  {featuredContent.number_of_seasons} Season{featuredContent.number_of_seasons > 1 ? 's' : ''}
                </div>
              )}
              <div className="px-2 py-1 bg-gray-800/70 rounded text-xs font-semibold">
                {featuredContent.media_type === 'movie' ? 'MOVIE' : 'TV SERIES'}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 right-8 flex items-center space-x-4">
        <motion.button
          onClick={() => setIsMuted(!isMuted)}
          className="w-12 h-12 bg-black/50 border border-gray-600 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </motion.button>
      </div>
    </div>
  );
};

// Enhanced Content Row with infinite scrolling
export const ContentRow = ({ 
  title, 
  content, 
  onItemClick, 
  onPlayTrailer, 
  currentUser, 
  onToggleWatchlist,
  loading = false,
  onLoadMore = null,
  icon = null
}) => {
  const scrollRef = useRef(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [content]);

  if (!content || content.length === 0) return null;

  return (
    <div className="mb-12">
      <motion.div
        className="flex items-center space-x-3 mb-4 px-4"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {icon && <span className="text-2xl">{icon}</span>}
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {loading && (
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </motion.div>

      <div className="relative group">
        {/* Scroll Left Button */}
        <AnimatePresence>
          {showLeftButton && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Content Grid */}
        <div 
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {content.map((item, index) => (
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
          
          {/* Load More Trigger */}
          {onLoadMore && (
            <motion.div
              className="flex-shrink-0 w-48 h-72 flex items-center justify-center bg-gray-800/50 rounded-lg cursor-pointer"
              onClick={onLoadMore}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-center">
                <Plus size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Load More</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Scroll Right Button */}
        <AnimatePresence>
          {showRightButton && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={24} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Enhanced Content Card with watchlist functionality
export const ContentCard = ({ 
  item, 
  onItemClick, 
  onPlayTrailer, 
  onToggleWatchlist, 
  currentUser, 
  index 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    if (currentUser && item) {
      setIsInWatchlist(
        watchlistService.isInWatchlist(
          currentUser.id, 
          item.id, 
          item.media_type
        )
      );
    }
  }, [currentUser, item]);

  const handleToggleWatchlist = (e) => {
    e.stopPropagation();
    onToggleWatchlist(item);
    setIsInWatchlist(!isInWatchlist);
  };

  return (
    <motion.div
      className="flex-shrink-0 w-48 cursor-pointer"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onItemClick(item)}
    >
      <div className="relative">
        <img
          src={item.poster_path}
          alt={item.title || item.name}
          className="w-full h-72 object-cover rounded-lg"
          loading="lazy"
        />
        
        {/* Watchlist indicator */}
        {isInWatchlist && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Check size={14} className="text-white" />
          </motion.div>
        )}
        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-lg flex flex-col justify-end p-4"
            >
              <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                {item.title || item.name}
              </h3>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-1">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayTrailer(item);
                    }}
                    className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Play size={14} fill="currentColor" className="text-black ml-0.5" />
                  </motion.button>
                  
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
                  
                  <motion.button
                    className="w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ThumbsUp size={12} className="text-white" />
                  </motion.button>
                </div>
                
                <div className="px-2 py-1 bg-gray-800/70 rounded text-xs font-semibold text-white">
                  {item.media_type === 'movie' ? 'MOVIE' : 'TV'}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <div className="flex items-center space-x-1">
                  <Star size={12} className="text-yellow-400" fill="currentColor" />
                  <span>{item.vote_average?.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span>{new Date(item.release_date || item.first_air_date).getFullYear()}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// My List Component
export const MyListSection = ({ currentUser, onItemClick, onPlayTrailer, onToggleWatchlist }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (currentUser) {
      const userWatchlist = watchlistService.getUserWatchlist(currentUser.id);
      const userStats = watchlistService.getWatchlistStats(currentUser.id);
      setWatchlist(userWatchlist);
      setStats(userStats);
    }
  }, [currentUser]);

  const handleToggleWatchlist = (item) => {
    onToggleWatchlist(item);
    // Refresh watchlist
    const updatedWatchlist = watchlistService.getUserWatchlist(currentUser.id);
    const updatedStats = watchlistService.getWatchlistStats(currentUser.id);
    setWatchlist(updatedWatchlist);
    setStats(updatedStats);
  };

  return (
    <div className="min-h-screen bg-black pt-32 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">My List</h1>
          <div className="flex items-center space-x-6 text-gray-300">
            <div className="flex items-center space-x-2">
              <Bookmark size={16} />
              <span>{stats.total} items</span>
            </div>
            <div className="flex items-center space-x-2">
              <Film size={16} />
              <span>{stats.movies} movies</span>
            </div>
            <div className="flex items-center space-x-2">
              <Tv size={16} />
              <span>{stats.tvShows} TV shows</span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        {watchlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchlist.map((item, index) => (
              <ContentCard
                key={`${item.id}-${item.media_type}`}
                item={item}
                onItemClick={onItemClick}
                onPlayTrailer={onPlayTrailer}
                onToggleWatchlist={handleToggleWatchlist}
                currentUser={currentUser}
                index={index}
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Bookmark size={64} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-400 mb-2">Your list is empty</h2>
            <p className="text-gray-500">
              Add movies and TV shows to your list to watch them later.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Loading Component
export const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-purple-500 border-t-transparent rounded-full animate-spin`}></div>
  );
};

// Error Component
export const ErrorMessage = ({ error, onRetry }) => (
  <motion.div
    className="text-center py-16"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="text-red-500 text-6xl mb-4">⚠️</div>
    <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
    <p className="text-gray-400 mb-4">{error}</p>
    {onRetry && (
      <motion.button
        onClick={onRetry}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Try Again
      </motion.button>
    )}
  </motion.div>
);

// Continue previous components...
export * from './components-extended';