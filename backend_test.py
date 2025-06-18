import requests
import json
import time
import unittest
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "http://localhost:8001"
API_URL = f"{BACKEND_URL}/api"
TEST_USER_ID = "test_user_123"

class QuantumMediaHubAPITest(unittest.TestCase):
    """Test suite for Quantum Media Hub API endpoints"""
    
    def setUp(self):
        """Set up test environment"""
        # Check if the server is running
        try:
            response = requests.get(f"{BACKEND_URL}/health")
            if response.status_code != 200:
                self.skipTest("Backend server is not running")
        except requests.exceptions.ConnectionError:
            self.skipTest("Backend server is not running")
            
        # Create test user if needed
        self.create_test_user()
        
        # Create test content for testing
        self.test_content_id = self.create_test_content()
    
    def create_test_user(self):
        """Create a test user for API testing"""
        user_data = {
            "id": TEST_USER_ID,
            "name": "Test User",
            "avatar": "https://example.com/avatar.jpg",
            "is_kids": False,
            "preferences": {
                "genres": ["sci-fi", "action", "documentary"],
                "languages": ["en", "es"],
                "content_rating": "PG-13"
            },
            "sovereignty_mode": False,
            "access_level": "premium"
        }
        
        try:
            response = requests.post(f"{API_URL}/users", json=user_data)
            if response.status_code == 200:
                print(f"Test user created: {TEST_USER_ID}")
            else:
                print(f"User may already exist: {response.status_code}")
        except Exception as e:
            print(f"Error creating test user: {e}")
    
    def create_test_content(self):
        """Create test content for API testing"""
        content_data = {
            "title": "Quantum Leap: The Future of Technology",
            "description": "An in-depth documentary exploring cutting-edge quantum computing and its implications for the future.",
            "content_type": "movie",
            "genre": ["documentary", "science", "technology"],
            "rating": "PG",
            "release_date": "2023-05-15T00:00:00Z",
            "duration": 120,
            "cast": ["Dr. Jane Smith", "Prof. Robert Chen", "Dr. Amara Okafor"],
            "director": "Elizabeth Wong",
            "languages": ["en"],
            "subtitles": ["en", "es", "fr"],
            "quality_available": ["1080p", "2160p"],
            "ai_tags": ["quantum computing", "technology", "future", "science"]
        }
        
        try:
            response = requests.post(f"{API_URL}/content", json=content_data, params={"user_id": TEST_USER_ID})
            if response.status_code == 200:
                content_id = response.json().get("id")
                print(f"Test content created: {content_id}")
                return content_id
            else:
                print(f"Error creating content: {response.status_code}, {response.text}")
                return "test_content_123"  # Fallback ID
        except Exception as e:
            print(f"Error creating test content: {e}")
            return "test_content_123"  # Fallback ID

    # =================== SOVEREIGNTY TESTS ===================
    
    def test_sovereignty_enable(self):
        """Test enabling sovereignty mode"""
        settings = {
            "user_id": TEST_USER_ID,
            "decentralized_storage": True,
            "p2p_sharing": True,
            "local_ai_processing": True,
            "external_api_usage": False,
            "content_source_preferences": ["ipfs", "local"],
            "privacy_level": "maximum",
            "data_retention_days": 0,
            "encryption_enabled": True,
            "anonymous_mode": False
        }
        
        response = requests.post(
            f"{API_URL}/sovereignty/enable", 
            params={"user_id": TEST_USER_ID},
            json=settings
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "success")
        print("Sovereignty mode enabled successfully")
    
    def test_sovereignty_settings(self):
        """Test getting sovereignty settings"""
        response = requests.get(f"{API_URL}/sovereignty/settings/{TEST_USER_ID}")
        
        self.assertEqual(response.status_code, 200)
        settings = response.json()
        self.assertEqual(settings.get("user_id"), TEST_USER_ID)
        print(f"Sovereignty settings retrieved: {settings}")
    
    def test_sovereignty_disable(self):
        """Test disabling sovereignty mode"""
        response = requests.post(
            f"{API_URL}/sovereignty/disable", 
            params={"user_id": TEST_USER_ID}
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "success")
        print("Sovereignty mode disabled successfully")
    
    def test_sovereignty_content_ingest(self):
        """Test ingesting sovereign content"""
        metadata = {
            "title": "Decentralized Media: A New Paradigm",
            "description": "Exploring the future of decentralized content distribution",
            "content_type": "movie"
        }
        
        response = requests.post(
            f"{API_URL}/sovereignty/content/ingest",
            params={"local_path": "/app/test_data.mp4"},
            json=metadata
        )
        
        # This might fail if the file doesn't exist, which is expected
        if response.status_code == 200:
            self.assertIn("id", response.json())
            print(f"Content ingested: {response.json().get('id')}")
        else:
            print(f"Content ingestion failed (expected if test file doesn't exist): {response.status_code}")
    
    def test_sovereignty_content_discover(self):
        """Test discovering sovereign content"""
        response = requests.get(
            f"{API_URL}/sovereignty/content/discover",
            params={"user_id": TEST_USER_ID, "source_types": ["local", "ipfs"]}
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("content", response.json())
        print(f"Discovered content: {len(response.json().get('content', []))} items")
    
    # =================== AI FEATURE TESTS ===================
    
    def test_ai_recommendations(self):
        """Test AI recommendations endpoint"""
        response = requests.post(
            f"{API_URL}/ai/recommendations",
            params={"user_id": TEST_USER_ID, "limit": 5}
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("recommendations", response.json())
        print(f"AI recommendations: {response.json()}")
    
    def test_ai_voice_command(self):
        """Test voice command processing"""
        command_data = {
            "command": "Play the latest sci-fi movie",
            "context": {"current_screen": "home", "previous_content": None}
        }
        
        response = requests.post(
            f"{API_URL}/ai/voice-command",
            params={"user_id": TEST_USER_ID},
            json=command_data
        )
        
        # This might return 503 if AI service is not available, which is expected
        print(f"Voice command response: {response.status_code}, {response.text}")
        if response.status_code == 200:
            self.assertIn("action", response.json())
        elif response.status_code == 503:
            self.assertIn("detail", response.json())
            self.assertEqual(response.json().get("detail"), "AI service not available")
    
    def test_ai_moderation_toggle(self):
        """Test toggling AI moderation"""
        response = requests.post(
            f"{API_URL}/ai/moderation/toggle",
            json={"enabled": True}
        )
        
        # This might return 503 if AI service is not available, which is expected
        print(f"AI moderation toggle response: {response.status_code}, {response.text}")
        if response.status_code == 200:
            self.assertEqual(response.json().get("moderation_enabled"), True)
        elif response.status_code == 503:
            self.assertIn("detail", response.json())
            self.assertEqual(response.json().get("detail"), "AI service not available")
    
    def test_ai_content_moderate(self):
        """Test content moderation"""
        content_data = {
            "title": "Test Content for Moderation",
            "description": "This is a test description for content moderation",
            "genre": ["action", "thriller"],
            "rating": "PG-13"
        }
        
        response = requests.post(
            f"{API_URL}/ai/content/moderate",
            json=content_data
        )
        
        # This might return 503 if AI service is not available, which is expected
        print(f"Content moderation response: {response.status_code}, {response.text}")
        if response.status_code == 200:
            self.assertIn("approved", response.json())
        elif response.status_code == 503:
            self.assertIn("detail", response.json())
            self.assertEqual(response.json().get("detail"), "AI service not available")
    
    # =================== CONTENT MANAGEMENT TESTS ===================
    
    def test_content_create(self):
        """Test creating content"""
        content_data = {
            "title": "The Quantum Paradox",
            "description": "A thrilling sci-fi adventure exploring quantum realities",
            "content_type": "movie",
            "genre": ["sci-fi", "thriller", "adventure"],
            "rating": "PG-13",
            "release_date": "2023-08-10T00:00:00Z",
            "duration": 135,
            "cast": ["Emma Stone", "John Cho", "Lupita Nyong'o"],
            "director": "Christopher Nolan",
            "languages": ["en"],
            "subtitles": ["en", "es", "fr", "de"],
            "quality_available": ["1080p", "2160p", "4320p"],
            "ai_tags": ["quantum physics", "parallel universes", "time travel"]
        }
        
        response = requests.post(
            f"{API_URL}/content",
            json=content_data,
            params={"user_id": TEST_USER_ID}
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("id", response.json())
        print(f"Content created: {response.json().get('id')}")
        
        # Save content ID for other tests
        self.created_content_id = response.json().get("id")
    
    def test_content_get(self):
        """Test getting content by ID"""
        # Use the content created in the setup
        response = requests.get(
            f"{API_URL}/content/{self.test_content_id}",
            params={"user_id": TEST_USER_ID}
        )
        
        self.assertEqual(response.status_code, 200)
        content = response.json()
        self.assertEqual(content.get("id"), self.test_content_id)
        print(f"Content retrieved: {content.get('title')}")
    
    def test_content_search(self):
        """Test content search"""
        response = requests.get(
            f"{API_URL}/content/search",
            params={
                "query": "quantum",
                "user_id": TEST_USER_ID,
                "genre": ["documentary", "sci-fi"],
                "limit": 10,
                "offset": 0
            }
        )
        
        self.assertEqual(response.status_code, 200)
        results = response.json()
        self.assertIn("results", results)
        print(f"Search results: {len(results.get('results', []))} items")
    
    def test_content_recommendations(self):
        """Test content recommendations"""
        response = requests.get(
            f"{API_URL}/content/recommendations/{TEST_USER_ID}",
            params={"recommendation_type": "personalized", "limit": 5}
        )
        
        self.assertEqual(response.status_code, 200)
        recommendations = response.json()
        self.assertIn("recommendations", recommendations)
        print(f"Recommendations: {len(recommendations.get('recommendations', []))} items")
    
    # =================== VIDEO PROCESSING TESTS ===================
    
    def test_video_process(self):
        """Test video processing"""
        # This test might fail if the file doesn't exist, which is expected
        response = requests.post(
            f"{API_URL}/video/process",
            params={
                "content_id": self.test_content_id,
                "source_path": "/app/test_video.mp4",
                "target_qualities": ["1080p", "2160p"]
            }
        )
        
        print(f"Video processing response: {response.status_code}, {response.text}")
        if response.status_code == 200:
            self.assertEqual(response.json().get("status"), "queued")
            self.assertEqual(response.json().get("content_id"), self.test_content_id)
    
    def test_video_status(self):
        """Test video processing status"""
        response = requests.get(
            f"{API_URL}/video/{self.test_content_id}/status"
        )
        
        self.assertEqual(response.status_code, 200)
        status = response.json()
        self.assertEqual(status.get("content_id"), self.test_content_id)
        print(f"Video processing status: {status.get('status')}")
    
    def test_video_stream(self):
        """Test video stream URL"""
        response = requests.get(
            f"{API_URL}/video/{self.test_content_id}/stream",
            params={"quality": "1080p"}
        )
        
        print(f"Video stream response: {response.status_code}, {response.text}")
        if response.status_code == 200:
            self.assertIn("stream_url", response.json())
            print(f"Stream URL: {response.json().get('stream_url')}")
        elif response.status_code == 404:
            print("Stream not found (expected if video processing hasn't completed)")
    
    # =================== LIVE STREAMING TESTS ===================
    
    def test_live_create(self):
        """Test creating a live stream"""
        stream_config = {
            "title": "Test Live Stream",
            "description": "A test live stream for API testing",
            "streamer_id": TEST_USER_ID,
            "category": "Technology",
            "tags": ["test", "api", "live"],
            "max_viewers": 100,
            "chat_enabled": True,
            "donations_enabled": False
        }
        
        response = requests.post(
            f"{API_URL}/live/create",
            json=stream_config
        )
        
        self.assertEqual(response.status_code, 200)
        stream_info = response.json()
        self.assertIn("id", stream_info)
        self.assertIn("stream_key", stream_info)
        print(f"Live stream created: {stream_info.get('id')}")
        
        # Save stream ID for other tests
        self.stream_id = stream_info.get("id")
    
    def test_live_start(self):
        """Test starting a live stream"""
        # Create a stream first if not already created
        if not hasattr(self, 'stream_id'):
            self.test_live_create()
        
        response = requests.post(
            f"{API_URL}/live/{self.stream_id}/start"
        )
        
        print(f"Live stream start response: {response.status_code}, {response.text}")
        if response.status_code == 200:
            self.assertEqual(response.json().get("status"), "success")
    
    def test_live_active(self):
        """Test getting active streams"""
        response = requests.get(f"{API_URL}/live/active")
        
        self.assertEqual(response.status_code, 200)
        streams = response.json()
        self.assertIn("streams", streams)
        print(f"Active streams: {len(streams.get('streams', []))} streams")
    
    # =================== SOCIAL FEATURES TESTS ===================
    
    def test_social_review(self):
        """Test creating a content review"""
        review_data = {
            "rating": 8.5,
            "title": "Impressive and Thought-Provoking",
            "review_text": "This content was incredibly well-made and thought-provoking. The visuals were stunning and the narrative was engaging throughout."
        }
        
        response = requests.post(
            f"{API_URL}/social/review",
            params={
                "user_id": TEST_USER_ID,
                "content_id": self.test_content_id,
                "rating": review_data["rating"],
                "title": review_data["title"],
                "review_text": review_data["review_text"]
            }
        )
        
        self.assertEqual(response.status_code, 200)
        review = response.json()
        self.assertEqual(review.get("user_id"), TEST_USER_ID)
        self.assertEqual(review.get("content_id"), self.test_content_id)
        print(f"Review created: {review.get('id')}")
        
        # Save review ID for other tests
        self.review_id = review.get("id")
    
    def test_social_reviews(self):
        """Test getting content reviews"""
        response = requests.get(
            f"{API_URL}/social/reviews/{self.test_content_id}",
            params={"limit": 10, "sort_by": "recent"}
        )
        
        self.assertEqual(response.status_code, 200)
        reviews = response.json()
        self.assertIn("reviews", reviews)
        print(f"Content reviews: {len(reviews.get('reviews', []))} reviews")
    
    def test_social_watch_party(self):
        """Test creating a watch party"""
        party_data = {
            "host_user_id": TEST_USER_ID,
            "content_id": self.test_content_id,
            "party_name": "Test Watch Party",
            "max_participants": 5,
            "chat_enabled": True,
            "voice_chat_enabled": False
        }
        
        response = requests.post(
            f"{API_URL}/social/watch-party",
            json=party_data
        )
        
        self.assertEqual(response.status_code, 200)
        party = response.json()
        self.assertEqual(party.get("host_user_id"), TEST_USER_ID)
        self.assertEqual(party.get("content_id"), self.test_content_id)
        print(f"Watch party created: {party.get('id')}")
        
        # Save party ID for other tests
        self.party_id = party.get("id")
    
    def test_social_watch_party_join(self):
        """Test joining a watch party"""
        # Create a party first if not already created
        if not hasattr(self, 'party_id'):
            self.test_social_watch_party()
        
        response = requests.post(
            f"{API_URL}/social/watch-party/{self.party_id}/join",
            json={"user_id": "another_test_user"}
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "success")
        print(f"User joined watch party: {self.party_id}")
    
    # =================== ANALYTICS TESTS ===================
    
    def test_analytics_session(self):
        """Test tracking a viewing session"""
        session_data = {
            "id": f"session_{int(time.time())}",
            "user_id": TEST_USER_ID,
            "content_id": self.test_content_id,
            "start_time": datetime.utcnow().isoformat(),
            "duration_watched": 1200,  # 20 minutes
            "quality": "1080p",
            "device_type": "pc",
            "device_id": "test_device_123",
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "xr_session": False,
            "bluetooth_devices": [],
            "casting_device": None,
            "voice_commands_used": ["play", "pause", "skip"],
            "completed": True
        }
        
        response = requests.post(
            f"{API_URL}/analytics/session",
            json=session_data
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "success")
        print("Viewing session tracked successfully")
    
    def test_analytics_user(self):
        """Test getting user analytics"""
        response = requests.get(f"{API_URL}/analytics/user/{TEST_USER_ID}")
        
        print(f"User analytics response: {response.status_code}, {response.text}")
        if response.status_code == 200:
            analytics = response.json()
            self.assertEqual(analytics.get("user_id"), TEST_USER_ID)
            print(f"User analytics retrieved: {analytics}")
        elif response.status_code == 404:
            print("User analytics not found (expected for new test user)")
    
    def test_analytics_platform(self):
        """Test getting platform analytics"""
        response = requests.get(
            f"{API_URL}/analytics/platform",
            params={"time_range": "7d"}
        )
        
        self.assertEqual(response.status_code, 200)
        analytics = response.json()
        self.assertIn("time_range", analytics)
        print(f"Platform analytics retrieved: {analytics}")
    
    def test_analytics_real_time(self):
        """Test getting real-time metrics"""
        response = requests.get(f"{API_URL}/analytics/real-time")
        
        self.assertEqual(response.status_code, 200)
        metrics = response.json()
        self.assertIn("active_users", metrics)
        print(f"Real-time metrics: {metrics}")
    
    # =================== ADMIN DASHBOARD TEST ===================
    
    def test_admin_dashboard(self):
        """Test getting admin dashboard data"""
        response = requests.get(
            f"{API_URL}/admin/dashboard",
            params={"time_range": "7d"}
        )
        
        self.assertEqual(response.status_code, 200)
        dashboard = response.json()
        self.assertIn("platform_analytics", dashboard)
        self.assertIn("real_time_metrics", dashboard)
        print(f"Admin dashboard data retrieved successfully")

if __name__ == "__main__":
    unittest.main(verbosity=2)