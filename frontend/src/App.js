import React, { useState, useEffect } from 'react';
import './App.css';
import { 
  Header, 
  HeroBanner, 
  ContentRow, 
  Modal, 
  YouTubePlayer, 
  Footer,
  mockMovies,
  mockTVShows 
} from './components';

function App() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerContent, setTrailerContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [featuredContent, setFeaturedContent] = useState(mockMovies[0]);

  // Simulate content updates
  useEffect(() => {
    const interval = setInterval(() => {
      const allContent = [...mockMovies, ...mockTVShows];
      const randomContent = allContent[Math.floor(Math.random() * allContent.length)];
      setFeaturedContent(randomContent);
    }, 10000); // Change featured content every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleItemClick = (content) => {
    setSelectedContent(content);
    setShowModal(true);
  };

  const handlePlayTrailer = (content) => {
    setTrailerContent(content);
    setShowTrailer(true);
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContent(null);
  };

  const handleCloseTrailer = () => {
    setShowTrailer(false);
    setTrailerContent(null);
  };

  const handleShowInfo = (content) => {
    setSelectedContent(content);
    setShowModal(true);
  };

  // Filter content based on search query
  const filterContent = (content) => {
    if (!searchQuery) return content;
    return content.filter(item => 
      (item.title || item.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.overview.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredMovies = filterContent(mockMovies);
  const filteredTVShows = filterContent(mockTVShows);

  // Content categories
  const trendingContent = [...mockMovies.slice(0, 2), ...mockTVShows.slice(0, 1)];
  const topRatedContent = [...mockMovies, ...mockTVShows].sort((a, b) => b.vote_average - a.vote_average);
  const newReleases = [...mockMovies, ...mockTVShows].sort((a, b) => 
    new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date)
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />

      {/* Hero Banner */}
      <HeroBanner 
        featuredContent={featuredContent}
        onPlayTrailer={handlePlayTrailer}
        onShowInfo={handleShowInfo}
      />

      {/* Content Sections */}
      <div className="relative z-10 -mt-32 pb-16">
        {/* Trending Now */}
        <ContentRow
          title="🔥 Trending Now"
          content={filterContent(trendingContent)}
          onItemClick={handleItemClick}
          onPlayTrailer={handlePlayTrailer}
        />

        {/* Top Rated */}
        <ContentRow
          title="⭐ Top Rated"
          content={filterContent(topRatedContent)}
          onItemClick={handleItemClick}
          onPlayTrailer={handlePlayTrailer}
        />

        {/* New Releases */}
        <ContentRow
          title="🆕 New Releases"
          content={filterContent(newReleases)}
          onItemClick={handleItemClick}
          onPlayTrailer={handlePlayTrailer}
        />

        {/* Movies */}
        {filteredMovies.length > 0 && (
          <ContentRow
            title="🎬 Movies"
            content={filteredMovies}
            onItemClick={handleItemClick}
            onPlayTrailer={handlePlayTrailer}
          />
        )}

        {/* TV Shows */}
        {filteredTVShows.length > 0 && (
          <ContentRow
            title="📺 TV Shows"
            content={filteredTVShows}
            onItemClick={handleItemClick}
            onPlayTrailer={handlePlayTrailer}
          />
        )}

        {/* Sci-Fi & Fantasy */}
        <ContentRow
          title="🚀 Sci-Fi & Fantasy"
          content={filterContent([...mockMovies, ...mockTVShows].filter(item => 
            item.genres?.some(genre => ['Sci-Fi', 'Fantasy'].includes(genre))
          ))}
          onItemClick={handleItemClick}
          onPlayTrailer={handlePlayTrailer}
        />

        {/* Action & Thriller */}
        <ContentRow
          title="💥 Action & Thriller"
          content={filterContent([...mockMovies, ...mockTVShows].filter(item => 
            item.genres?.some(genre => ['Action', 'Thriller'].includes(genre))
          ))}
          onItemClick={handleItemClick}
          onPlayTrailer={handlePlayTrailer}
        />

        {/* Search Results */}
        {searchQuery && (
          <ContentRow
            title={`🔍 Search Results for "${searchQuery}"`}
            content={filterContent([...mockMovies, ...mockTVShows])}
            onItemClick={handleItemClick}
            onPlayTrailer={handlePlayTrailer}
          />
        )}

        {/* No Results Message */}
        {searchQuery && filterContent([...mockMovies, ...mockTVShows]).length === 0 && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-400 mb-4">
              No results found for "{searchQuery}"
            </h2>
            <p className="text-gray-500">
              Try adjusting your search terms or browse our categories above.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        content={selectedContent}
        onPlayTrailer={handlePlayTrailer}
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
            <span>Auto-Updating Content</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;