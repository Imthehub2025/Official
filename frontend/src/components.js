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
  Share2
} from 'lucide-react';

// Mock data for TMDB-style content
const mockMovies = [
  {
    id: 1,
    title: "Quantum Odyssey",
    overview: "A mind-bending journey through parallel dimensions where reality bends to quantum mechanics.",
    backdrop_path: "https://images.unsplash.com/photo-1720962158789-9389a4f399da",
    poster_path: "https://images.unsplash.com/photo-1642796418561-88ab301fcdf9",
    genre_ids: [28, 878, 53],
    release_date: "2024-12-15",
    vote_average: 8.7,
    runtime: 142,
    trailer_key: "dQw4w9WgXcQ",
    genres: ["Action", "Sci-Fi", "Thriller"]
  },
  {
    id: 2,
    title: "Throne of Infinity",
    overview: "An epic tale of power, betrayal, and cosmic forces beyond imagination.",
    backdrop_path: "https://images.unsplash.com/photo-1704389687598-34f8c28cc4fd",
    poster_path: "https://images.pexels.com/photos/7649105/pexels-photo-7649105.jpeg",
    genre_ids: [18, 14, 10752],
    release_date: "2024-11-22",
    vote_average: 9.2,
    runtime: 156,
    trailer_key: "dQw4w9WgXcQ",
    genres: ["Drama", "Fantasy", "War"]
  },
  {
    id: 3,
    title: "Digital Horizon",
    overview: "In a world where technology controls everything, one person holds the key to freedom.",
    backdrop_path: "https://images.unsplash.com/photo-1720962158858-5fb16991d2b8",
    poster_path: "https://images.unsplash.com/photo-1717944097660-352ec0dc5c1f",
    genre_ids: [878, 28, 18],
    release_date: "2024-10-18",
    vote_average: 8.4,
    runtime: 128,
    trailer_key: "dQw4w9WgXcQ",
    genres: ["Sci-Fi", "Action", "Drama"]
  },
  {
    id: 4,
    title: "Neon Dreams",
    overview: "A cyberpunk thriller set in the near future where dreams become reality.",
    backdrop_path: "https://images.unsplash.com/photo-1619850015546-84a1c7b7aed0",
    poster_path: "https://images.unsplash.com/photo-1577045060575-07424f4e7aa7",
    genre_ids: [878, 53, 80],
    release_date: "2024-09-30",
    vote_average: 8.1,
    runtime: 134,
    trailer_key: "dQw4w9WgXcQ",
    genres: ["Sci-Fi", "Thriller", "Crime"]
  }
];

const mockTVShows = [
  {
    id: 101,
    name: "Quantum Chronicles",
    overview: "A series exploring the mysteries of quantum physics through thrilling adventures.",
    backdrop_path: "https://images.unsplash.com/photo-1720962158789-9389a4f399da",
    poster_path: "https://images.unsplash.com/photo-1642796418561-88ab301fcdf9",
    genre_ids: [878, 18, 9648],
    first_air_date: "2024-01-15",
    vote_average: 8.9,
    number_of_seasons: 3,
    trailer_key: "dQw4w9WgXcQ",
    genres: ["Sci-Fi", "Drama", "Mystery"]
  },
  {
    id: 102,
    name: "Throne Wars",
    overview: "Epic battles for the ultimate throne that controls all realities.",
    backdrop_path: "https://images.unsplash.com/photo-1704389687598-34f8c28cc4fd",
    poster_path: "https://images.pexels.com/photos/7649105/pexels-photo-7649105.jpeg",
    genre_ids: [14, 18, 10759],
    first_air_date: "2024-03-20",
    vote_average: 9.1,
    number_of_seasons: 2,
    trailer_key: "dQw4w9WgXcQ",
    genres: ["Fantasy", "Drama", "Action & Adventure"]
  }
];

