// User Profile and Watchlist Service
const STORAGE_KEYS = {
  CURRENT_USER: 'quantum_current_user',
  USERS: 'quantum_users',
  WATCHLISTS: 'quantum_watchlists'
};

// Default user profiles
const DEFAULT_USERS = [
  {
    id: 'user1',
    name: 'Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    isKids: false,
    preferences: {
      genres: ['Action', 'Sci-Fi', 'Thriller'],
      maturityRating: 'R'
    }
  },
  {
    id: 'user2',
    name: 'Sarah',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9c3b2e4?w=100&h=100&fit=crop&crop=face',
    isKids: false,
    preferences: {
      genres: ['Drama', 'Romance', 'Comedy'],
      maturityRating: 'PG-13'
    }
  },
  {
    id: 'user3',
    name: 'Kids',
    avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=100&h=100&fit=crop&crop=face',
    isKids: true,
    preferences: {
      genres: ['Animation', 'Family', 'Adventure'],
      maturityRating: 'G'
    }
  },
  {
    id: 'user4',
    name: 'Mike',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    isKids: false,
    preferences: {
      genres: ['Horror', 'Mystery', 'Crime'],
      maturityRating: 'R'
    }
  }
];

// Initialize users if not exist
const initializeUsers = () => {
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!existingUsers) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
  
  // Set default current user if none selected
  const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!currentUser) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
  }
};

// User Management
export const userService = {
  // Initialize users
  init: () => {
    initializeUsers();
  },

  // Get all users
  getAllUsers: () => {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : DEFAULT_USERS;
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : DEFAULT_USERS[0];
  },

  // Set current user
  setCurrentUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  // Add new user
  addUser: (userData) => {
    const users = userService.getAllUsers();
    const newUser = {
      id: `user_${Date.now()}`,
      name: userData.name,
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
      isKids: userData.isKids || false,
      preferences: userData.preferences || {
        genres: ['Action', 'Drama'],
        maturityRating: userData.isKids ? 'G' : 'PG-13'
      }
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  // Update user
  updateUser: (userId, updates) => {
    const users = userService.getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Update current user if it's being modified
      const currentUser = userService.getCurrentUser();
      if (currentUser.id === userId) {
        userService.setCurrentUser(users[userIndex]);
      }
      
      return users[userIndex];
    }
    return null;
  },

  // Delete user
  deleteUser: (userId) => {
    const users = userService.getAllUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
    
    // If deleted user was current user, switch to first available user
    const currentUser = userService.getCurrentUser();
    if (currentUser.id === userId && filteredUsers.length > 0) {
      userService.setCurrentUser(filteredUsers[0]);
    }
    
    return filteredUsers;
  }
};

// Watchlist Management
export const watchlistService = {
  // Get user's watchlist
  getUserWatchlist: (userId) => {
    const watchlists = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
    const allWatchlists = watchlists ? JSON.parse(watchlists) : {};
    return allWatchlists[userId] || [];
  },

  // Add to watchlist
  addToWatchlist: (userId, content) => {
    const watchlists = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
    const allWatchlists = watchlists ? JSON.parse(watchlists) : {};
    
    if (!allWatchlists[userId]) {
      allWatchlists[userId] = [];
    }
    
    // Check if already in watchlist
    const exists = allWatchlists[userId].find(item => item.id === content.id && item.media_type === content.media_type);
    if (!exists) {
      const watchlistItem = {
        id: content.id,
        title: content.title || content.name,
        poster_path: content.poster_path,
        backdrop_path: content.backdrop_path,
        overview: content.overview,
        vote_average: content.vote_average,
        release_date: content.release_date || content.first_air_date,
        media_type: content.media_type || (content.title ? 'movie' : 'tv'),
        addedAt: new Date().toISOString()
      };
      
      allWatchlists[userId].unshift(watchlistItem); // Add to beginning
      localStorage.setItem(STORAGE_KEYS.WATCHLISTS, JSON.stringify(allWatchlists));
    }
    
    return allWatchlists[userId];
  },

  // Remove from watchlist
  removeFromWatchlist: (userId, contentId, mediaType) => {
    const watchlists = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
    const allWatchlists = watchlists ? JSON.parse(watchlists) : {};
    
    if (allWatchlists[userId]) {
      allWatchlists[userId] = allWatchlists[userId].filter(
        item => !(item.id === contentId && item.media_type === mediaType)
      );
      localStorage.setItem(STORAGE_KEYS.WATCHLISTS, JSON.stringify(allWatchlists));
    }
    
    return allWatchlists[userId] || [];
  },

  // Check if content is in watchlist
  isInWatchlist: (userId, contentId, mediaType) => {
    const watchlist = watchlistService.getUserWatchlist(userId);
    return watchlist.some(item => item.id === contentId && item.media_type === mediaType);
  },

  // Clear user's watchlist
  clearWatchlist: (userId) => {
    const watchlists = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
    const allWatchlists = watchlists ? JSON.parse(watchlists) : {};
    
    allWatchlists[userId] = [];
    localStorage.setItem(STORAGE_KEYS.WATCHLISTS, JSON.stringify(allWatchlists));
    
    return [];
  },

  // Get watchlist stats
  getWatchlistStats: (userId) => {
    const watchlist = watchlistService.getUserWatchlist(userId);
    const movies = watchlist.filter(item => item.media_type === 'movie');
    const tvShows = watchlist.filter(item => item.media_type === 'tv');
    
    return {
      total: watchlist.length,
      movies: movies.length,
      tvShows: tvShows.length,
      recentlyAdded: watchlist.slice(0, 5)
    };
  }
};

// Continue Watching Service (for future enhancement)
export const continueWatchingService = {
  // Add to continue watching
  addToContinueWatching: (userId, content, progress = 0) => {
    // Implementation for continue watching functionality
    // This could track viewing progress, last watched episode, etc.
  },

  // Get continue watching list
  getContinueWatching: (userId) => {
    // Return list of partially watched content
    return [];
  }
};

// Initialize services
userService.init();