import os
import asyncio
import subprocess
import json
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
import aiofiles
from ..models import VideoQuality, ContentMetadata

class VideoProcessingService:
    """
    Advanced video processing service supporting 4K-16K resolution
    Handles transcoding, streaming, and quality optimization
    """
    
    def __init__(self, storage_path: str = "/app/sovereign_storage"):
        self.storage_path = storage_path
        self.streams_path = f"{storage_path}/streams"
        self.thumbnails_path = f"{storage_path}/thumbnails"
        self.processing_queue = asyncio.Queue()
        self.is_processing = False
        
        # Ensure directories exist
        os.makedirs(self.streams_path, exist_ok=True)
        os.makedirs(self.thumbnails_path, exist_ok=True)
    
    async def start_processing_worker(self):
        """Start background video processing worker"""
        if not self.is_processing:
            self.is_processing = True
            asyncio.create_task(self._processing_worker())
    
    async def _processing_worker(self):
        """Background worker for video processing"""
        while self.is_processing:
            try:
                task = await asyncio.wait_for(self.processing_queue.get(), timeout=1.0)
                await self._process_video_task(task)
                self.processing_queue.task_done()
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"Processing worker error: {e}")
    
    async def process_video(self, content_id: str, source_path: str, 
                          target_qualities: List[VideoQuality] = None) -> Dict[str, str]:
        """Process video for multiple quality streams"""
        if target_qualities is None:
            target_qualities = [VideoQuality.UHD16K, VideoQuality.UHD8K, 
                              VideoQuality.FHD, VideoQuality.HD]
        
        task = {
            "content_id": content_id,
            "source_path": source_path,
            "target_qualities": target_qualities,
            "timestamp": datetime.utcnow()
        }
        
        await self.processing_queue.put(task)
        return {"status": "queued", "content_id": content_id}
    
    async def _process_video_task(self, task: Dict):
        """Process individual video task"""
        content_id = task["content_id"]
        source_path = task["source_path"]
        target_qualities = task["target_qualities"]
        
        try:
            # Create content directory
            content_dir = f"{self.streams_path}/{content_id}"
            os.makedirs(content_dir, exist_ok=True)
            
            # Get source video info
            video_info = await self._get_video_info(source_path)
            source_height = video_info.get("height", 0)
            source_width = video_info.get("width", 0)
            
            # Process each quality
            stream_urls = {}
            for quality in target_qualities:
                if self._should_process_quality(quality, source_height):
                    stream_url = await self._transcode_to_quality(
                        source_path, content_id, quality, video_info
                    )
                    if stream_url:
                        stream_urls[quality.value] = stream_url
            
            # Generate thumbnails
            await self._generate_thumbnails(source_path, content_id)
            
            # Create master playlist
            await self._create_master_playlist(content_id, stream_urls)
            
            print(f"Video processing completed for {content_id}")
            return stream_urls
            
        except Exception as e:
            print(f"Error processing video {content_id}: {e}")
            return {}
    
    async def _get_video_info(self, video_path: str) -> Dict[str, Any]:
        """Get video information using ffprobe"""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_format', '-show_streams', video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                info = json.loads(result.stdout)
                
                # Extract video stream info
                for stream in info.get('streams', []):
                    if stream.get('codec_type') == 'video':
                        return {
                            "width": stream.get("width", 0),
                            "height": stream.get("height", 0),
                            "duration": float(info.get("format", {}).get("duration", 0)),
                            "bitrate": int(info.get("format", {}).get("bit_rate", 0)),
                            "codec": stream.get("codec_name"),
                            "fps": self._parse_fps(stream.get("r_frame_rate", "0/1"))
                        }
            
            return {}
        except Exception as e:
            print(f"Error getting video info: {e}")
            return {}
    
    def _parse_fps(self, fps_string: str) -> float:
        """Parse frame rate from ffprobe output"""
        try:
            if '/' in fps_string:
                num, den = fps_string.split('/')
                return float(num) / float(den) if float(den) != 0 else 0
            return float(fps_string)
        except:
            return 0.0
    
    def _should_process_quality(self, quality: VideoQuality, source_height: int) -> bool:
        """Determine if we should process this quality based on source"""
        quality_heights = {
            VideoQuality.HD: 1080,
            VideoQuality.FHD: 2160,
            VideoQuality.UHD8K: 4320,
            VideoQuality.UHD16K: 8640
        }
        
        target_height = quality_heights.get(quality, 1080)
        # Only process if source is higher quality or same
        return source_height >= target_height * 0.8  # Allow some tolerance
    
    async def _transcode_to_quality(self, source_path: str, content_id: str, 
                                   quality: VideoQuality, video_info: Dict) -> Optional[str]:
        """Transcode video to specific quality"""
        try:
            quality_config = self._get_quality_config(quality)
            output_dir = f"{self.streams_path}/{content_id}/{quality.value}"
            os.makedirs(output_dir, exist_ok=True)
            
            output_path = f"{output_dir}/playlist.m3u8"
            
            # Determine if we need scaling
            scale_filter = ""
            if video_info.get("height", 0) > quality_config["height"]:
                scale_filter = f"-vf scale={quality_config['width']}:{quality_config['height']}"
            
            # FFmpeg command for HLS transcoding
            cmd = [
                'ffmpeg', '-i', source_path,
                '-c:v', 'libx264',  # Use h264 for compatibility, can upgrade to hevc
                '-preset', 'fast',
                '-crf', str(quality_config['crf']),
                '-maxrate', quality_config['bitrate'],
                '-bufsize', quality_config['bufsize'],
                '-c:a', 'aac',
                '-ar', '48000',
                '-b:a', '128k',
                '-f', 'hls',
                '-hls_time', '4',
                '-hls_playlist_type', 'vod',
                '-hls_segment_filename', f"{output_dir}/segment_%03d.ts",
                output_path
            ]
            
            # Add scaling if needed
            if scale_filter:
                cmd.insert(-8, scale_filter.split()[0])
                cmd.insert(-8, scale_filter.split()[1])
            
            # Run transcoding
            print(f"Starting transcoding to {quality.value} for {content_id}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"Transcoding to {quality.value} completed for {content_id}")
                return f"/api/streams/{content_id}/{quality.value}/playlist.m3u8"
            else:
                print(f"Transcoding failed for {quality.value}: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"Error transcoding to {quality.value}: {e}")
            return None
    
    def _get_quality_config(self, quality: VideoQuality) -> Dict[str, Any]:
        """Get encoding configuration for quality level"""
        configs = {
            VideoQuality.HD: {
                "width": 1920,
                "height": 1080,
                "bitrate": "8M",
                "bufsize": "16M",
                "crf": 23
            },
            VideoQuality.FHD: {
                "width": 3840,
                "height": 2160,
                "bitrate": "25M",
                "bufsize": "50M",
                "crf": 20
            },
            VideoQuality.UHD8K: {
                "width": 7680,
                "height": 4320,
                "bitrate": "80M",
                "bufsize": "160M",
                "crf": 18
            },
            VideoQuality.UHD16K: {
                "width": 15360,
                "height": 8640,
                "bitrate": "200M",
                "bufsize": "400M",
                "crf": 16
            }
        }
        
        return configs.get(quality, configs[VideoQuality.HD])
    
    async def _generate_thumbnails(self, source_path: str, content_id: str):
        """Generate thumbnails for video"""
        try:
            thumbnail_dir = f"{self.thumbnails_path}/{content_id}"
            os.makedirs(thumbnail_dir, exist_ok=True)
            
            # Generate poster thumbnail (at 25% mark)
            poster_path = f"{thumbnail_dir}/poster.jpg"
            cmd = [
                'ffmpeg', '-i', source_path,
                '-ss', '00:01:00',  # 1 minute in
                '-vframes', '1',
                '-vf', 'scale=500:750',
                '-y', poster_path
            ]
            subprocess.run(cmd, capture_output=True)
            
            # Generate backdrop thumbnail (at 50% mark)
            backdrop_path = f"{thumbnail_dir}/backdrop.jpg"
            cmd = [
                'ffmpeg', '-i', source_path,
                '-ss', '00:02:00',  # 2 minutes in
                '-vframes', '1',
                '-vf', 'scale=1280:720',
                '-y', backdrop_path
            ]
            subprocess.run(cmd, capture_output=True)
            
            # Generate timeline thumbnails (every 10 seconds)
            timeline_dir = f"{thumbnail_dir}/timeline"
            os.makedirs(timeline_dir, exist_ok=True)
            
            cmd = [
                'ffmpeg', '-i', source_path,
                '-vf', 'fps=1/10,scale=160:90',
                f"{timeline_dir}/thumb_%04d.jpg"
            ]
            subprocess.run(cmd, capture_output=True)
            
        except Exception as e:
            print(f"Error generating thumbnails: {e}")
    
    async def _create_master_playlist(self, content_id: str, stream_urls: Dict[str, str]):
        """Create master HLS playlist"""
        try:
            master_path = f"{self.streams_path}/{content_id}/master.m3u8"
            
            with open(master_path, 'w') as f:
                f.write("#EXTM3U\n")
                f.write("#EXT-X-VERSION:6\n\n")
                
                # Quality order (highest to lowest)
                quality_order = [
                    (VideoQuality.UHD16K, "200000000", "15360x8640"),
                    (VideoQuality.UHD8K, "80000000", "7680x4320"),
                    (VideoQuality.FHD, "25000000", "3840x2160"),
                    (VideoQuality.HD, "8000000", "1920x1080")
                ]
                
                for quality, bandwidth, resolution in quality_order:
                    if quality.value in stream_urls:
                        f.write(f"#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={resolution}\n")
                        f.write(f"{quality.value}/playlist.m3u8\n\n")
            
        except Exception as e:
            print(f"Error creating master playlist: {e}")
    
    async def get_video_stream_url(self, content_id: str, quality: Optional[VideoQuality] = None) -> Optional[str]:
        """Get streaming URL for video"""
        try:
            if quality:
                # Specific quality requested
                quality_path = f"{self.streams_path}/{content_id}/{quality.value}/playlist.m3u8"
                if os.path.exists(quality_path):
                    return f"/api/streams/{content_id}/{quality.value}/playlist.m3u8"
            
            # Return master playlist for adaptive streaming
            master_path = f"{self.streams_path}/{content_id}/master.m3u8"
            if os.path.exists(master_path):
                return f"/api/streams/{content_id}/master.m3u8"
            
            return None
        except Exception as e:
            print(f"Error getting stream URL: {e}")
            return None
    
    async def get_thumbnail_urls(self, content_id: str) -> Dict[str, str]:
        """Get thumbnail URLs for content"""
        thumbnail_dir = f"{self.thumbnails_path}/{content_id}"
        urls = {}
        
        poster_path = f"{thumbnail_dir}/poster.jpg"
        if os.path.exists(poster_path):
            urls["poster"] = f"/api/thumbnails/{content_id}/poster.jpg"
        
        backdrop_path = f"{thumbnail_dir}/backdrop.jpg"
        if os.path.exists(backdrop_path):
            urls["backdrop"] = f"/api/thumbnails/{content_id}/backdrop.jpg"
        
        return urls
    
    async def delete_video_streams(self, content_id: str) -> bool:
        """Delete all streams and thumbnails for content"""
        try:
            import shutil
            
            # Delete streams
            stream_dir = f"{self.streams_path}/{content_id}"
            if os.path.exists(stream_dir):
                shutil.rmtree(stream_dir)
            
            # Delete thumbnails
            thumbnail_dir = f"{self.thumbnails_path}/{content_id}"
            if os.path.exists(thumbnail_dir):
                shutil.rmtree(thumbnail_dir)
            
            return True
        except Exception as e:
            print(f"Error deleting video streams: {e}")
            return False
    
    async def get_processing_status(self, content_id: str) -> Dict[str, Any]:
        """Get processing status for content"""
        # Check if streams exist
        stream_dir = f"{self.streams_path}/{content_id}"
        qualities_processed = []
        
        if os.path.exists(stream_dir):
            for quality in VideoQuality:
                quality_path = f"{stream_dir}/{quality.value}/playlist.m3u8"
                if os.path.exists(quality_path):
                    qualities_processed.append(quality.value)
        
        return {
            "content_id": content_id,
            "status": "completed" if qualities_processed else "processing",
            "qualities_available": qualities_processed,
            "master_playlist": f"/api/streams/{content_id}/master.m3u8" if qualities_processed else None
        }


class LiveStreamingService:
    """
    Service for handling live streaming capabilities
    """
    
    def __init__(self, storage_path: str = "/app/sovereign_storage"):
        self.storage_path = storage_path
        self.live_streams_path = f"{storage_path}/live"
        self.active_streams: Dict[str, Dict] = {}
        
        os.makedirs(self.live_streams_path, exist_ok=True)
    
    async def create_live_stream(self, stream_config: Dict) -> Dict[str, Any]:
        """Create a new live stream"""
        try:
            stream_id = stream_config.get("id") or f"stream_{datetime.utcnow().timestamp()}"
            stream_key = stream_config.get("stream_key") or f"key_{stream_id}"
            
            # Create stream directory
            stream_dir = f"{self.live_streams_path}/{stream_id}"
            os.makedirs(stream_dir, exist_ok=True)
            
            # Configure RTMP input and HLS output
            rtmp_url = f"rtmp://localhost:1935/live/{stream_key}"
            hls_url = f"/api/live/{stream_id}/playlist.m3u8"
            
            stream_info = {
                "id": stream_id,
                "stream_key": stream_key,
                "rtmp_url": rtmp_url,
                "hls_url": hls_url,
                "status": "ready",
                "created_at": datetime.utcnow().isoformat()
            }
            
            self.active_streams[stream_id] = stream_info
            
            return stream_info
            
        except Exception as e:
            print(f"Error creating live stream: {e}")
            return {}
    
    async def start_live_stream(self, stream_id: str) -> bool:
        """Start processing a live stream"""
        try:
            if stream_id not in self.active_streams:
                return False
            
            stream_info = self.active_streams[stream_id]
            stream_dir = f"{self.live_streams_path}/{stream_id}"
            
            # Start FFmpeg process for live transcoding
            cmd = [
                'ffmpeg',
                '-f', 'flv',
                '-listen', '1',
                '-i', f"rtmp://localhost:1935/live/{stream_info['stream_key']}",
                '-c:v', 'libx264',
                '-preset', 'veryfast',
                '-tune', 'zerolatency',
                '-c:a', 'aac',
                '-f', 'hls',
                '-hls_time', '2',
                '-hls_list_size', '5',
                '-hls_flags', 'delete_segments',
                f"{stream_dir}/playlist.m3u8"
            ]
            
            # Start process in background
            process = subprocess.Popen(cmd)
            stream_info["process"] = process
            stream_info["status"] = "live"
            
            return True
            
        except Exception as e:
            print(f"Error starting live stream: {e}")
            return False
    
    async def stop_live_stream(self, stream_id: str) -> bool:
        """Stop a live stream"""
        try:
            if stream_id in self.active_streams:
                stream_info = self.active_streams[stream_id]
                
                # Stop FFmpeg process
                if "process" in stream_info:
                    stream_info["process"].terminate()
                
                stream_info["status"] = "stopped"
                stream_info["ended_at"] = datetime.utcnow().isoformat()
                
                return True
            return False
            
        except Exception as e:
            print(f"Error stopping live stream: {e}")
            return False
    
    def get_active_streams(self) -> List[Dict]:
        """Get list of active streams"""
        return [stream for stream in self.active_streams.values() 
                if stream.get("status") == "live"]
    
    def get_stream_info(self, stream_id: str) -> Optional[Dict]:
        """Get information about a specific stream"""
        return self.active_streams.get(stream_id)


class InteractiveContentService:
    """
    Service for handling interactive/choose-your-own-adventure content
    """
    
    def __init__(self, db=None):
        self.db = db
        self.interactive_sessions: Dict[str, Dict] = {}
    
    async def create_interactive_session(self, user_id: str, content_id: str) -> str:
        """Create a new interactive viewing session"""
        session_id = f"interactive_{user_id}_{content_id}_{datetime.utcnow().timestamp()}"
        
        # Get interactive content configuration
        interactive_config = await self._get_interactive_config(content_id)
        
        session = {
            "session_id": session_id,
            "user_id": user_id,
            "content_id": content_id,
            "current_path": "start",
            "choices_made": [],
            "started_at": datetime.utcnow(),
            "interactive_config": interactive_config
        }
        
        self.interactive_sessions[session_id] = session
        return session_id
    
    async def make_choice(self, session_id: str, choice_id: str) -> Dict[str, Any]:
        """Process user choice in interactive content"""
        if session_id not in self.interactive_sessions:
            return {"error": "Session not found"}
        
        session = self.interactive_sessions[session_id]
        
        # Record choice
        choice_record = {
            "choice_id": choice_id,
            "timestamp": datetime.utcnow(),
            "path": session["current_path"]
        }
        session["choices_made"].append(choice_record)
        
        # Get next content based on choice
        interactive_config = session["interactive_config"]
        if choice_id in interactive_config.get("branches", {}):
            session["current_path"] = interactive_config["branches"][choice_id]
        else:
            session["current_path"] = interactive_config.get("default_path", "end")
        
        return {
            "next_content": session["current_path"],
            "session_id": session_id
        }
    
    async def get_session_status(self, session_id: str) -> Optional[Dict]:
        """Get current session status"""
        return self.interactive_sessions.get(session_id)
    
    async def _get_interactive_config(self, content_id: str) -> Dict:
        """Get interactive content configuration from database"""
        if self.db is not None:
            try:
                config = await self.db.interactive_content.find_one({"content_id": content_id})
                return config or {"branches": {}, "choices": [], "default_path": "end"}
            except:
                pass
        
        # Return default configuration
        return {"branches": {}, "choices": [], "default_path": "end"}