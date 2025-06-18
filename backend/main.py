import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Depends, HTTPException, File, UploadFile, Query, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from typing import List, Dict, Optional, Any
import logging

# Import our services and models
from .models import *
from .services.ai_service import AIService
from .services.sovereignty_service import SovereigntyService
from .services.video_service import VideoProcessingService, LiveStreamingService, InteractiveContentService
from .services.analytics_service import AdvancedAnalyticsService
from .services.social_service import SocialService
from .services.content_service import ContentManagementService

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Global services
services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup services"""
    global services
    
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Initialize AI service (require API key from user)
    openai_api_key = os.environ.get('OPENAI_API_KEY')
    ai_service = AIService(openai_api_key, db) if openai_api_key else None
    
    # Initialize all services
    services['db'] = db
    services['client'] = client
    services['ai_service'] = ai_service
    services['sovereignty_service'] = SovereigntyService(db, ai_service)
    services['video_service'] = VideoProcessingService()
    services['live_service'] = LiveStreamingService()
    services['interactive_service'] = InteractiveContentService(db)
    services['analytics_service'] = AdvancedAnalyticsService(db)
    services['social_service'] = SocialService(db)
    services['content_service'] = ContentManagementService(
        db, ai_service, services['video_service'], services['sovereignty_service']
    )
    
    # Initialize sovereignty service
    await services['sovereignty_service'].initialize()
    
    # Start video processing worker
    await services['video_service'].start_processing_worker()
    
    logger.info("🚀 Quantum Media Hub - Ultimate Sovereign Streaming Platform Initialized!")
    
    yield
    
    # Cleanup
    client.close()
    logger.info("Services shut down")

# Create FastAPI app
app = FastAPI(
    title="Quantum Media Hub - Sovereign Streaming Platform",
    description="Ultimate next-generation streaming platform with AI, XR, and sovereignty features",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for streams and thumbnails
app.mount("/api/streams", StaticFiles(directory="/app/sovereign_storage/streams"), name="streams")
app.mount("/api/thumbnails", StaticFiles(directory="/app/sovereign_storage/thumbnails"), name="thumbnails")

# Dependency to get services
def get_service(service_name: str):
    def _get_service():
        if service_name not in services:
            raise HTTPException(status_code=500, detail=f"Service {service_name} not available")
        return services[service_name]
    return _get_service

# API Router
api_router = APIRouter(prefix="/api")

# =================== SOVEREIGNTY ENDPOINTS ===================

@api_router.post("/sovereignty/enable")
async def enable_sovereignty_mode(
    request: Dict[str, Any],
    sovereignty_service: SovereigntyService = Depends(get_service("sovereignty_service"))
):
    """Enable sovereignty mode for user with optional OpenAI API key"""
    try:
        user_id = request.get("user_id")
        settings_data = request.get("settings")
        openai_api_key = request.get("openai_api_key")
        
        if not user_id or not settings_data:
            raise HTTPException(status_code=400, detail="user_id and settings are required")
        
        settings = SovereigntySettings(**settings_data)
        
        # Store OpenAI API key if provided
        if openai_api_key:
            # Update environment variable for this session
            os.environ['OPENAI_API_KEY'] = openai_api_key
            
            # Reinitialize AI service with new key
            if 'ai_service' in services:
                from .services.ai_service import AIService
                services['ai_service'] = AIService(openai_api_key, services['db'])
        
        success = await sovereignty_service.enable_sovereignty_mode(user_id, settings)
        if success:
            return {
                "status": "success", 
                "message": "Sovereignty mode enabled",
                "ai_enabled": bool(openai_api_key),
                "features_unlocked": 4 if openai_api_key else 2
            }
        raise HTTPException(status_code=500, detail="Failed to enable sovereignty mode")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error enabling sovereignty mode: {str(e)}")

@api_router.post("/sovereignty/disable")
async def disable_sovereignty_mode(
    user_id: str,
    sovereignty_service: SovereigntyService = Depends(get_service("sovereignty_service"))
):
    """Disable sovereignty mode for user"""
    success = await sovereignty_service.disable_sovereignty_mode(user_id)
    if success:
        return {"status": "success", "message": "Sovereignty mode disabled"}
    raise HTTPException(status_code=500, detail="Failed to disable sovereignty mode")

@api_router.get("/sovereignty/settings/{user_id}")
async def get_sovereignty_settings(
    user_id: str,
    sovereignty_service: SovereigntyService = Depends(get_service("sovereignty_service"))
):
    """Get user's sovereignty settings"""
    settings = await sovereignty_service.get_user_sovereignty_settings(user_id)
    return settings

