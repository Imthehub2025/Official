// TMDB API Service with multiple API keys for rate limiting
const API_KEYS = [
  'c8dea14dc917687ac631a52620e4f7ad',
  '3cb41ecea3bf606c56552db3d17adefd'
];

let currentKeyIndex = 0;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Get current API key and rotate if needed
const getApiKey = () => {
  return API_KEYS[currentKeyIndex];
};

// Rotate to next API key
const rotateApiKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(`Rotated to API key index: ${currentKeyIndex}`);
};

// Make API request with automatic key rotation on rate limit
const makeRequest = async (endpoint, params = {}) => {
  let lastError;
  
  // Try each API key
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    try {
      const apiKey = getApiKey();
      const url = new URL(`${BASE_URL}${endpoint}`);
      
      // Add API key and other params
      url.searchParams.append('api_key', apiKey);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url);
      
      if (response.status === 429) {
        // Rate limited, try next key
        console.warn(`Rate limited on key ${currentKeyIndex}, rotating...`);
        rotateApiKey();
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error;
      console.error(`Error with API key ${currentKeyIndex}:`, error);
      rotateApiKey();
    }
  }
  
  // If all keys failed, throw the last error
  throw lastError;
};

// Get image URL
export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// Get backdrop URL
export const getBackdropUrl = (path, size = 'w1280') => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// Movies API
export const moviesApi = {
  // Get popular movies
  getPopular: (page = 1) => makeRequest('/movie/popular', { page }),
  
  // Get top rated movies
  getTopRated: (page = 1) => makeRequest('/movie/top_rated', { page }),
  
  // Get now playing movies
  getNowPlaying: (page = 1) => makeRequest('/movie/now_playing', { page }),
  
  // Get upcoming movies
  getUpcoming: (page = 1) => makeRequest('/movie/upcoming', { page }),
  
  // Get movie details
  getDetails: (id) => makeRequest(`/movie/${id}`),
  
  // Get movie videos
  getVideos: (id) => makeRequest(`/movie/${id}/videos`),
  
  // Get movie credits
  getCredits: (id) => makeRequest(`/movie/${id}/credits`),
  
  // Get similar movies
  getSimilar: (id, page = 1) => makeRequest(`/movie/${id}/similar`, { page }),
  
  // Discover movies by genre
  discoverByGenre: (genreId, page = 1) => makeRequest('/discover/movie', { 
    with_genres: genreId, 
    page 
  }),
};

// TV Shows API
export const tvApi = {
  // Get popular TV shows
  getPopular: (page = 1) => makeRequest('/tv/popular', { page }),
  
  // Get top rated TV shows
  getTopRated: (page = 1) => makeRequest('/tv/top_rated', { page }),
  
  // Get on the air TV shows
  getOnTheAir: (page = 1) => makeRequest('/tv/on_the_air', { page }),
  
  // Get airing today
  getAiringToday: (page = 1) => makeRequest('/tv/airing_today', { page }),
  
  // Get TV show details
  getDetails: (id) => makeRequest(`/tv/${id}`),
  
  // Get TV show videos
  getVideos: (id) => makeRequest(`/tv/${id}/videos`),
  
  // Get TV show credits
  getCredits: (id) => makeRequest(`/tv/${id}/credits`),
  
  // Get similar TV shows
  getSimilar: (id, page = 1) => makeRequest(`/tv/${id}/similar`, { page }),
  
  // Discover TV shows by genre
  discoverByGenre: (genreId, page = 1) => makeRequest('/discover/tv', { 
    with_genres: genreId, 
    page 
  }),
};

// Search API
export const searchApi = {
  // Multi search (movies, TV shows, people)
  multi: (query, page = 1) => makeRequest('/search/multi', { query, page }),
  
  // Search movies
  movies: (query, page = 1) => makeRequest('/search/movie', { query, page }),
  
  // Search TV shows
  tv: (query, page = 1) => makeRequest('/search/tv', { query, page }),
};

// Genres API
export const genresApi = {
  // Get movie genres
  getMovieGenres: () => makeRequest('/genre/movie/list'),
  
  // Get TV genres
  getTVGenres: () => makeRequest('/genre/tv/list'),
};

// Trending API
export const trendingApi = {
  // Get trending (all, movie, tv, person)
  getAll: (timeWindow = 'day', page = 1) => makeRequest(`/trending/all/${timeWindow}`, { page }),
  
  // Get trending movies
  getMovies: (timeWindow = 'day', page = 1) => makeRequest(`/trending/movie/${timeWindow}`, { page }),
  
  // Get trending TV shows
  getTV: (timeWindow = 'day', page = 1) => makeRequest(`/trending/tv/${timeWindow}`, { page }),
};

// Helper function to get trailer key from videos
export const getTrailerKey = (videos) => {
  if (!videos || !videos.results) return null;
  
  // Look for official trailer first
  const trailer = videos.results.find(video => 
    video.site === 'YouTube' && 
    video.type === 'Trailer' && 
    video.official
  );
  
  if (trailer) return trailer.key;
  
  // Fall back to any trailer
  const anyTrailer = videos.results.find(video => 
    video.site === 'YouTube' && 
    video.type === 'Trailer'
  );
  
  if (anyTrailer) return anyTrailer.key;
  
  // Fall back to any YouTube video
  const anyVideo = videos.results.find(video => video.site === 'YouTube');
  
  return anyVideo ? anyVideo.key : null;
};

// Content enrichment helper
export const enrichContent = async (content) => {
  try {
    // Get videos for trailer
    const videos = content.media_type === 'movie' || content.title
      ? await moviesApi.getVideos(content.id)
      : await tvApi.getVideos(content.id);
    
    const trailerKey = getTrailerKey(videos);
    
    return {
      ...content,
      poster_path: getImageUrl(content.poster_path),
      backdrop_path: getBackdropUrl(content.backdrop_path),
      trailer_key: trailerKey,
      // Normalize title field
      title: content.title || content.name,
      // Add media type if not present
      media_type: content.media_type || (content.title ? 'movie' : 'tv')
    };
  } catch (error) {
    console.error('Error enriching content:', error);
    return {
      ...content,
      poster_path: getImageUrl(content.poster_path),
      backdrop_path: getBackdropUrl(content.backdrop_path),
      title: content.title || content.name,
      media_type: content.media_type || (content.title ? 'movie' : 'tv')
    };
  }
};

// Batch content enrichment
export const enrichContentBatch = async (contentList) => {
  try {
    const enrichedContent = await Promise.all(
      contentList.map(content => enrichContent(content))
    );
    return enrichedContent;
  } catch (error) {
    console.error('Error enriching content batch:', error);
    // Return basic enrichment on error
    return contentList.map(content => ({
      ...content,
      poster_path: getImageUrl(content.poster_path),
      backdrop_path: getBackdropUrl(content.backdrop_path),
      title: content.title || content.name,
      media_type: content.media_type || (content.title ? 'movie' : 'tv')
    }));
  }
};