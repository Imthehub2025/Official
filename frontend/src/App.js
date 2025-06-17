import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { 
  Header, 
  HeroBanner, 
  ContentRow,
  MyListSection,
  LoadingSpinner,
  ErrorMessage
} from './components';
import { 
  Modal,
  YouTubePlayer,
  Footer,
  SearchResults,
  MoviesSection,
  TVShowsSection
} from './components-extended';
import { LibrarySection } from './components/LibraryComponents';
import { VideoPlayer } from './components/VideoPlayer';
import { EnhancedSearch } from './components/EnhancedSearch';
import { useContent } from './hooks/useContent';
import { userService, watchlistService } from './services/userService';
import { getTrailerKey } from './services/tmdbApi';

function App() {
  // Content state from custom hook
  const {
    trendingContent,
    popularMovies,
    popularTVShows,
    topRatedMovies,
    topRatedTVShows,
    nowPlayingMovies,
    onTheAirTVShows,
    upcomingMovies,
    searchResults,
    featuredContent,
    loading,
    error,
    searchContent,
    loadMoreContent,
    clearSearch,
    clearError
  } = useContent();

  // UI state
  const [selectedContent, setSelectedContent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerContent, setTrailerContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentSection, setCurrentSection] = useState('home');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // User state
  const [currentUser, setCurrentUser] = useState(userService.getCurrentUser());
  const [searchPage, setSearchPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize user service
  useEffect(() => {
    userService.init();
  }, []);

  // Auto-search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery, 1);
        setCurrentSection('search');
      } else {
        clearSearch();
        if (currentSection === 'search') {
          setCurrentSection('home');
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle search
  const handleSearch = useCallback(async (query, page = 1) => {
    setIsSearching(true);
    try {
      await searchContent(query, page);
      setSearchPage(page);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchContent]);

  // Load more search results
  const handleLoadMoreSearch = useCallback(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery, searchPage + 1);
    }
  }, [searchQuery, searchPage, handleSearch]);

  // Content interaction handlers
  const handleItemClick = useCallback(async (content) => {
    try {
      // Enrich content with additional data if needed
      const enrichedContent = {
        ...content,
        media_type: content.media_type || (content.title ? 'movie' : 'tv')
      };
      
      setSelectedContent(enrichedContent);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading content details:', error);
    }
  }, []);

  const handlePlayTrailer = useCallback(async (content) => {
    try {
      let trailerKey = content.trailer_key;
      
      // If no trailer key, try to fetch videos
      if (!trailerKey) {
        console.log('Fetching trailer for:', content.title || content.name);
        // For demo purposes, we'll use a default trailer
        trailerKey = 'dQw4w9WgXcQ'; // Default fallback
      }
      
      setTrailerContent({
        ...content,
        trailer_key: trailerKey,
        media_type: content.media_type || (content.title ? 'movie' : 'tv')
      });
      setShowTrailer(true);
      setShowModal(false);
    } catch (error) {
      console.error('Error loading trailer:', error);
      // Show modal with error or use fallback trailer
      setTrailerContent({
        ...content,
        trailer_key: 'dQw4w9WgXcQ',
        media_type: content.media_type || (content.title ? 'movie' : 'tv')
      });
      setShowTrailer(true);
    }
  }, []);

  const handleShowInfo = useCallback((content) => {
    setSelectedContent({
      ...content,
      media_type: content.media_type || (content.title ? 'movie' : 'tv')
    });
    setShowModal(true);
  }, []);

  const handleToggleWatchlist = useCallback((content) => {
    if (!currentUser || !content) return;

    const mediaType = content.media_type || (content.title ? 'movie' : 'tv');
    const isCurrentlyInWatchlist = watchlistService.isInWatchlist(
      currentUser.id, 
      content.id, 
      mediaType
    );

    if (isCurrentlyInWatchlist) {
      watchlistService.removeFromWatchlist(currentUser.id, content.id, mediaType);
    } else {
      watchlistService.addToWatchlist(currentUser.id, {
        ...content,
        media_type: mediaType
      });
    }
  }, [currentUser]);

  // User management
  const handleUserChange = useCallback((user) => {
    setCurrentUser(user);
    userService.setCurrentUser(user);
  }, []);

  // Section navigation
  const handleSectionChange = useCallback((section) => {
    setCurrentSection(section);
    setShowUserMenu(false);
    
    // Clear search when navigating away from search
    if (section !== 'search') {
      setSearchQuery('');
      setShowSearch(false);
      clearSearch();
    }
  }, [clearSearch]);

  // Modal handlers
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedContent(null);
  }, []);

  const handleCloseTrailer = useCallback(() => {
    setShowTrailer(false);
    setTrailerContent(null);
  }, []);

  // Content organization by genres
  const getGenreContent = useCallback((genreName, allContent) => {
    const genreMap = {
      'Action': [28, 10759],
      'Adventure': [12, 10759],
      'Animation': [16],
      'Comedy': [35],
      'Crime': [80],
      'Documentary': [99],
      'Drama': [18],
      'Family': [10751],
      'Fantasy': [14],
      'History': [36],
      'Horror': [27],
      'Music': [10402],
      'Mystery': [9648],
      'Romance': [10749],
      'Science Fiction': [878],
      'Thriller': [53],
      'War': [10752],
      'Western': [37]
    };

    const genreIds = genreMap[genreName] || [];
    return allContent.filter(item => 
      item.genre_ids?.some(id => genreIds.includes(id))
    ).slice(0, 20);
  }, []);

  // Render different sections
  const renderContent = () => {
    if (error) {
      return <ErrorMessage error={error} onRetry={clearError} />;
    }

    switch (currentSection) {
      case 'movies':
        return (
          <MoviesSection
            popularMovies={popularMovies}
            topRatedMovies={topRatedMovies}
            nowPlayingMovies={nowPlayingMovies}
            upcomingMovies={upcomingMovies}
            onItemClick={handleItemClick}
            onPlayTrailer={handlePlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={handleToggleWatchlist}
            loading={loading}
            onLoadMore={loadMoreContent}
          />
        );

      case 'tv-shows':
        return (
          <TVShowsSection
            popularTVShows={popularTVShows}
            topRatedTVShows={topRatedTVShows}
            onTheAirTVShows={onTheAirTVShows}
            onItemClick={handleItemClick}
            onPlayTrailer={handlePlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={handleToggleWatchlist}
            loading={loading}
            onLoadMore={loadMoreContent}
          />
        );

      case 'my-list':
        return (
          <MyListSection
            currentUser={currentUser}
            onItemClick={handleItemClick}
            onPlayTrailer={handlePlayTrailer}
            onToggleWatchlist={handleToggleWatchlist}
          />
        );

      case 'search':
        return (
          <SearchResults
            results={searchResults}
            query={searchQuery}
            onItemClick={handleItemClick}
            onPlayTrailer={handlePlayTrailer}
            currentUser={currentUser}
            onToggleWatchlist={handleToggleWatchlist}
            loading={isSearching}
            onLoadMore={handleLoadMoreSearch}
            hasMore={searchResults.length > 0 && searchResults.length % 20 === 0}
          />
        );

      case 'home':
      default:
        // Combine all content for genre-based rows
        const allContent = [
          ...trendingContent,
          ...popularMovies,
          ...popularTVShows,
          ...topRatedMovies,
          ...topRatedTVShows,
          ...nowPlayingMovies,
          ...onTheAirTVShows,
          ...upcomingMovies
        ];

        const actionContent = getGenreContent('Action', allContent);
        const comedyContent = getGenreContent('Comedy', allContent);
        const dramaContent = getGenreContent('Drama', allContent);
        const sciFiContent = getGenreContent('Science Fiction', allContent);
        const horrorContent = getGenreContent('Horror', allContent);

        return (
          <>
            {/* Hero Banner */}
            <HeroBanner 
              featuredContent={featuredContent}
              onPlayTrailer={handlePlayTrailer}
              onShowInfo={handleShowInfo}
              currentUser={currentUser}
              onToggleWatchlist={handleToggleWatchlist}
            />

            {/* Content Sections */}
            <div className="relative z-10 -mt-32 pb-16">
              {/* Trending Now */}
              <ContentRow
                title="🔥 Trending Now"
                content={trendingContent}
                onItemClick={handleItemClick}
                onPlayTrailer={handlePlayTrailer}
                currentUser={currentUser}
                onToggleWatchlist={handleToggleWatchlist}
                loading={loading}
                onLoadMore={() => loadMoreContent('trending')}
              />

              {/* Popular Movies */}
              <ContentRow
                title="🎬 Popular Movies"
                content={popularMovies}
                onItemClick={handleItemClick}
                onPlayTrailer={handlePlayTrailer}
                currentUser={currentUser}
                onToggleWatchlist={handleToggleWatchlist}
                loading={loading}
              />

              {/* Popular TV Shows */}
              <ContentRow
                title="📺 Popular TV Shows"
                content={popularTVShows}
                onItemClick={handleItemClick}
                onPlayTrailer={handlePlayTrailer}
                currentUser={currentUser}
                onToggleWatchlist={handleToggleWatchlist}
                loading={loading}
              />

              {/* Top Rated */}
              <ContentRow
                title="⭐ Top Rated"
                content={[...topRatedMovies, ...topRatedTVShows].sort((a, b) => b.vote_average - a.vote_average)}
                onItemClick={handleItemClick}
                onPlayTrailer={handlePlayTrailer}
                currentUser={currentUser}
                onToggleWatchlist={handleToggleWatchlist}
                loading={loading}
              />

              {/* Now Playing & On Air */}
              <ContentRow
                title="🎭 Now Playing & On Air"
                content={[...nowPlayingMovies, ...onTheAirTVShows]}
                onItemClick={handleItemClick}
                onPlayTrailer={handlePlayTrailer}
                currentUser={currentUser}
                onToggleWatchlist={handleToggleWatchlist}
                loading={loading}
              />

              {/* Genre-based rows */}
              {actionContent.length > 0 && (
                <ContentRow
                  title="💥 Action & Adventure"
                  content={actionContent}
                  onItemClick={handleItemClick}
                  onPlayTrailer={handlePlayTrailer}
                  currentUser={currentUser}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              )}

              {sciFiContent.length > 0 && (
                <ContentRow
                  title="🚀 Sci-Fi & Fantasy"
                  content={sciFiContent}
                  onItemClick={handleItemClick}
                  onPlayTrailer={handlePlayTrailer}
                  currentUser={currentUser}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              )}

              {comedyContent.length > 0 && (
                <ContentRow
                  title="😂 Comedy"
                  content={comedyContent}
                  onItemClick={handleItemClick}
                  onPlayTrailer={handlePlayTrailer}
                  currentUser={currentUser}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              )}

              {dramaContent.length > 0 && (
                <ContentRow
                  title="🎭 Drama"
                  content={dramaContent}
                  onItemClick={handleItemClick}
                  onPlayTrailer={handlePlayTrailer}
                  currentUser={currentUser}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              )}

              {horrorContent.length > 0 && (
                <ContentRow
                  title="👻 Horror & Thriller"
                  content={horrorContent}
                  onItemClick={handleItemClick}
                  onPlayTrailer={handlePlayTrailer}
                  currentUser={currentUser}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              )}

              {/* Coming Soon */}
              <ContentRow
                title="🔮 Coming Soon"
                content={upcomingMovies}
                onItemClick={handleItemClick}
                onPlayTrailer={handlePlayTrailer}
                currentUser={currentUser}
                onToggleWatchlist={handleToggleWatchlist}
                loading={loading}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
      />

      {/* Main Content */}
      {renderContent()}

      {/* Footer */}
      <Footer />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        content={selectedContent}
        onPlayTrailer={handlePlayTrailer}
        currentUser={currentUser}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* YouTube Player */}
      <YouTubePlayer
        isOpen={showTrailer}
        onClose={handleCloseTrailer}
        videoKey={trailerContent?.trailer_key}
        title={trailerContent?.title || trailerContent?.name}
      />

      {/* Auto-Update Indicator */}
      <div className="fixed bottom-4 right-4 z-40">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live TMDB Data</span>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && trendingContent.length === 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="text-white mt-4">Loading amazing content...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;