@api_router.post("/sovereignty/content/ingest")
async def ingest_sovereign_content(
    source_url: Optional[str] = None,
    local_path: Optional[str] = None,
    metadata: Optional[Dict] = None,
    sovereignty_service: SovereigntyService = Depends(get_service("sovereignty_service"))
):
    """Ingest content from various sovereign sources"""
    content = await sovereignty_service.ingest_content(source_url, local_path, metadata)
    if content:
        return content.dict()
    raise HTTPException(status_code=500, detail="Failed to ingest content")

@api_router.get("/sovereignty/content/discover")
async def discover_sovereign_content(
    user_id: str,
    source_types: Optional[List[str]] = Query(None),
    sovereignty_service: SovereigntyService = Depends(get_service("sovereignty_service"))
):
    """Discover content from sovereign sources"""
    content = await sovereignty_service.discover_content(user_id, source_types)
    return {"content": [c.dict() for c in content]}

# =================== AI ENDPOINTS ===================

@api_router.post("/ai/recommendations")
async def get_ai_recommendations(
    user_id: str,
    limit: int = 20,
    content_service: ContentManagementService = Depends(get_service("content_service"))
):
    """Get AI-powered personalized recommendations"""
    recommendations = await content_service.get_content_recommendations(
        user_id, "personalized", limit
    )
    return {"recommendations": recommendations}

@api_router.post("/ai/voice-command")
async def process_voice_command(
    user_id: str,
    command: str = Body(..., embed=True),
    context: Optional[Dict] = Body(None, embed=True),
    ai_service: AIService = Depends(get_service("ai_service")),
    analytics_service: AdvancedAnalyticsService = Depends(get_service("analytics_service"))
):
    """Process natural language voice command"""
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    result = await ai_service.process_voice_command(user_id, command, context)
    
    # Track voice command usage
    await analytics_service.track_voice_command(
        user_id, command, result.get("confidence", 0) > 0.7, context
    )
    
    return result

@api_router.post("/ai/moderation/toggle")
async def toggle_ai_moderation(
    enabled: bool = Body(..., embed=True),
    ai_service: AIService = Depends(get_service("ai_service"))
):
    """Toggle AI content moderation on/off"""
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    ai_service.set_moderation_enabled(enabled)
    return {"status": "success", "moderation_enabled": enabled}

@api_router.post("/ai/content/moderate")
async def moderate_content(
    content_data: Dict,
    ai_service: AIService = Depends(get_service("ai_service"))
):
    """Moderate content using AI"""
    if not ai_service:
        raise HTTPException(status_code=503, detail="AI service not available")
    
    result = await ai_service.moderate_content(content_data)
    return result

# =================== CONTENT ENDPOINTS ===================

@api_router.post("/content")
async def create_content(
    content_data: Dict,
    user_id: Optional[str] = None,
    content_service: ContentManagementService = Depends(get_service("content_service"))
):
    """Create new content"""
    content = await content_service.create_content(content_data, user_id)
    if content:
        return content.dict()
    raise HTTPException(status_code=500, detail="Failed to create content")