// Header Component
export const Header = ({ searchQuery, setSearchQuery, showSearch, setShowSearch }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
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
          <motion.a href="#" className="text-white hover:text-gray-300 transition-colors flex items-center space-x-2" whileHover={{ scale: 1.1 }}>
            <Home size={16} />
            <span>Home</span>
          </motion.a>
          <motion.a href="#" className="text-white hover:text-gray-300 transition-colors flex items-center space-x-2" whileHover={{ scale: 1.1 }}>
            <Film size={16} />
            <span>Movies</span>
          </motion.a>
          <motion.a href="#" className="text-white hover:text-gray-300 transition-colors flex items-center space-x-2" whileHover={{ scale: 1.1 }}>
            <Tv size={16} />
            <span>TV Shows</span>
          </motion.a>
          <motion.a href="#" className="text-white hover:text-gray-300 transition-colors flex items-center space-x-2" whileHover={{ scale: 1.1 }}>
            <Bookmark size={16} />
            <span>My List</span>
          </motion.a>
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
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
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
            className="text-white hover:text-gray-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell size={20} />
          </motion.button>

          {/* Profile */}
          <motion.div className="flex items-center space-x-2" whileHover={{ scale: 1.05 }}>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </motion.div>
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

// Hero Banner Component
export const HeroBanner = ({ featuredContent, onPlayTrailer, onShowInfo }) => {
  const [isMuted, setIsMuted] = useState(true);

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
            </motion.div>

            <motion.div 
              className="flex items-center space-x-4 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <div className="flex items-center space-x-1">
                <Star size={16} className="text-yellow-400" fill="currentColor" />
                <span className="text-sm font-semibold">{featuredContent.vote_average}</span>
              </div>
              <div className="text-sm text-gray-300">
                {featuredContent.release_date?.split('-')[0] || featuredContent.first_air_date?.split('-')[0]}
              </div>
              <div className="text-sm text-gray-300">
                {featuredContent.runtime ? `${featuredContent.runtime} min` : `${featuredContent.number_of_seasons} Seasons`}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mute Button */}
      <motion.button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute bottom-8 right-8 w-12 h-12 bg-black/50 border border-gray-600 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </motion.button>
    </div>
  );
};

// Content Row Component
export const ContentRow = ({ title, content, onItemClick, onPlayTrailer }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-12">
      <motion.h2 
        className="text-2xl font-bold text-white mb-4 px-4"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        {title}
      </motion.h2>

      <div className="relative group">
        {/* Scroll Left Button */}
        <motion.button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={24} />
        </motion.button>

        {/* Content Grid */}
        <div 
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {content.map((item, index) => (
            <ContentCard
              key={item.id}
              item={item}
              onItemClick={onItemClick}
              onPlayTrailer={onPlayTrailer}
              index={index}
            />
          ))}
        </div>

        {/* Scroll Right Button */}
        <motion.button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight size={24} />
        </motion.button>
      </div>
    </div>
  );
};

// Content Card Component
export const ContentCard = ({ item, onItemClick, onPlayTrailer, index }) => {
  const [isHovered, setIsHovered] = useState(false);

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
        />
        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-lg flex flex-col justify-end p-4"
            >
              <h3 className="text-white font-semibold text-sm mb-2">
                {item.title || item.name}
              </h3>
              
              <div className="flex items-center space-x-2 mb-3">
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
                  className="w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus size={14} className="text-white" />
                </motion.button>
                
                <motion.button
                  className="w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ThumbsUp size={12} className="text-white" />
                </motion.button>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <div className="flex items-center space-x-1">
                  <Star size={12} className="text-yellow-400" fill="currentColor" />
                  <span>{item.vote_average}</span>
                </div>
                <span>•</span>
                <span>{item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0]}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Modal Component
export const Modal = ({ isOpen, onClose, content, onPlayTrailer }) => {
  if (!isOpen || !content) return null;

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
          className="bg-gray-900 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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

            <div className="absolute bottom-4 left-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                {content.title || content.name}
              </h2>
              <div className="flex items-center space-x-4">
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
                  className="w-10 h-10 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus size={20} className="text-white" />
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

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star size={16} className="text-yellow-400" fill="currentColor" />
                    <span className="text-white font-semibold">{content.vote_average}</span>
                  </div>
                  <span className="text-gray-400">
                    {content.release_date?.split('-')[0] || content.first_air_date?.split('-')[0]}
                  </span>
                  <span className="text-gray-400">
                    {content.runtime ? `${content.runtime} min` : `${content.number_of_seasons} Seasons`}
                  </span>
                </div>
                
                <p className="text-gray-300 leading-relaxed mb-4">
                  {content.overview}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {content.genres?.map((genre, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
    <footer className="bg-black text-gray-400 py-12">
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
              Experience the future of streaming with quantum-powered entertainment.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Browse</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Movies</a></li>
              <li><a href="#" className="hover:text-white transition-colors">TV Shows</a></li>
              <li><a href="#" className="hover:text-white transition-colors">My List</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Social Media</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Newsletter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            © 2024 Quantum Media Hub (Throne Edition). All rights reserved.
          </p>
          <p className="text-xs text-purple-400 font-semibold">
            ✨POWERED BY TRILLIONS✨
          </p>
        </div>
      </div>
    </footer>
  );
};

// Export mock data
export { mockMovies, mockTVShows };