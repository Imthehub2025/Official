import os
import asyncio
import hashlib
import ipaddress
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import aiofiles
import aiohttp
from motor.motor_asyncio import AsyncIOMotorCollection
from ..models import SovereigntySettings, ContentMetadata, ContentSource, UserProfile

class SovereigntyService:
    """
    Core service for managing sovereign media hub functionality
    Handles decentralized content discovery, ingestion, and management
    """
    
    def __init__(self, db, ai_service=None):
        self.db = db
        self.ai_service = ai_service
        self.content_sources: List[ContentSource] = []
        self.p2p_network = None
        self.local_storage_path = "/app/sovereign_storage"
        self.content_cache: Dict[str, Any] = {}
        
    async def initialize(self):
        """Initialize sovereignty service and load configuration"""
        await self._ensure_storage_directories()
        await self._load_content_sources()
        await self._initialize_p2p_network()
        
    async def _ensure_storage_directories(self):
        """Create necessary storage directories"""
        directories = [
            self.local_storage_path,
            f"{self.local_storage_path}/content",
            f"{self.local_storage_path}/metadata",
            f"{self.local_storage_path}/thumbnails",
            f"{self.local_storage_path}/cache"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    async def _load_content_sources(self):
        """Load configured content sources"""
        sources_cursor = self.db.content_sources.find({"is_active": True})
        self.content_sources = [ContentSource(**source) async for source in sources_cursor]
        
    async def _initialize_p2p_network(self):
        """Initialize peer-to-peer networking (placeholder for future implementation)"""
        # This would initialize IPFS, BitTorrent, or custom P2P protocol
        pass
    
    async def enable_sovereignty_mode(self, user_id: str, settings: SovereigntySettings) -> bool:
        """Enable sovereignty mode for a user"""
        try:
            # Update user profile
            await self.db.users.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "sovereignty_mode": True,
                        "sovereignty_settings": settings.dict(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Initialize user's sovereign storage
            user_storage_path = f"{self.local_storage_path}/users/{user_id}"
            os.makedirs(user_storage_path, exist_ok=True)
            
            # Start content discovery if enabled
            if settings.external_api_usage:
                await self._start_content_discovery(user_id, settings)
                
            return True
        except Exception as e:
            print(f"Error enabling sovereignty mode: {e}")
            return False
    
    async def disable_sovereignty_mode(self, user_id: str) -> bool:
        """Disable sovereignty mode for a user"""
        try:
            await self.db.users.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "sovereignty_mode": False,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return True
        except Exception as e:
            print(f"Error disabling sovereignty mode: {e}")
            return False
    
    async def ingest_content(self, source_url: Optional[str] = None, 
                           local_path: Optional[str] = None,
                           metadata: Optional[Dict] = None) -> Optional[ContentMetadata]:
        """Ingest content from various sources"""
        try:
            content_id = hashlib.sha256(
                (source_url or local_path or str(datetime.utcnow())).encode()
            ).hexdigest()[:16]
            
            # Create content metadata
            content_metadata = ContentMetadata(
                id=content_id,
                title=metadata.get("title", "Unknown Title") if metadata else "Unknown Title",
                description=metadata.get("description") if metadata else None,
                content_type=metadata.get("content_type", "movie") if metadata else "movie",
                sovereignty_source=source_url or local_path
            )
            
            # Process based on source type
            if source_url:
                content_metadata = await self._ingest_from_url(source_url, content_metadata)
            elif local_path:
                content_metadata = await self._ingest_from_local(local_path, content_metadata)
            
            # Use AI to enhance metadata if available
            if self.ai_service and metadata.get("auto_process", True):
                content_metadata = await self._enhance_with_ai(content_metadata)
            
            # Save to database
            await self.db.content.insert_one(content_metadata.dict())
            
            return content_metadata
            
        except Exception as e:
            print(f"Error ingesting content: {e}")
            return None
    
    async def _ingest_from_url(self, url: str, metadata: ContentMetadata) -> ContentMetadata:
        """Ingest content from URL (web scraping, API, etc.)"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        # Download content or extract streaming URLs
                        content_type = response.headers.get('content-type', '')
                        
                        if 'video' in content_type:
                            # Download video file
                            local_path = f"{self.local_storage_path}/content/{metadata.id}.mp4"
                            async with aiofiles.open(local_path, 'wb') as f:
                                async for chunk in response.content.iter_chunked(8192):
                                    await f.write(chunk)
                            
                            metadata.file_paths["original"] = local_path
                        else:
                            # Extract streaming URLs or metadata
                            content = await response.text()
                            # Process HTML/JSON to extract video URLs
                            metadata.stream_urls = await self._extract_stream_urls(content, url)
            
            return metadata
        except Exception as e:
            print(f"Error ingesting from URL: {e}")
            return metadata
    
    async def _ingest_from_local(self, local_path: str, metadata: ContentMetadata) -> ContentMetadata:
        """Ingest content from local file system"""
        try:
            if os.path.exists(local_path):
                # Copy to sovereign storage
                filename = os.path.basename(local_path)
                sovereign_path = f"{self.local_storage_path}/content/{metadata.id}_{filename}"
                
                # Copy file
                async with aiofiles.open(local_path, 'rb') as src:
                    async with aiofiles.open(sovereign_path, 'wb') as dst:
                        async for chunk in src:
                            await dst.write(chunk)
                
                metadata.file_paths["original"] = sovereign_path
                
                # Extract basic metadata from file
                metadata = await self._extract_file_metadata(sovereign_path, metadata)
            
            return metadata
        except Exception as e:
            print(f"Error ingesting from local: {e}")
            return metadata
    
    async def _extract_stream_urls(self, content: str, base_url: str) -> Dict[str, str]:
        """Extract streaming URLs from web content"""
        # Placeholder for stream URL extraction logic
        # Would implement parsers for various streaming platforms
        return {}
    
    async def _extract_file_metadata(self, file_path: str, metadata: ContentMetadata) -> ContentMetadata:
        """Extract metadata from media file using ffmpeg"""
        try:
            import subprocess
            import json
            
            # Use ffprobe to extract metadata
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_format', '-show_streams', file_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                info = json.loads(result.stdout)
                
                # Extract duration
                if 'format' in info and 'duration' in info['format']:
                    metadata.duration = int(float(info['format']['duration']) / 60)  # Convert to minutes
                
                # Extract video quality
                for stream in info.get('streams', []):
                    if stream.get('codec_type') == 'video':
                        width = stream.get('width', 0)
                        height = stream.get('height', 0)
                        
                        if height >= 8640:
                            metadata.quality_available.append("8640p")  # 16K
                        elif height >= 4320:
                            metadata.quality_available.append("4320p")  # 8K
                        elif height >= 2160:
                            metadata.quality_available.append("2160p")  # 4K
                        elif height >= 1080:
                            metadata.quality_available.append("1080p")  # HD
                        
                        break
            
            return metadata
        except Exception as e:
            print(f"Error extracting file metadata: {e}")
            return metadata
    
    async def _enhance_with_ai(self, metadata: ContentMetadata) -> ContentMetadata:
        """Use AI to enhance content metadata"""
        try:
            if self.ai_service:
                # Generate enhanced description
                if metadata.title and not metadata.description:
                    prompt = f"Generate a compelling description for a {metadata.content_type} titled '{metadata.title}'"
                    description = await self.ai_service.generate_text(prompt)
                    metadata.description = description
                
                # Generate AI tags
                content_info = f"Title: {metadata.title}\nType: {metadata.content_type}"
                if metadata.description:
                    content_info += f"\nDescription: {metadata.description}"
                
                tag_prompt = f"Generate relevant tags for this content:\n{content_info}\nProvide 5-10 tags separated by commas."
                tags_response = await self.ai_service.generate_text(tag_prompt)
                metadata.ai_tags = [tag.strip() for tag in tags_response.split(',') if tag.strip()]
                
                # Content moderation check
                moderation_result = await self.ai_service.moderate_content(content_info)
                if moderation_result and moderation_result.get('flagged'):
                    metadata.content_warnings = moderation_result.get('categories', [])
                    metadata.is_restricted = True
            
            return metadata
        except Exception as e:
            print(f"Error enhancing with AI: {e}")
            return metadata
    
    async def discover_content(self, user_id: str, source_types: List[str] = None) -> List[ContentMetadata]:
        """Discover content from various sovereign sources"""
        discovered_content = []
        
        try:
            # Get user's sovereignty settings
            user = await self.db.users.find_one({"id": user_id})
            if not user or not user.get("sovereignty_mode"):
                return discovered_content
            
            settings = SovereigntySettings(**user.get("sovereignty_settings", {}))
            
            # Discover from configured sources
            for source in self.content_sources:
                if source_types and source.source_type not in source_types:
                    continue
                    
                if source.source_type == "api":
                    content = await self._discover_from_api(source)
                elif source.source_type == "scraper":
                    content = await self._discover_from_scraper(source)
                elif source.source_type == "p2p":
                    content = await self._discover_from_p2p(source)
                elif source.source_type == "local":
                    content = await self._discover_from_local(source)
                
                discovered_content.extend(content)
            
            return discovered_content[:50]  # Limit results
            
        except Exception as e:
            print(f"Error discovering content: {e}")
            return discovered_content
    
    async def _discover_from_api(self, source: ContentSource) -> List[ContentMetadata]:
        """Discover content from API source"""
        # Placeholder for API-based content discovery
        return []
    
    async def _discover_from_scraper(self, source: ContentSource) -> List[ContentMetadata]:
        """Discover content from web scraping"""
        # Placeholder for web scraping content discovery
        return []
    
    async def _discover_from_p2p(self, source: ContentSource) -> List[ContentMetadata]:
        """Discover content from P2P networks"""
        # Placeholder for P2P content discovery
        return []
    
    async def _discover_from_local(self, source: ContentSource) -> List[ContentMetadata]:
        """Discover content from local storage"""
        discovered = []
        try:
            local_path = source.url or f"{self.local_storage_path}/content"
            if os.path.exists(local_path):
                for filename in os.listdir(local_path):
                    if filename.endswith(('.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv')):
                        file_path = os.path.join(local_path, filename)
                        
                        # Create metadata for local file
                        content_id = hashlib.sha256(filename.encode()).hexdigest()[:16]
                        metadata = ContentMetadata(
                            id=content_id,
                            title=os.path.splitext(filename)[0],
                            content_type="movie",  # Default assumption
                            sovereignty_source=file_path
                        )
                        
                        # Extract file metadata
                        metadata = await self._extract_file_metadata(file_path, metadata)
                        metadata.file_paths["original"] = file_path
                        
                        discovered.append(metadata)
        
        except Exception as e:
            print(f"Error discovering local content: {e}")
        
        return discovered
    
    async def get_user_sovereignty_settings(self, user_id: str) -> Optional[SovereigntySettings]:
        """Get user's sovereignty settings"""
        try:
            user = await self.db.users.find_one({"id": user_id})
            if user and user.get("sovereignty_settings"):
                return SovereigntySettings(**user["sovereignty_settings"])
            return None
        except Exception as e:
            print(f"Error getting sovereignty settings: {e}")
            return None
    
    async def update_sovereignty_settings(self, user_id: str, settings: SovereigntySettings) -> bool:
        """Update user's sovereignty settings"""
        try:
            await self.db.users.update_one(
                {"id": user_id},
                {
                    "$set": {
                        "sovereignty_settings": settings.dict(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return True
        except Exception as e:
            print(f"Error updating sovereignty settings: {e}")
            return False
    
    async def _start_content_discovery(self, user_id: str, settings: SovereigntySettings):
        """Start background content discovery process"""
        # This would run periodic content discovery based on user preferences
        pass