@api_router.get("/content/{content_id}")
async def get_content(
    content_id: str,
    user_id: Optional[str] = Query(None),
    content_service: ContentManagementService = Depends(get_service("content_service"))
):
    """Get content by ID"""
    content = await content_service.get_content(content_id, user_id)
    if content:
        return content
    raise HTTPException(status_code=404, detail="Content not found")

@api_router.get("/content/{content_id}/similar")
async def get_similar_content(
    content_id: str,
    user_id: Optional[str] = Query(None),
    limit: int = Query(10),
    content_service: ContentManagementService = Depends(get_service("content_service"))
):
    """Get similar content"""
    similar = await content_service.get_similar_content(content_id, user_id, limit)
    return {"similar_content": similar}

@api_router.get("/content/search")
async def search_content(
    query: str = Query(...),
    user_id: Optional[str] = Query(None),
    genre: Optional[List[str]] = Query(None),
    content_type: Optional[str] = Query(None),
    rating: Optional[List[str]] = Query(None),
    quality: Optional[List[str]] = Query(None),
    sovereignty_mode: Optional[bool] = Query(None),
    limit: int = Query(20),
    offset: int = Query(0),
    content_service: ContentManagementService = Depends(get_service("content_service"))
):
    """Advanced content search"""
    filters = {}
    if genre:
        filters["genre"] = genre
    if content_type:
        filters["content_type"] = content_type
    if rating:
        filters["rating"] = rating
    if quality:
        filters["quality"] = quality
    if sovereignty_mode is not None:
        filters["sovereignty_mode"] = sovereignty_mode
    
    results = await content_service.search_content(query, user_id, filters, limit, offset)
    return results

@api_router.get("/content/recommendations/{user_id}")
async def get_content_recommendations(
    user_id: str,
    recommendation_type: str = Query("personalized"),
    limit: int = Query(20),
    content_service: ContentManagementService = Depends(get_service("content_service"))
):
    """Get content recommendations"""
    recommendations = await content_service.get_content_recommendations(
        user_id, recommendation_type, limit
    )
    return {"recommendations": recommendations}

@api_router.put("/content/{content_id}")
async def update_content(
    content_id: str,
    updates: Dict,
    user_id: Optional[str] = None,
    content_service: ContentManagementService = Depends(get_service("content_service"))
):
    """Update content metadata"""
    success = await content_service.update_content(content_id, updates, user_id)
    if success:
        return {"status": "success", "message": "Content updated"}
    raise HTTPException(status_code=500, detail="Failed to update content")

@api_router.delete("/content/{content_id}")
async def delete_content(
    content_id: str,
    user_id: Optional[str] = None,
    content_service: ContentManagementService = Depends(get_service("content_service"))
):
    """Delete content"""
    success = await content_service.delete_content(content_id, user_id)
    if success:
        return {"status": "success", "message": "Content deleted"}
    raise HTTPException(status_code=500, detail="Failed to delete content")

# =================== VIDEO PROCESSING ENDPOINTS ===================

@api_router.post("/video/process")
async def process_video(
    content_id: str,
    source_path: str,
    target_qualities: Optional[List[str]] = None,
    video_service: VideoProcessingService = Depends(get_service("video_service"))
):
    """Process video for multiple quality streams"""
    qualities = [VideoQuality(q) for q in target_qualities] if target_qualities else None
    result = await video_service.process_video(content_id, source_path, qualities)
    return result

@api_router.get("/video/{content_id}/stream")
async def get_video_stream(
    content_id: str,
    quality: Optional[str] = Query(None),
    video_service: VideoProcessingService = Depends(get_service("video_service"))
):
    """Get video stream URL"""
    quality_enum = VideoQuality(quality) if quality else None
    stream_url = await video_service.get_video_stream_url(content_id, quality_enum)
    if stream_url:
        return {"stream_url": stream_url}
    raise HTTPException(status_code=404, detail="Stream not found")

@api_router.get("/video/{content_id}/status")
async def get_video_processing_status(
    content_id: str,
    video_service: VideoProcessingService = Depends(get_service("video_service"))
):
    """Get video processing status"""
    status = await video_service.get_processing_status(content_id)
    return status

