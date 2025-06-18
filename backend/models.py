from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from enum import Enum

# User and Profile Models
class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    avatar: Optional[str] = None
    is_kids: bool = False
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sovereignty_mode: bool = False
    access_level: str = "standard"  # standard, premium, sovereign

class UserPreferences(BaseModel):
    genres: List[str] = []
    languages: List[str] = ["en"]
    content_rating: str = "all"
    ai_recommendations: bool = True
    content_moderation: bool = True
    voice_commands: bool = True
    analytics_enabled: bool = True
    sovereignty_settings: Dict[str, bool] = Field(default_factory=dict)

# Content Models
class ContentType(str, Enum):
    MOVIE = "movie"
    TV = "tv"
    LIVE = "live"
    INTERACTIVE = "interactive"
    USER_GENERATED = "user_generated"

class ContentRating(str, Enum):
    G = "G"
    PG = "PG"
    PG13 = "PG-13"
    R = "R"
    NC17 = "NC-17"
    UNRATED = "UNRATED"
    ADULT = "ADULT"

class VideoQuality(str, Enum):
    HD = "1080p"
    FHD = "2160p"  # 4K
    UHD8K = "4320p"  # 8K
    UHD16K = "8640p"  # 16K

class ContentMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    content_type: ContentType
    genre: List[str] = []
    rating: ContentRating = ContentRating.UNRATED
    release_date: Optional[datetime] = None
    duration: Optional[int] = None  # in minutes
    cast: List[str] = []
    director: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    trailer_url: Optional[str] = None
    languages: List[str] = ["en"]
    subtitles: List[str] = []
    quality_available: List[VideoQuality] = []
    file_paths: Dict[str, str] = Field(default_factory=dict)  # quality -> file_path
    stream_urls: Dict[str, str] = Field(default_factory=dict)  # quality -> stream_url
    ai_tags: List[str] = []
    content_warnings: List[str] = []
    is_restricted: bool = False
    sovereignty_source: Optional[str] = None  # source of content in sovereignty mode
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Analytics Models
class ViewingSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_id: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    duration_watched: int = 0  # in seconds
    quality: VideoQuality
    device_type: str
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    xr_session: bool = False
    bluetooth_devices: List[str] = []
    casting_device: Optional[str] = None
    voice_commands_used: List[str] = []
    completed: bool = False

class UserAnalytics(BaseModel):
    user_id: str
    total_watch_time: int = 0  # in minutes
    favorite_genres: List[str] = []
    most_watched_content_type: ContentType
    average_session_duration: float = 0.0
    preferred_quality: VideoQuality
    device_usage: Dict[str, int] = Field(default_factory=dict)
    xr_usage_hours: float = 0.0
    voice_command_frequency: float = 0.0
    content_discovery_method: Dict[str, int] = Field(default_factory=dict)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# Social Features Models
class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_id: str
    rating: float = Field(..., ge=0.0, le=10.0)
    title: Optional[str] = None
    review_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    helpful_votes: int = 0
    is_verified: bool = False

class WatchParty(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    host_user_id: str
    content_id: str
    party_name: str
    participants: List[str] = []
    max_participants: int = 10
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    is_active: bool = True
    chat_enabled: bool = True
    voice_chat_enabled: bool = False
    synchronized_playback: bool = True

# Interactive Content Models
class InteractiveChoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    timestamp: int  # in seconds
    choices: List[Dict[str, Any]] = []
    timeout: int = 30  # seconds to make choice

class InteractiveContent(BaseModel):
    content_id: str
    branches: Dict[str, str] = Field(default_factory=dict)  # choice_id -> next_content_id
    choices: List[InteractiveChoice] = []
    default_path: Optional[str] = None

# Live Streaming Models
class LiveStream(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    streamer_id: str
    category: str
    tags: List[str] = []
    thumbnail_url: Optional[str] = None
    stream_key: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rtmp_url: Optional[str] = None
    hls_url: Optional[str] = None
    viewer_count: int = 0
    max_viewers: int = 0
    start_time: datetime = Field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    is_live: bool = True
    quality_options: List[VideoQuality] = []
    chat_enabled: bool = True
    donations_enabled: bool = False

# Device Integration Models
class DeviceType(str, Enum):
    XR_HEADSET = "xr_headset"
    BLUETOOTH_REMOTE = "bluetooth_remote"
    SMART_TV = "smart_tv"
    MOBILE = "mobile"
    PC = "pc"
    GAMING_CONTROLLER = "gaming_controller"

class ConnectedDevice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    device_type: DeviceType
    device_name: str
    device_model: Optional[str] = None
    capabilities: List[str] = []
    battery_level: Optional[int] = None
    is_active: bool = True
    last_connected: datetime = Field(default_factory=datetime.utcnow)
    connection_type: str  # bluetooth, wifi, etc.

# AI and Moderation Models
class AIRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_id: str
    recommendation_type: str  # trending, personalized, similar, etc.
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    reasoning: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    clicked: bool = False
    watched: bool = False

class ModerationResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_id: str
    moderation_type: str  # ai_scan, user_report, manual_review
    status: str  # approved, flagged, rejected
    flags: List[str] = []  # violence, adult_content, etc.
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    reviewed_by: Optional[str] = None
    reviewed_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

# Sovereignty Models
class SovereigntySettings(BaseModel):
    user_id: str
    decentralized_storage: bool = True
    p2p_sharing: bool = True
    local_ai_processing: bool = True
    external_api_usage: bool = False
    content_source_preferences: List[str] = []  # ipfs, torrent, local, etc.
    privacy_level: str = "maximum"  # basic, enhanced, maximum
    data_retention_days: int = 0  # 0 means no retention limit
    encryption_enabled: bool = True
    anonymous_mode: bool = False

class ContentSource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    source_type: str  # api, scraper, p2p, local
    url: Optional[str] = None
    is_active: bool = True
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    content_count: int = 0
    quality: str = "unknown"  # verified, community, unknown
    sovereignty_compatible: bool = True

# Request/Response Models
class ContentIngestionRequest(BaseModel):
    source_url: Optional[str] = None
    local_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    auto_process: bool = True
    generate_thumbnails: bool = True
    extract_metadata: bool = True
    
class AIAnalysisRequest(BaseModel):
    content_id: str
    analysis_type: str  # metadata, recommendation, moderation
    user_context: Optional[Dict[str, Any]] = None
    
class DeviceConnectionRequest(BaseModel):
    device_type: DeviceType
    device_info: Dict[str, Any]
    capabilities: List[str] = []