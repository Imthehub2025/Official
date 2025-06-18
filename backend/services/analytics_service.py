import os
import json
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from ..models import ViewingSession, UserAnalytics, DeviceType

class AdvancedAnalyticsService:
    """
    Comprehensive analytics service for tracking user behavior,
    device usage, XR engagement, and platform performance
    """
    
    def __init__(self, db=None):
        self.db = db
        self.real_time_metrics: Dict[str, Any] = {
            "active_users": 0,
            "concurrent_streams": 0,
            "total_bandwidth": 0,
            "xr_sessions": 0,
            "device_connections": defaultdict(int)
        }
        self.metrics_cache: Dict[str, Any] = {}
        self.cache_ttl = 300  # 5 minutes
    
    async def track_viewing_session(self, session: ViewingSession) -> bool:
        """Track a viewing session with comprehensive metrics"""
        try:
            # Store session in database
            if self.db is not None:
                await self.db.viewing_sessions.insert_one(session.dict())
            
            # Update real-time metrics
            self._update_real_time_metrics(session)
            
            # Update user analytics
            await self._update_user_analytics(session)
            
            return True
        except Exception as e:
            print(f"Error tracking viewing session: {e}")
            return False
    
    def _update_real_time_metrics(self, session: ViewingSession):
        """Update real-time metrics"""
        self.real_time_metrics["concurrent_streams"] += 1
        
        if session.xr_session:
            self.real_time_metrics["xr_sessions"] += 1
        
        if session.device_type:
            self.real_time_metrics["device_connections"][session.device_type] += 1
    
    async def _update_user_analytics(self, session: ViewingSession):
        """Update user-specific analytics"""
        try:
            if self.db is None:
                return
            
            user_id = session.user_id
            
            # Get existing analytics or create new
            existing = await self.db.user_analytics.find_one({"user_id": user_id})
            
            if existing:
                analytics = UserAnalytics(**existing)
            else:
                analytics = UserAnalytics(user_id=user_id)
            
            # Update metrics
            analytics.total_watch_time += session.duration_watched // 60  # Convert to minutes
            
            # Update device usage
            if session.device_type:
                analytics.device_usage[session.device_type] = analytics.device_usage.get(session.device_type, 0) + 1
            
            # Update XR usage
            if session.xr_session:
                analytics.xr_usage_hours += session.duration_watched / 3600  # Convert to hours
            
            # Update voice command frequency
            if session.voice_commands_used:
                analytics.voice_command_frequency += len(session.voice_commands_used)
            
            # Calculate average session duration
            total_sessions = await self.db.viewing_sessions.count_documents({"user_id": user_id})
            if total_sessions > 0:
                total_duration = await self._get_total_user_watch_time(user_id)
                analytics.average_session_duration = total_duration / total_sessions
            
            analytics.last_updated = datetime.utcnow()
            
            # Save analytics
            await self.db.user_analytics.replace_one(
                {"user_id": user_id},
                analytics.dict(),
                upsert=True
            )
            
        except Exception as e:
            print(f"Error updating user analytics: {e}")
    
    async def _get_total_user_watch_time(self, user_id: str) -> float:
        """Get total watch time for user in seconds"""
        try:
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {"_id": None, "total": {"$sum": "$duration_watched"}}}
            ]
            
            result = await self.db.viewing_sessions.aggregate(pipeline).to_list(1)
            return result[0]["total"] if result else 0.0
        except:
            return 0.0
    
    async def get_user_analytics(self, user_id: str) -> Optional[UserAnalytics]:
        """Get comprehensive analytics for a user"""
        try:
            if self.db is None:
                return None
            
            analytics_data = await self.db.user_analytics.find_one({"user_id": user_id})
            if analytics_data:
                return UserAnalytics(**analytics_data)
            
            # Generate analytics if none exist
            await self._generate_user_analytics(user_id)
            analytics_data = await self.db.user_analytics.find_one({"user_id": user_id})
            return UserAnalytics(**analytics_data) if analytics_data else None
            
        except Exception as e:
            print(f"Error getting user analytics: {e}")
            return None
    
    async def _generate_user_analytics(self, user_id: str):
        """Generate analytics for user based on viewing history"""
        try:
            # Get all user sessions
            sessions_cursor = self.db.viewing_sessions.find({"user_id": user_id})
            sessions = [ViewingSession(**session) async for session in sessions_cursor]
            
            if not sessions:
                return
            
            # Calculate analytics
            analytics = UserAnalytics(user_id=user_id)
            
            # Basic metrics
            analytics.total_watch_time = sum(s.duration_watched for s in sessions) // 60
            analytics.average_session_duration = sum(s.duration_watched for s in sessions) / len(sessions)
            
            # Device usage
            device_counter = Counter(s.device_type for s in sessions if s.device_type)
            analytics.device_usage = dict(device_counter)
            
            # XR usage
            xr_sessions = [s for s in sessions if s.xr_session]
            analytics.xr_usage_hours = sum(s.duration_watched for s in xr_sessions) / 3600
            
            # Voice commands
            total_voice_commands = sum(len(s.voice_commands_used) for s in sessions)
            analytics.voice_command_frequency = total_voice_commands / len(sessions) if sessions else 0
            
            # Preferred quality
            quality_counter = Counter(s.quality for s in sessions)
            if quality_counter:
                analytics.preferred_quality = quality_counter.most_common(1)[0][0]
            
            # Get content information for genre analysis
            content_ids = list(set(s.content_id for s in sessions))
            content_cursor = self.db.content.find({"id": {"$in": content_ids}})
            content_list = [content async for content in content_cursor]
            
            # Analyze genres
            genre_counter = Counter()
            content_type_counter = Counter()
            
            for content in content_list:
                for genre in content.get("genre", []):
                    genre_counter[genre] += 1
                content_type = content.get("content_type", "movie")
                content_type_counter[content_type] += 1
            
            analytics.favorite_genres = [genre for genre, _ in genre_counter.most_common(5)]
            if content_type_counter:
                analytics.most_watched_content_type = content_type_counter.most_common(1)[0][0]
            
            analytics.last_updated = datetime.utcnow()
            
            # Save analytics
            await self.db.user_analytics.replace_one(
                {"user_id": user_id},
                analytics.dict(),
                upsert=True
            )
            
        except Exception as e:
            print(f"Error generating user analytics: {e}")
    
    async def get_platform_analytics(self, time_range: str = "7d") -> Dict[str, Any]:
        """Get comprehensive platform analytics"""
        cache_key = f"platform_analytics_{time_range}"
        
        # Check cache
        if cache_key in self.metrics_cache:
            cache_time, data = self.metrics_cache[cache_key]
            if (datetime.utcnow() - cache_time).seconds < self.cache_ttl:
                return data
        
        try:
            # Calculate time range
            if time_range == "1d":
                start_date = datetime.utcnow() - timedelta(days=1)
            elif time_range == "7d":
                start_date = datetime.utcnow() - timedelta(days=7)
            elif time_range == "30d":
                start_date = datetime.utcnow() - timedelta(days=30)
            else:
                start_date = datetime.utcnow() - timedelta(days=7)
            
            analytics = {
                "time_range": time_range,
                "start_date": start_date.isoformat(),
                "end_date": datetime.utcnow().isoformat(),
                "real_time_metrics": self.real_time_metrics,
                "user_metrics": await self._get_user_metrics(start_date),
                "content_metrics": await self._get_content_metrics(start_date),
                "device_metrics": await self._get_device_metrics(start_date),
                "xr_metrics": await self._get_xr_metrics(start_date),
                "quality_metrics": await self._get_quality_metrics(start_date),
                "performance_metrics": await self._get_performance_metrics(start_date)
            }
            
            # Cache results
            self.metrics_cache[cache_key] = (datetime.utcnow(), analytics)
            
            return analytics
            
        except Exception as e:
            print(f"Error getting platform analytics: {e}")
            return {}
    
    async def _get_user_metrics(self, start_date: datetime) -> Dict[str, Any]:
        """Get user-related metrics"""
        try:
            if not self.db:
                return {}
            
            # Total users
            total_users = await self.db.users.count_documents({})
            
            # Active users (users with sessions in time range)
            active_users = await self.db.viewing_sessions.distinct(
                "user_id", 
                {"start_time": {"$gte": start_date}}
            )
            
            # New users
            new_users = await self.db.users.count_documents({
                "created_at": {"$gte": start_date}
            })
            
            # User engagement
            engagement_pipeline = [
                {"$match": {"start_time": {"$gte": start_date}}},
                {"$group": {
                    "_id": "$user_id",
                    "sessions": {"$sum": 1},
                    "total_watch_time": {"$sum": "$duration_watched"}
                }},
                {"$group": {
                    "_id": None,
                    "avg_sessions": {"$avg": "$sessions"},
                    "avg_watch_time": {"$avg": "$total_watch_time"}
                }}
            ]
            
            engagement_result = await self.db.viewing_sessions.aggregate(engagement_pipeline).to_list(1)
            engagement = engagement_result[0] if engagement_result else {}
            
            return {
                "total_users": total_users,
                "active_users": len(active_users),
                "new_users": new_users,
                "avg_sessions_per_user": engagement.get("avg_sessions", 0),
                "avg_watch_time_per_user": engagement.get("avg_watch_time", 0)
            }
            
        except Exception as e:
            print(f"Error getting user metrics: {e}")
            return {}
    
    async def _get_content_metrics(self, start_date: datetime) -> Dict[str, Any]:
        """Get content-related metrics"""
        try:
            if not self.db:
                return {}
            
            # Most watched content
            popular_content_pipeline = [
                {"$match": {"start_time": {"$gte": start_date}}},
                {"$group": {
                    "_id": "$content_id",
                    "views": {"$sum": 1},
                    "total_watch_time": {"$sum": "$duration_watched"}
                }},
                {"$sort": {"views": -1}},
                {"$limit": 10}
            ]
            
            popular_content = await self.db.viewing_sessions.aggregate(popular_content_pipeline).to_list(10)
            
            # Genre preferences
            # This would require joining with content collection
            # Simplified version here
            genre_pipeline = [
                {"$match": {"start_time": {"$gte": start_date}}},
                {"$group": {"_id": "$content_id", "views": {"$sum": 1}}}
            ]
            
            content_views = await self.db.viewing_sessions.aggregate(genre_pipeline).to_list(None)
            
            return {
                "popular_content": popular_content,
                "total_content_views": len(content_views),
                "unique_content_watched": len(set(item["_id"] for item in content_views))
            }
            
        except Exception as e:
            print(f"Error getting content metrics: {e}")
            return {}
    
    async def _get_device_metrics(self, start_date: datetime) -> Dict[str, Any]:
        """Get device usage metrics"""
        try:
            if not self.db:
                return {}
            
            device_pipeline = [
                {"$match": {"start_time": {"$gte": start_date}}},
                {"$group": {
                    "_id": "$device_type",
                    "sessions": {"$sum": 1},
                    "total_watch_time": {"$sum": "$duration_watched"}
                }}
            ]
            
            device_stats = await self.db.viewing_sessions.aggregate(device_pipeline).to_list(None)
            
            # Bluetooth device usage
            bluetooth_pipeline = [
                {"$match": {
                    "start_time": {"$gte": start_date},
                    "bluetooth_devices": {"$ne": []}
                }},
                {"$group": {
                    "_id": None,
                    "sessions_with_bluetooth": {"$sum": 1},
                    "unique_devices": {"$addToSet": "$bluetooth_devices"}
                }}
            ]
            
            bluetooth_stats = await self.db.viewing_sessions.aggregate(bluetooth_pipeline).to_list(1)
            bluetooth_data = bluetooth_stats[0] if bluetooth_stats else {}
            
            # Casting usage
            casting_pipeline = [
                {"$match": {
                    "start_time": {"$gte": start_date},
                    "casting_device": {"$ne": None}
                }},
                {"$group": {
                    "_id": "$casting_device",
                    "sessions": {"$sum": 1}
                }}
            ]
            
            casting_stats = await self.db.viewing_sessions.aggregate(casting_pipeline).to_list(None)
            
            return {
                "device_usage": {item["_id"]: item for item in device_stats},
                "bluetooth_sessions": bluetooth_data.get("sessions_with_bluetooth", 0),
                "unique_bluetooth_devices": len(bluetooth_data.get("unique_devices", [])),
                "casting_usage": {item["_id"]: item["sessions"] for item in casting_stats}
            }
            
        except Exception as e:
            print(f"Error getting device metrics: {e}")
            return {}
    
    async def _get_xr_metrics(self, start_date: datetime) -> Dict[str, Any]:
        """Get XR/VR usage metrics"""
        try:
            if not self.db:
                return {}
            
            xr_pipeline = [
                {"$match": {
                    "start_time": {"$gte": start_date},
                    "xr_session": True
                }},
                {"$group": {
                    "_id": None,
                    "total_xr_sessions": {"$sum": 1},
                    "total_xr_watch_time": {"$sum": "$duration_watched"},
                    "unique_xr_users": {"$addToSet": "$user_id"}
                }}
            ]
            
            xr_stats = await self.db.viewing_sessions.aggregate(xr_pipeline).to_list(1)
            xr_data = xr_stats[0] if xr_stats else {}
            
            # XR device breakdown
            xr_device_pipeline = [
                {"$match": {
                    "start_time": {"$gte": start_date},
                    "xr_session": True
                }},
                {"$group": {
                    "_id": "$device_type",
                    "sessions": {"$sum": 1},
                    "watch_time": {"$sum": "$duration_watched"}
                }}
            ]
            
            xr_device_stats = await self.db.viewing_sessions.aggregate(xr_device_pipeline).to_list(None)
            
            return {
                "total_xr_sessions": xr_data.get("total_xr_sessions", 0),
                "total_xr_watch_time": xr_data.get("total_xr_watch_time", 0),
                "unique_xr_users": len(xr_data.get("unique_xr_users", [])),
                "xr_device_breakdown": {item["_id"]: item for item in xr_device_stats},
                "avg_xr_session_duration": (
                    xr_data.get("total_xr_watch_time", 0) / xr_data.get("total_xr_sessions", 1)
                )
            }
            
        except Exception as e:
            print(f"Error getting XR metrics: {e}")
            return {}
    
    async def _get_quality_metrics(self, start_date: datetime) -> Dict[str, Any]:
        """Get video quality usage metrics"""
        try:
            if not self.db:
                return {}
            
            quality_pipeline = [
                {"$match": {"start_time": {"$gte": start_date}}},
                {"$group": {
                    "_id": "$quality",
                    "sessions": {"$sum": 1},
                    "total_watch_time": {"$sum": "$duration_watched"}
                }}
            ]
            
            quality_stats = await self.db.viewing_sessions.aggregate(quality_pipeline).to_list(None)
            
            return {
                "quality_distribution": {item["_id"]: item for item in quality_stats},
                "4k_plus_usage": sum(
                    item["sessions"] for item in quality_stats 
                    if item["_id"] in ["2160p", "4320p", "8640p"]
                )
            }
            
        except Exception as e:
            print(f"Error getting quality metrics: {e}")
            return {}
    
    async def _get_performance_metrics(self, start_date: datetime) -> Dict[str, Any]:
        """Get platform performance metrics"""
        try:
            # These would typically come from system monitoring
            # Placeholder implementation
            return {
                "avg_load_time": 2.3,  # seconds
                "avg_buffer_time": 0.8,  # seconds
                "error_rate": 0.02,  # 2%
                "uptime": 99.9,  # percentage
                "bandwidth_usage": "15.2 TB",  # total bandwidth
                "peak_concurrent_users": 1250
            }
            
        except Exception as e:
            print(f"Error getting performance metrics: {e}")
            return {}
    
    async def track_voice_command(self, user_id: str, command: str, success: bool, context: Dict = None):
        """Track voice command usage"""
        try:
            if self.db:
                voice_record = {
                    "user_id": user_id,
                    "command": command,
                    "success": success,
                    "context": context or {},
                    "timestamp": datetime.utcnow()
                }
                await self.db.voice_commands.insert_one(voice_record)
            
        except Exception as e:
            print(f"Error tracking voice command: {e}")
    
    async def get_voice_analytics(self, time_range: str = "7d") -> Dict[str, Any]:
        """Get voice command analytics"""
        try:
            if not self.db:
                return {}
            
            # Calculate time range
            if time_range == "1d":
                start_date = datetime.utcnow() - timedelta(days=1)
            elif time_range == "7d":
                start_date = datetime.utcnow() - timedelta(days=7)
            else:
                start_date = datetime.utcnow() - timedelta(days=30)
            
            # Voice command stats
            command_pipeline = [
                {"$match": {"timestamp": {"$gte": start_date}}},
                {"$group": {
                    "_id": "$command",
                    "total_uses": {"$sum": 1},
                    "success_rate": {"$avg": {"$cond": ["$success", 1, 0]}}
                }},
                {"$sort": {"total_uses": -1}}
            ]
            
            command_stats = await self.db.voice_commands.aggregate(command_pipeline).to_list(None)
            
            # Overall success rate
            total_commands = await self.db.voice_commands.count_documents({
                "timestamp": {"$gte": start_date}
            })
            
            successful_commands = await self.db.voice_commands.count_documents({
                "timestamp": {"$gte": start_date},
                "success": True
            })
            
            overall_success_rate = (successful_commands / total_commands) if total_commands > 0 else 0
            
            return {
                "total_commands": total_commands,
                "overall_success_rate": overall_success_rate,
                "command_breakdown": command_stats,
                "most_used_command": command_stats[0]["_id"] if command_stats else None
            }
            
        except Exception as e:
            print(f"Error getting voice analytics: {e}")
            return {}
    
    def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get current real-time metrics"""
        return self.real_time_metrics.copy()
    
    def update_real_time_metric(self, metric: str, value: Any):
        """Update a real-time metric"""
        self.real_time_metrics[metric] = value
    
    def increment_real_time_metric(self, metric: str, increment: int = 1):
        """Increment a real-time metric"""
        self.real_time_metrics[metric] = self.real_time_metrics.get(metric, 0) + increment
    
    def decrement_real_time_metric(self, metric: str, decrement: int = 1):
        """Decrement a real-time metric"""
        self.real_time_metrics[metric] = max(0, self.real_time_metrics.get(metric, 0) - decrement)