# =================== LIVE STREAMING ENDPOINTS ===================

@api_router.post("/live/create")
async def create_live_stream(
    stream_config: Dict,
    live_service: LiveStreamingService = Depends(get_service("live_service"))
):
    """Create a live stream"""
    stream_info = await live_service.create_live_stream(stream_config)
    return stream_info

@api_router.post("/live/{stream_id}/start")
async def start_live_stream(
    stream_id: str,
    live_service: LiveStreamingService = Depends(get_service("live_service"))
):
    """Start a live stream"""
    success = await live_service.start_live_stream(stream_id)
    if success:
        return {"status": "success", "message": "Stream started"}
    raise HTTPException(status_code=500, detail="Failed to start stream")

@api_router.post("/live/{stream_id}/stop")
async def stop_live_stream(
    stream_id: str,
    live_service: LiveStreamingService = Depends(get_service("live_service"))
):
    """Stop a live stream"""
    success = await live_service.stop_live_stream(stream_id)
    if success:
        return {"status": "success", "message": "Stream stopped"}
    raise HTTPException(status_code=500, detail="Failed to stop stream")

@api_router.get("/live/active")
async def get_active_streams(
    live_service: LiveStreamingService = Depends(get_service("live_service"))
):
    """Get active live streams"""
    streams = live_service.get_active_streams()
    return {"streams": streams}

# =================== INTERACTIVE CONTENT ENDPOINTS ===================

@api_router.post("/interactive/session")
async def create_interactive_session(
    user_id: str,
    content_id: str,
    interactive_service: InteractiveContentService = Depends(get_service("interactive_service"))
):
    """Create interactive content session"""
    session_id = await interactive_service.create_interactive_session(user_id, content_id)
    return {"session_id": session_id}

@api_router.post("/interactive/{session_id}/choice")
async def make_interactive_choice(
    session_id: str,
    choice_id: str = Body(..., embed=True),
    interactive_service: InteractiveContentService = Depends(get_service("interactive_service"))
):
    """Make a choice in interactive content"""
    result = await interactive_service.make_choice(session_id, choice_id)
    return result

@api_router.get("/interactive/{session_id}/status")
async def get_interactive_session_status(
    session_id: str,
    interactive_service: InteractiveContentService = Depends(get_service("interactive_service"))
):
    """Get interactive session status"""
    status = await interactive_service.get_session_status(session_id)
    if status:
        return status
    raise HTTPException(status_code=404, detail="Session not found")

# =================== SOCIAL FEATURES ENDPOINTS ===================

