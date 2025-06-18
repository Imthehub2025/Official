import os
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from ..models import ContentMetadata, ContentType, VideoQuality, ContentRating
from .ai_service import AIService
from .video_service import VideoProcessingService
from .sovereignty_service import SovereigntyService

class ContentManagementService:
    """
    Comprehensive content management service for sovereign media hub
    Handles content discovery, ingestion, processing, and organization
    """
    
    def __init__(self, db, ai_service: AIService = None, 
                 video_service: VideoProcessingService = None,
                 sovereignty_service: SovereigntyService = None):
        self.db = db
        self.ai_service = ai_service
        self.video_service = video_service
        self.sovereignty_service = sovereignty_service
        self.content_cache: Dict[str, Any] = {}
        self.cache_ttl = 300  # 5 minutes
    
    async def create_content(self, content_data: Dict[str, Any], 
                           user_id: str = None) -> Optional[ContentMetadata]:
        """Create new content entry"""
        try:
            content = ContentMetadata(**content_data)
            
            # Use AI to enhance metadata if available
            if self.ai_service and not content.ai_tags:
                enhanced_metadata = await self.ai_service.generate_content_metadata(
                    content_data.get("file_path", ""),
                    content.dict()
                )
                
                if enhanced_metadata:
                    if "description" in enhanced_metadata and not content.description:
                        content.description = enhanced_metadata["description"]
                    
                    if "genres" in enhanced_metadata:
                        content.genre = enhanced_metadata["genres"]
                    
                    if "tags" in enhanced_metadata:
                        content.ai_tags = enhanced_metadata["tags"]
                    
                    if "warnings" in enhanced_metadata:
                        content.content_warnings = enhanced_metadata["warnings"]
            
            # AI content moderation if enabled
            if self.ai_service:
                moderation_result = await self.ai_service.moderate_content(content.dict())
                if moderation_result.get("flags"):
                    content.content_warnings.extend(moderation_result["flags"])
                    if not moderation_result.get("approved", True):
                        content.is_restricted = True
            
            # Store in database
            await self.db.content.insert_one(content.dict())
            
            # Start video processing if file paths provided
            if content.file_paths and self.video_service:
                for quality, file_path in content.file_paths.items():
                    if os.path.exists(file_path):
                        await self.video_service.process_video(
                            content.id, 
                            file_path,
                            [VideoQuality.UHD16K, VideoQuality.UHD8K, 
                             VideoQuality.FHD, VideoQuality.HD]
                        )
            
            return content
            
        except Exception as e:
            print(f"Error creating content: {e}")
            return None
    
    async def get_content(self, content_id: str, user_id: str = None) -> Optional[Dict[str, Any]]:
        """Get content by ID with user-specific data"""
        try:
            # Check cache first
            cache_key = f"content_{content_id}_{user_id or 'anonymous'}"
            if cache_key in self.content_cache:
                cache_time, cached_data = self.content_cache[cache_key]
                if (datetime.utcnow() - cache_time).seconds < self.cache_ttl:
                    return cached_data
            
            # Get content from database
            content = await self.db.content.find_one({"id": content_id})
            if not content:
                return None
            
            content_data = ContentMetadata(**content).dict()
            
            # Add streaming URLs
            if self.video_service:
                stream_url = await self.video_service.get_video_stream_url(content_id)
                if stream_url:
                    content_data["stream_url"] = stream_url
                
                # Get thumbnail URLs
                thumbnails = await self.video_service.get_thumbnail_urls(content_id)
                content_data.update(thumbnails)
            
            # Add user-specific data
            if user_id:
                content_data["user_data"] = await self._get_user_content_data(content_id, user_id)
            
            # Get AI recommendations for similar content
            if self.ai_service and user_id:
                similar_content = await self.get_similar_content(content_id, user_id, limit=5)
                content_data["similar_content"] = similar_content
            
            # Cache the result
            self.content_cache[cache_key] = (datetime.utcnow(), content_data)
            
            return content_data
            
        except Exception as e:
            print(f"Error getting content: {e}")
            return None
    
    async def _get_user_content_data(self, content_id: str, user_id: str) -> Dict[str, Any]:
        """Get user-specific data for content"""
        user_data = {
            "is_in_watchlist": False,
            "watch_progress": 0.0,
            "last_watched": None,
            "user_rating": None
        }
        
        try:
            # Check if in watchlist
            watchlist = await self.db.watchlists.find_one({
                "user_id": user_id,
                "content_id": content_id
            })
            if watchlist:
                user_data["is_in_watchlist"] = True
            
            # Get watch progress
            latest_session = await self.db.viewing_sessions.find_one(
                {"user_id": user_id, "content_id": content_id},
                sort=[("start_time", -1)]
            )
            if latest_session:
                user_data["watch_progress"] = latest_session.get("progress_percentage", 0.0)
                user_data["last_watched"] = latest_session["start_time"]
            
            # Get user rating
            user_review = await self.db.reviews.find_one({
                "user_id": user_id,
                "content_id": content_id
            })
            if user_review:
                user_data["user_rating"] = user_review["rating"]
            
        except Exception as e:
            print(f"Error getting user content data: {e}")
        
        return user_data
    
    async def search_content(self, query: str, user_id: str = None,
                           filters: Dict[str, Any] = None,
                           limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Advanced content search with AI-powered relevance"""
        try:
            # Build search pipeline
            search_pipeline = []
            
            # Text search
            if query:
                search_pipeline.append({
                    "$match": {
                        "$or": [
                            {"title": {"$regex": query, "$options": "i"}},
                            {"description": {"$regex": query, "$options": "i"}},
                            {"genre": {"$regex": query, "$options": "i"}},
                            {"ai_tags": {"$regex": query, "$options": "i"}},
                            {"cast": {"$regex": query, "$options": "i"}},
                            {"director": {"$regex": query, "$options": "i"}}
                        ]
                    }
                })
            
            # Apply filters
            if filters:
                match_conditions = {}
                
                if "genre" in filters:
                    match_conditions["genre"] = {"$in": filters["genre"]}
                
                if "content_type" in filters:
                    match_conditions["content_type"] = filters["content_type"]
                
                if "rating" in filters:
                    match_conditions["rating"] = {"$in": filters["rating"]}
                
                if "year_range" in filters:
                    year_start, year_end = filters["year_range"]
                    match_conditions["release_date"] = {
                        "$gte": datetime(year_start, 1, 1),
                        "$lt": datetime(year_end + 1, 1, 1)
                    }
                
                if "quality" in filters:
                    match_conditions["quality_available"] = {"$in": filters["quality"]}
                
                if "sovereignty_mode" in filters and filters["sovereignty_mode"]:
                    match_conditions["sovereignty_source"] = {"$ne": None}
                
                if match_conditions:
                    search_pipeline.append({"$match": match_conditions})
            
            # Add pagination
            search_pipeline.extend([
                {"$skip": offset},
                {"$limit": limit}
            ])
            
            # Execute search
            results = await self.db.content.aggregate(search_pipeline).to_list(limit)
            
            # Get total count for pagination
            count_pipeline = search_pipeline[:-2]  # Remove skip and limit
            count_pipeline.append({"$count": "total"})
            count_result = await self.db.content.aggregate(count_pipeline).to_list(1)
            total_count = count_result[0]["total"] if count_result else 0
            
            # Enhance results with AI if available
            if self.ai_service and user_id and query:
                results = await self._enhance_search_results_with_ai(results, query, user_id)
            
            return {
                "results": results,
                "total_count": total_count,
                "page": offset // limit + 1,
                "total_pages": (total_count + limit - 1) // limit,
                "query": query,
                "filters": filters
            }
            
        except Exception as e:
            print(f"Error searching content: {e}")
            return {"results": [], "total_count": 0, "page": 1, "total_pages": 0}
    
    async def _enhance_search_results_with_ai(self, results: List[Dict], 
                                            query: str, user_id: str) -> List[Dict]:
        """Use AI to enhance search result relevance"""
        try:
            if not results:
                return results
            
            # Get user context
            user_history = await self._get_user_viewing_history(user_id, limit=20)
            
            # Use AI to rank results
            ranking_prompt = f"""
            Rank these search results by relevance to the query "{query}" and user preferences.
            
            User viewing history: {[item.get('title', 'Unknown') for item in user_history[:5]]}
            
            Search results:
            {json.dumps([{'id': r['id'], 'title': r['title'], 'genre': r.get('genre', []), 'description': r.get('description', '')[:100]} for r in results], indent=2)}
            
            Return a JSON array of content IDs ordered by relevance (most relevant first):
            ["content_id_1", "content_id_2", ...]
            """
            
            if self.ai_service:
                ranking_response = await self.ai_service.generate_text(ranking_prompt)
                try:
                    import re
                    import json
                    json_match = re.search(r'\[.*\]', ranking_response, re.DOTALL)
                    if json_match:
                        ranked_ids = json.loads(json_match.group())
                        
                        # Reorder results based on AI ranking
                        id_to_result = {r['id']: r for r in results}
                        ranked_results = []
                        
                        for content_id in ranked_ids:
                            if content_id in id_to_result:
                                ranked_results.append(id_to_result[content_id])
                        
                        # Add any results not in AI ranking
                        for result in results:
                            if result not in ranked_results:
                                ranked_results.append(result)
                        
                        return ranked_results
                except:
                    pass  # Fall back to original order
            
            return results
            
        except Exception as e:
            print(f"Error enhancing search results: {e}")
            return results
    
    async def get_similar_content(self, content_id: str, user_id: str = None, 
                                limit: int = 10) -> List[Dict]:
        """Get content similar to the given content"""
        try:
            # Get the reference content
            reference_content = await self.db.content.find_one({"id": content_id})
            if not reference_content:
                return []
            
            # Build similarity query
            similarity_conditions = []
            
            # Similar genres
            if reference_content.get("genre"):
                similarity_conditions.append({
                    "genre": {"$in": reference_content["genre"]}
                })
            
            # Same content type
            similarity_conditions.append({
                "content_type": reference_content.get("content_type", "movie")
            })
            
            # Similar rating
            if reference_content.get("rating"):
                similarity_conditions.append({
                    "rating": reference_content["rating"]
                })
            
            # Exclude the reference content itself
            pipeline = [
                {
                    "$match": {
                        "id": {"$ne": content_id},
                        "$or": similarity_conditions
                    }
                },
                {"$limit": limit * 2}  # Get more for AI filtering
            ]
            
            candidates = await self.db.content.aggregate(pipeline).to_list(limit * 2)
            
            # Use AI to refine similarity if available
            if self.ai_service and user_id:
                candidates = await self._ai_filter_similar_content(
                    reference_content, candidates, user_id, limit
                )
            
            return candidates[:limit]
            
        except Exception as e:
            print(f"Error getting similar content: {e}")
            return []
    
    async def _ai_filter_similar_content(self, reference: Dict, 
                                       candidates: List[Dict], 
                                       user_id: str, limit: int) -> List[Dict]:
        """Use AI to filter and rank similar content"""
        try:
            if not candidates:
                return candidates
            
            # Get user preferences
            user_history = await self._get_user_viewing_history(user_id, limit=10)
            
            similarity_prompt = f"""
            Given this reference content and user viewing history, rank the candidate content by similarity and user preference.
            
            Reference Content:
            Title: {reference.get('title')}
            Genre: {reference.get('genre', [])}
            Description: {reference.get('description', '')[:200]}
            
            User's Recent Viewing:
            {[item.get('title') for item in user_history[:5]]}
            
            Candidates:
            {json.dumps([{'id': c['id'], 'title': c['title'], 'genre': c.get('genre', []), 'description': c.get('description', '')[:100]} for c in candidates], indent=2)}
            
            Return top {limit} content IDs ranked by similarity and user preference:
            ["content_id_1", "content_id_2", ...]
            """
            
            ranking_response = await self.ai_service.generate_text(similarity_prompt)
            
            try:
                import re
                import json
                json_match = re.search(r'\[.*\]', ranking_response, re.DOTALL)
                if json_match:
                    ranked_ids = json.loads(json_match.group())
                    
                    # Reorder candidates based on AI ranking
                    id_to_candidate = {c['id']: c for c in candidates}
                    ranked_candidates = []
                    
                    for content_id in ranked_ids:
                        if content_id in id_to_candidate:
                            ranked_candidates.append(id_to_candidate[content_id])
                    
                    return ranked_candidates
            except:
                pass  # Fall back to original order
            
            return candidates
            
        except Exception as e:
            print(f"Error AI filtering similar content: {e}")
            return candidates
    
    async def _get_user_viewing_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's viewing history with content details"""
        try:
            # Get recent viewing sessions
            sessions = await self.db.viewing_sessions.find(
                {"user_id": user_id},
                sort=[("start_time", -1)],
                limit=limit
            ).to_list(limit)
            
            # Get content details for each session
            content_ids = list(set(session["content_id"] for session in sessions))
            content_cursor = self.db.content.find({"id": {"$in": content_ids}})
            content_map = {content["id"]: content async for content in content_cursor}
            
            # Combine session and content data
            history = []
            for session in sessions:
                content_id = session["content_id"]
                if content_id in content_map:
                    content_data = content_map[content_id].copy()
                    content_data.update({
                        "watched_at": session["start_time"],
                        "duration_watched": session["duration_watched"],
                        "completed": session.get("completed", False)
                    })
                    history.append(content_data)
            
            return history
            
        except Exception as e:
            print(f"Error getting user viewing history: {e}")
            return []
    
    async def get_content_recommendations(self, user_id: str, 
                                        recommendation_type: str = "personalized",
                                        limit: int = 20) -> List[Dict]:
        """Get AI-powered content recommendations"""
        try:
            if recommendation_type == "personalized" and self.ai_service:
                # Get user viewing history
                user_history = await self._get_user_viewing_history(user_id, limit=50)
                
                # Get available content
                available_content = await self.db.content.find().to_list(1000)  # Limit for performance
                
                # Generate AI recommendations
                recommendations = await self.ai_service.generate_personalized_recommendations(
                    user_id, user_history, available_content, limit
                )
                
                # Get full content data for recommendations
                recommended_content = []
                for rec in recommendations:
                    content = await self.get_content(rec["content_id"], user_id)
                    if content:
                        content["recommendation_score"] = rec["score"]
                        content["recommendation_reasoning"] = rec["reasoning"]
                        recommended_content.append(content)
                
                return recommended_content
            
            elif recommendation_type == "trending":
                # Get trending content based on recent views
                trending_pipeline = [
                    {
                        "$match": {
                            "start_time": {"$gte": datetime.utcnow() - timedelta(days=7)}
                        }
                    },
                    {
                        "$group": {
                            "_id": "$content_id",
                            "view_count": {"$sum": 1},
                            "unique_viewers": {"$addToSet": "$user_id"}
                        }
                    },
                    {
                        "$addFields": {
                            "unique_viewer_count": {"$size": "$unique_viewers"}
                        }
                    },
                    {"$sort": {"view_count": -1, "unique_viewer_count": -1}},
                    {"$limit": limit}
                ]
                
                trending_data = await self.db.viewing_sessions.aggregate(trending_pipeline).to_list(limit)
                
                trending_content = []
                for item in trending_data:
                    content = await self.get_content(item["_id"], user_id)
                    if content:
                        content["view_count"] = item["view_count"]
                        content["unique_viewers"] = item["unique_viewer_count"]
                        trending_content.append(content)
                
                return trending_content
            
            elif recommendation_type == "new_releases":
                # Get recently added content
                new_content = await self.db.content.find(
                    sort=[("created_at", -1)],
                    limit=limit
                ).to_list(limit)
                
                new_releases = []
                for content_data in new_content:
                    content = await self.get_content(content_data["id"], user_id)
                    if content:
                        new_releases.append(content)
                
                return new_releases
            
            else:
                # Fallback to popular content
                return await self.get_popular_content(user_id, limit)
            
        except Exception as e:
            print(f"Error getting content recommendations: {e}")
            return []
    
    async def get_popular_content(self, user_id: str = None, limit: int = 20) -> List[Dict]:
        """Get popular content based on ratings and views"""
        try:
            # Get content with high ratings and view counts
            popular_pipeline = [
                {
                    "$lookup": {
                        "from": "reviews",
                        "localField": "id",
                        "foreignField": "content_id",
                        "as": "reviews"
                    }
                },
                {
                    "$addFields": {
                        "avg_rating": {"$avg": "$reviews.rating"},
                        "review_count": {"$size": "$reviews"}
                    }
                },
                {
                    "$match": {
                        "review_count": {"$gte": 1}  # At least 1 review
                    }
                },
                {
                    "$sort": {
                        "avg_rating": -1,
                        "review_count": -1
                    }
                },
                {"$limit": limit}
            ]
            
            popular_data = await self.db.content.aggregate(popular_pipeline).to_list(limit)
            
            popular_content = []
            for content_data in popular_data:
                content = await self.get_content(content_data["id"], user_id)
                if content:
                    content["avg_rating"] = content_data.get("avg_rating", 0)
                    content["review_count"] = content_data.get("review_count", 0)
                    popular_content.append(content)
            
            return popular_content
            
        except Exception as e:
            print(f"Error getting popular content: {e}")
            return []
    
    async def update_content(self, content_id: str, updates: Dict[str, Any],
                           user_id: str = None) -> bool:
        """Update content metadata"""
        try:
            # Validate updates
            allowed_fields = [
                "title", "description", "genre", "rating", "release_date",
                "duration", "cast", "director", "languages", "subtitles",
                "ai_tags", "content_warnings", "is_restricted"
            ]
            
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
            filtered_updates["updated_at"] = datetime.utcnow()
            
            # Update in database
            result = await self.db.content.update_one(
                {"id": content_id},
                {"$set": filtered_updates}
            )
            
            # Clear cache for this content
            cache_keys_to_remove = [k for k in self.content_cache.keys() if content_id in k]
            for key in cache_keys_to_remove:
                del self.content_cache[key]
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error updating content: {e}")
            return False
    
    async def delete_content(self, content_id: str, user_id: str = None) -> bool:
        """Delete content and associated data"""
        try:
            # Delete content record
            content_result = await self.db.content.delete_one({"id": content_id})
            
            # Delete associated data
            await self.db.reviews.delete_many({"content_id": content_id})
            await self.db.viewing_sessions.delete_many({"content_id": content_id})
            await self.db.watchlists.delete_many({"content_id": content_id})
            await self.db.ai_recommendations.delete_many({"content_id": content_id})
            
            # Delete video files and streams
            if self.video_service:
                await self.video_service.delete_video_streams(content_id)
            
            # Clear cache
            cache_keys_to_remove = [k for k in self.content_cache.keys() if content_id in k]
            for key in cache_keys_to_remove:
                del self.content_cache[key]
            
            return content_result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting content: {e}")
            return False
    
    async def get_content_stats(self, content_id: str) -> Dict[str, Any]:
        """Get comprehensive statistics for content"""
        try:
            stats = {
                "content_id": content_id,
                "total_views": 0,
                "unique_viewers": 0,
                "total_watch_time": 0,
                "avg_watch_time": 0,
                "completion_rate": 0.0,
                "avg_rating": 0.0,
                "total_reviews": 0,
                "share_count": 0
            }
            
            # View statistics
            view_pipeline = [
                {"$match": {"content_id": content_id}},
                {
                    "$group": {
                        "_id": None,
                        "total_views": {"$sum": 1},
                        "unique_viewers": {"$addToSet": "$user_id"},
                        "total_watch_time": {"$sum": "$duration_watched"},
                        "completed_sessions": {
                            "$sum": {"$cond": ["$completed", 1, 0]}
                        }
                    }
                }
            ]
            
            view_stats = await self.db.viewing_sessions.aggregate(view_pipeline).to_list(1)
            if view_stats:
                view_data = view_stats[0]
                stats["total_views"] = view_data["total_views"]
                stats["unique_viewers"] = len(view_data["unique_viewers"])
                stats["total_watch_time"] = view_data["total_watch_time"]
                stats["avg_watch_time"] = (
                    view_data["total_watch_time"] / view_data["total_views"]
                    if view_data["total_views"] > 0 else 0
                )
                stats["completion_rate"] = (
                    view_data["completed_sessions"] / view_data["total_views"]
                    if view_data["total_views"] > 0 else 0
                )
            
            # Review statistics
            review_pipeline = [
                {"$match": {"content_id": content_id}},
                {
                    "$group": {
                        "_id": None,
                        "avg_rating": {"$avg": "$rating"},
                        "total_reviews": {"$sum": 1}
                    }
                }
            ]
            
            review_stats = await self.db.reviews.aggregate(review_pipeline).to_list(1)
            if review_stats:
                review_data = review_stats[0]
                stats["avg_rating"] = review_data["avg_rating"]
                stats["total_reviews"] = review_data["total_reviews"]
            
            # Share count
            share_count = await self.db.content_shares.count_documents({"content_id": content_id})
            stats["share_count"] = share_count
            
            return stats
            
        except Exception as e:
            print(f"Error getting content stats: {e}")
            return {}