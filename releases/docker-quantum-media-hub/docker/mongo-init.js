// Quantum Media Hub - MongoDB Initialization Script

db = db.getSiblingDB('quantum_media_hub');

// Create collections with proper indexing
db.createCollection('users');
db.createCollection('content');
db.createCollection('viewing_sessions');
db.createCollection('reviews');
db.createCollection('watch_parties');
db.createCollection('content_shares');
db.createCollection('ai_recommendations');
db.createCollection('voice_commands');
db.createCollection('user_analytics');
db.createCollection('interactive_content');
db.createCollection('live_streams');
db.createCollection('connected_devices');

// Create indexes for better performance
db.users.createIndex({ "id": 1 }, { unique: true });
db.users.createIndex({ "name": 1 });
db.users.createIndex({ "sovereignty_mode": 1 });

db.content.createIndex({ "id": 1 }, { unique: true });
db.content.createIndex({ "title": "text", "description": "text" });
db.content.createIndex({ "genre": 1 });
db.content.createIndex({ "content_type": 1 });
db.content.createIndex({ "rating": 1 });
db.content.createIndex({ "created_at": -1 });
db.content.createIndex({ "sovereignty_source": 1 });

db.viewing_sessions.createIndex({ "user_id": 1, "start_time": -1 });
db.viewing_sessions.createIndex({ "content_id": 1 });
db.viewing_sessions.createIndex({ "xr_session": 1 });
db.viewing_sessions.createIndex({ "device_type": 1 });

db.reviews.createIndex({ "content_id": 1, "created_at": -1 });
db.reviews.createIndex({ "user_id": 1 });
db.reviews.createIndex({ "helpful_votes": -1 });

db.watch_parties.createIndex({ "id": 1 }, { unique: true });
db.watch_parties.createIndex({ "host_user_id": 1 });
db.watch_parties.createIndex({ "is_active": 1 });

db.ai_recommendations.createIndex({ "user_id": 1, "created_at": -1 });
db.ai_recommendations.createIndex({ "content_id": 1 });

db.voice_commands.createIndex({ "user_id": 1, "timestamp": -1 });
db.voice_commands.createIndex({ "command": 1 });
db.voice_commands.createIndex({ "success": 1 });

db.user_analytics.createIndex({ "user_id": 1 }, { unique: true });
db.user_analytics.createIndex({ "last_updated": -1 });

// Insert sample admin user
db.users.insertOne({
    "id": "admin_001",
    "name": "Platform Administrator",
    "avatar": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    "is_kids": false,
    "preferences": {
        "genres": ["all"],
        "languages": ["en"],
        "content_rating": "all"
    },
    "sovereignty_mode": true,
    "access_level": "admin",
    "created_at": new Date(),
    "sovereignty_settings": {
        "user_id": "admin_001",
        "decentralized_storage": true,
        "p2p_sharing": true,
        "local_ai_processing": true,
        "external_api_usage": true,
        "content_source_preferences": ["local", "p2p", "api"],
        "privacy_level": "maximum",
        "data_retention_days": 0,
        "encryption_enabled": true,
        "anonymous_mode": false
    }
});

// Insert sample content
db.content.insertOne({
    "id": "demo_content_001",
    "title": "Quantum Media Hub: Platform Demo",
    "description": "A comprehensive demonstration of the Quantum Media Hub platform capabilities, showcasing sovereignty mode, AI recommendations, and advanced streaming features.",
    "content_type": "movie",
    "genre": ["documentary", "technology", "demo"],
    "rating": "G",
    "release_date": new Date(),
    "duration": 45,
    "cast": ["Platform AI", "Sovereignty Engine"],
    "director": "Quantum Development Team",
    "languages": ["en"],
    "subtitles": ["en", "es", "fr"],
    "quality_available": ["1080p", "2160p"],
    "ai_tags": ["platform demo", "quantum computing", "streaming", "sovereignty"],
    "content_warnings": [],
    "is_restricted": false,
    "sovereignty_source": "local",
    "created_at": new Date(),
    "updated_at": new Date()
});

print("Quantum Media Hub database initialized successfully!");