@api_router.post("/social/review")
async def create_review(
    user_id: str,
    content_id: str,
    rating: float,
    title: Optional[str] = None,
    review_text: Optional[str] = None,
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Create content review"""
    review = await social_service.create_review(user_id, content_id, rating, title, review_text)
    if review:
        return review.dict()
    raise HTTPException(status_code=500, detail="Failed to create review")

@api_router.get("/social/reviews/{content_id}")
async def get_content_reviews(
    content_id: str,
    limit: int = Query(20),
    sort_by: str = Query("helpful"),
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Get reviews for content"""
    reviews = await social_service.get_content_reviews(content_id, limit, sort_by)
    return {"reviews": reviews}

@api_router.post("/social/review/{review_id}/helpful")
async def vote_review_helpful(
    review_id: str,
    user_id: str = Body(..., embed=True),
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Vote review as helpful"""
    success = await social_service.vote_review_helpful(review_id, user_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=400, detail="Unable to vote")

@api_router.post("/social/watch-party")
async def create_watch_party(
    party_data: WatchParty,
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Create watch party"""
    party = await social_service.create_watch_party(
        party_data.host_user_id,
        party_data.content_id,
        party_data.party_name,
        party_data.max_participants,
        party_data.chat_enabled,
        party_data.voice_chat_enabled
    )
    if party:
        return party.dict()
    raise HTTPException(status_code=500, detail="Failed to create watch party")

@api_router.post("/social/watch-party/{party_id}/join")
async def join_watch_party(
    party_id: str,
    user_id: str = Body(..., embed=True),
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Join watch party"""
    success = await social_service.join_watch_party(party_id, user_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=400, detail="Unable to join party")

@api_router.post("/social/watch-party/{party_id}/leave")
async def leave_watch_party(
    party_id: str,
    user_id: str = Body(..., embed=True),
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Leave watch party"""
    success = await social_service.leave_watch_party(party_id, user_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=400, detail="Unable to leave party")

@api_router.post("/social/watch-party/{party_id}/sync")
async def sync_watch_party_playback(
    party_id: str,
    user_id: str,
    position: float,
    is_playing: bool,
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Sync watch party playback"""
    success = await social_service.sync_playback(party_id, user_id, position, is_playing)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=400, detail="Unable to sync playback")

@api_router.post("/social/watch-party/{party_id}/chat")
async def send_watch_party_message(
    party_id: str,
    user_id: str,
    message: str = Body(..., embed=True),
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Send chat message to watch party"""
    success = await social_service.send_chat_message(party_id, user_id, message)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=400, detail="Unable to send message")

@api_router.get("/social/watch-party/{party_id}/status")
async def get_watch_party_status(
    party_id: str,
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Get watch party status"""
    status = await social_service.get_watch_party_status(party_id)
    if status:
        return status
    raise HTTPException(status_code=404, detail="Watch party not found")

@api_router.get("/social/watch-parties/active")
async def get_active_watch_parties(
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Get active watch parties"""
    parties = social_service.get_active_watch_parties()
    return {"watch_parties": parties}

@api_router.post("/social/share")
async def share_content(
    user_id: str,
    content_id: str,
    platform: str,
    message: Optional[str] = None,
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Share content to social platforms"""
    result = await social_service.share_content(user_id, content_id, platform, message)
    return result

@api_router.get("/social/stats/{user_id}")
async def get_user_social_stats(
    user_id: str,
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Get user social statistics"""
    stats = await social_service.get_user_social_stats(user_id)
    return stats

# =================== ANALYTICS ENDPOINTS ===================

@api_router.post("/analytics/session")
async def track_viewing_session(
    session: ViewingSession,
    analytics_service: AdvancedAnalyticsService = Depends(get_service("analytics_service"))
):
    """Track viewing session"""
    success = await analytics_service.track_viewing_session(session)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=500, detail="Failed to track session")

@api_router.get("/analytics/user/{user_id}")
async def get_user_analytics(
    user_id: str,
    analytics_service: AdvancedAnalyticsService = Depends(get_service("analytics_service"))
):
    """Get user analytics"""
    analytics = await analytics_service.get_user_analytics(user_id)
    if analytics:
        return analytics.dict()
    raise HTTPException(status_code=404, detail="Analytics not found")

@api_router.get("/analytics/platform")
async def get_platform_analytics(
    time_range: str = Query("7d"),
    analytics_service: AdvancedAnalyticsService = Depends(get_service("analytics_service"))
):
    """Get platform analytics"""
    analytics = await analytics_service.get_platform_analytics(time_range)
    return analytics

@api_router.get("/analytics/voice")
async def get_voice_analytics(
    time_range: str = Query("7d"),
    analytics_service: AdvancedAnalyticsService = Depends(get_service("analytics_service"))
):
    """Get voice command analytics"""
    analytics = await analytics_service.get_voice_analytics(time_range)
    return analytics

@api_router.get("/analytics/real-time")
async def get_real_time_metrics(
    analytics_service: AdvancedAnalyticsService = Depends(get_service("analytics_service"))
):
    """Get real-time platform metrics"""
    metrics = analytics_service.get_real_time_metrics()
    return metrics

# =================== USER MANAGEMENT ENDPOINTS ===================

@api_router.post("/users")
async def create_user(
    user_data: UserProfile,
    db = Depends(get_service("db"))
):
    """Create new user"""
    await db.users.insert_one(user_data.dict())
    return user_data

@api_router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    db = Depends(get_service("db"))
):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if user:
        return UserProfile(**user)
    raise HTTPException(status_code=404, detail="User not found")

@api_router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    updates: Dict,
    db = Depends(get_service("db"))
):
    """Update user"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {**updates, "updated_at": datetime.utcnow()}}
    )
    if result.modified_count > 0:
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="User not found")

# =================== FILE UPLOAD ENDPOINTS ===================

@api_router.post("/upload/content")
async def upload_content_file(
    file: UploadFile = File(...),
    content_id: Optional[str] = None,
    generate_metadata: bool = True
):
    """Upload content file"""
    try:
        # Generate content ID if not provided
        if not content_id:
            content_id = f"upload_{datetime.utcnow().timestamp()}"
        
        # Save file
        upload_dir = "/app/sovereign_storage/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = f"{upload_dir}/{content_id}_{file.filename}"
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create content metadata
        content_data = {
            "id": content_id,
            "title": file.filename.split('.')[0],
            "content_type": "movie",  # Default
            "file_paths": {"original": file_path},
            "sovereignty_source": file_path
        }
        
        # Process with content service if available
        if generate_metadata and "content_service" in services:
            content = await services["content_service"].create_content(content_data)
            return content.dict() if content else {"error": "Failed to process content"}
        
        return {"content_id": content_id, "file_path": file_path, "status": "uploaded"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# =================== ADMIN/DASHBOARD ENDPOINTS ===================

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(
    time_range: str = Query("7d"),
    analytics_service: AdvancedAnalyticsService = Depends(get_service("analytics_service")),
    content_service: ContentManagementService = Depends(get_service("content_service")),
    social_service: SocialService = Depends(get_service("social_service"))
):
    """Get comprehensive admin dashboard data"""
    try:
        # Get platform analytics
        platform_analytics = await analytics_service.get_platform_analytics(time_range)
        
        # Get real-time metrics
        real_time_metrics = analytics_service.get_real_time_metrics()
        
        # Get popular content
        popular_content = await content_service.get_popular_content(limit=10)
        
        # Get active watch parties
        active_parties = social_service.get_active_watch_parties()
        
        # Get voice analytics
        voice_analytics = await analytics_service.get_voice_analytics(time_range)
        
        return {
            "platform_analytics": platform_analytics,
            "real_time_metrics": real_time_metrics,
            "popular_content": popular_content,
            "active_watch_parties": active_parties,
            "voice_analytics": voice_analytics,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

# Include API router
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "🚀 Quantum Media Hub - Ultimate Sovereign Streaming Platform",
        "version": "2.0.0",
        "features": [
            "🥽 XR/VR Support (Meta Quest, Apple Vision Pro, Pico XR)",
            "🤖 AI-Powered Recommendations & Content Moderation",
            "🔐 Full Sovereignty Mode with Decentralized Content",
            "📺 4K-16K Video Processing & Streaming",
            "🎮 Interactive Choose-Your-Own-Adventure Content",
            "📱 Advanced Device Integration (Bluetooth, Casting, PWA)",
            "👥 Social Features (Watch Parties, Reviews, Sharing)",
            "📊 Comprehensive Analytics & Real-time Monitoring",
            "🎬 Live Streaming Capabilities",
            "🎙️ Voice Command Processing"
        ],
        "status": "operational",
        "ai_enabled": "ai_service" in services and services["ai_service"] is not None
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "connected" if "db" in services else "disconnected",
            "ai_service": "available" if services.get("ai_service") else "unavailable",
            "video_processing": "active" if services.get("video_service") else "inactive",
            "analytics": "running" if services.get("analytics_service") else "stopped"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)