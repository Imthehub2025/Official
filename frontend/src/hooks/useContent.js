import { useState, useEffect, useCallback } from 'react';
import { 
  moviesApi, 
  tvApi, 
  searchApi, 
  trendingApi, 
  genresApi,
  enrichContentBatch 
} from '../services/tmdbApi';

// Custom hook for managing content data
export const useContent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Content state
  const [trendingContent, setTrendingContent] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTVShows, setPopularTVShows] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [onTheAirTVShows, setOnTheAirTVShows] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTVGenres] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [featuredContent, setFeaturedContent] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load initial content
  const loadInitialContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading content from TMDB...');
      
      // Load all content in parallel
      const [
        trendingResponse,
        popularMoviesResponse,
        popularTVResponse,
        topRatedMoviesResponse,
        topRatedTVResponse,
        nowPlayingResponse,
        onTheAirResponse,
        upcomingResponse,
        movieGenresResponse,
        tvGenresResponse
      ] = await Promise.all([
        trendingApi.getAll('day', 1),
        moviesApi.getPopular(1),
        tvApi.getPopular(1),
        moviesApi.getTopRated(1),
        tvApi.getTopRated(1),
        moviesApi.getNowPlaying(1),
        tvApi.getOnTheAir(1),
        moviesApi.getUpcoming(1),
        genresApi.getMovieGenres(),
        genresApi.getTVGenres()
      ]);

      // Process and enrich content
      const [
        enrichedTrending,
        enrichedPopularMovies,
        enrichedPopularTV,
        enrichedTopRatedMovies,
        enrichedTopRatedTV,
        enrichedNowPlaying,
        enrichedOnTheAir,
        enrichedUpcoming
      ] = await Promise.all([
        enrichContentBatch(trendingResponse.results.slice(0, 20)),
        enrichContentBatch(popularMoviesResponse.results.slice(0, 20)),
        enrichContentBatch(popularTVResponse.results.slice(0, 20)),
        enrichContentBatch(topRatedMoviesResponse.results.slice(0, 20)),
        enrichContentBatch(topRatedTVResponse.results.slice(0, 20)),
        enrichContentBatch(nowPlayingResponse.results.slice(0, 20)),
        enrichContentBatch(onTheAirResponse.results.slice(0, 20)),
        enrichContentBatch(upcomingResponse.results.slice(0, 20))
      ]);

      // Set state
      setTrendingContent(enrichedTrending);
      setPopularMovies(enrichedPopularMovies);
      setPopularTVShows(enrichedPopularTV);
      setTopRatedMovies(enrichedTopRatedMovies);
      setTopRatedTVShows(enrichedTopRatedTV);
      setNowPlayingMovies(enrichedNowPlaying);
      setOnTheAirTVShows(enrichedOnTheAir);
      setUpcomingMovies(enrichedUpcoming);
      setMovieGenres(movieGenresResponse.genres);
      setTVGenres(tvGenresResponse.genres);
      
      // Set featured content (first trending item)
      if (enrichedTrending.length > 0) {
        setFeaturedContent(enrichedTrending[0]);
      }

      console.log('Content loaded successfully');
    } catch (err) {
      console.error('Error loading content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more content (pagination)
  const loadMoreContent = useCallback(async (contentType, page = 2) => {
    setLoading(true);
    
    try {
      let response;
      
      switch (contentType) {
        case 'trending':
          response = await trendingApi.getAll('day', page);
          const enrichedContent = await enrichContentBatch(response.results);
          setTrendingContent(prev => [...prev, ...enrichedContent]);
          break;
        case 'popular-movies':
          response = await moviesApi.getPopular(page);
          const enrichedMovies = await enrichContentBatch(response.results);
          setPopularMovies(prev => [...prev, ...enrichedMovies]);
          break;
        case 'popular-tv':
          response = await tvApi.getPopular(page);
          const enrichedTV = await enrichContentBatch(response.results);
          setPopularTVShows(prev => [...prev, ...enrichedTV]);
          break;
        default:
          break;
      }
      
      setCurrentPage(page);
      setTotalPages(response?.total_pages || 1);
    } catch (err) {
      console.error('Error loading more content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search content
  const searchContent = useCallback(async (query, page = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchApi.multi(query, page);
      const enrichedResults = await enrichContentBatch(
        response.results.filter(item => item.media_type !== 'person')
      );
      
      if (page === 1) {
        setSearchResults(enrichedResults);
      } else {
        setSearchResults(prev => [...prev, ...enrichedResults]);
      }
      
      setCurrentPage(page);
      setTotalPages(response.total_pages);
    } catch (err) {
      console.error('Error searching content:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get content by genre
  const getContentByGenre = useCallback(async (genreId, mediaType = 'movie', page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (mediaType === 'movie') {
        response = await moviesApi.discoverByGenre(genreId, page);
      } else {
        response = await tvApi.discoverByGenre(genreId, page);
      }
      
      const enrichedContent = await enrichContentBatch(response.results);
      return enrichedContent;
    } catch (err) {
      console.error('Error getting content by genre:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Rotate featured content
  const rotateFeaturedContent = useCallback(() => {
    if (trendingContent.length > 0) {
      const currentIndex = trendingContent.findIndex(item => item.id === featuredContent?.id);
      const nextIndex = (currentIndex + 1) % trendingContent.length;
      setFeaturedContent(trendingContent[nextIndex]);
    }
  }, [trendingContent, featuredContent]);

  // Auto-rotate featured content
  useEffect(() => {
    const interval = setInterval(() => {
      rotateFeaturedContent();
    }, 15000); // Change every 15 seconds

    return () => clearInterval(interval);
  }, [rotateFeaturedContent]);

  // Load initial content on mount
  useEffect(() => {
    loadInitialContent();
  }, [loadInitialContent]);

  return {
    // Content data
    trendingContent,
    popularMovies,
    popularTVShows,
    topRatedMovies,
    topRatedTVShows,
    nowPlayingMovies,
    onTheAirTVShows,
    upcomingMovies,
    movieGenres,
    tvGenres,
    searchResults,
    featuredContent,
    
    // Pagination
    currentPage,
    totalPages,
    
    // Loading states
    loading,
    error,
    
    // Actions
    loadInitialContent,
    loadMoreContent,
    searchContent,
    getContentByGenre,
    rotateFeaturedContent,
    setFeaturedContent,
    
    // Utility functions
    clearSearch: () => setSearchResults([]),
    clearError: () => setError(null)
  };
};

// Hook for individual content details
export const useContentDetails = (contentId, mediaType) => {
  const [content, setContent] = useState(null);
  const [videos, setVideos] = useState([]);
  const [credits, setCreditss] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadContentDetails = useCallback(async () => {
    if (!contentId || !mediaType) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const api = mediaType === 'movie' ? moviesApi : tvApi;
      
      const [detailsResponse, videosResponse, creditsResponse, similarResponse] = await Promise.all([
        api.getDetails(contentId),
        api.getVideos(contentId),
        api.getCredits(contentId),
        api.getSimilar(contentId)
      ]);
      
      setContent(detailsResponse);
      setVideos(videosResponse.results);
      setCreditss(creditsResponse);
      
      const enrichedSimilar = await enrichContentBatch(similarResponse.results.slice(0, 12));
      setSimilar(enrichedSimilar);
      
    } catch (err) {
      console.error('Error loading content details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contentId, mediaType]);

  useEffect(() => {
    loadContentDetails();
  }, [loadContentDetails]);

  return {
    content,
    videos,
    credits,
    similar,
    loading,
    error,
    reload: loadContentDetails
  };
};