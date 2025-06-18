import asyncio
import json
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timedelta
from ..models import Review, WatchParty, UserProfile

class SocialService:
    """
    Comprehensive social features service for watch parties, reviews, and social sharing
    """
    
    def __init__(self, db=None):
        self.db = db
        self.active_watch_parties: Dict[str, Dict] = {}
        self.party_connections: Dict[str, Set[str]] = {}  # party_id -> set of user_ids
        self.user_connections: Dict[str, str] = {}  # user_id -> party_id
    
    # Review System
    async def create_review(self, user_id: str, content_id: str, 
                          rating: float, title: str = None, 
                          review_text: str = None) -> Optional[Review]:
        """Create a new content review"""
        try:
            # Check if user already reviewed this content
            if self.db is not None:
                existing = await self.db.reviews.find_one({
                    "user_id": user_id,
                    "content_id": content_id
                })
                
                if existing:
                    # Update existing review
                    updated_review = Review(
                        id=existing["id"],
                        user_id=user_id,
                        content_id=content_id,
                        rating=rating,
                        title=title,
                        review_text=review_text,
                        created_at=existing["created_at"],
                        updated_at=datetime.utcnow(),
                        helpful_votes=existing.get("helpful_votes", 0)
                    )
                    
                    await self.db.reviews.replace_one(
                        {"id": existing["id"]},
                        updated_review.dict()
                    )
                    return updated_review
            
            # Create new review
            review = Review(
                user_id=user_id,
                content_id=content_id,
                rating=rating,
                title=title,
                review_text=review_text
            )
            
            if self.db is not None:
                await self.db.reviews.insert_one(review.dict())
            
            return review
            
        except Exception as e:
            print(f"Error creating review: {e}")
            return None
    
    async def get_content_reviews(self, content_id: str, 
                                limit: int = 20, 
                                sort_by: str = "helpful") -> List[Dict]:
        """Get reviews for specific content"""
        try:
            if self.db is None:
                return []
            
            # Determine sort criteria
            sort_criteria = {}
            if sort_by == "helpful":
                sort_criteria = {"helpful_votes": -1, "created_at": -1}
            elif sort_by == "recent":
                sort_criteria = {"created_at": -1}
            elif sort_by == "rating":
                sort_criteria = {"rating": -1, "created_at": -1}
            else:
                sort_criteria = {"created_at": -1}
            
            # Get reviews with user information
            pipeline = [
                {"$match": {"content_id": content_id}},
                {"$sort": sort_criteria},
                {"$limit": limit},
                {"$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "id",
                    "as": "user_info"
                }},
                {"$project": {
                    "id": 1,
                    "rating": 1,
                    "title": 1,
                    "review_text": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "helpful_votes": 1,
                    "user_name": {"$arrayElemAt": ["$user_info.name", 0]},
                    "user_avatar": {"$arrayElemAt": ["$user_info.avatar", 0]}
                }}
            ]
            
            reviews = await self.db.reviews.aggregate(pipeline).to_list(limit)
            return reviews
            
        except Exception as e:
            print(f"Error getting content reviews: {e}")
            return []
    
    async def vote_review_helpful(self, review_id: str, user_id: str) -> bool:
        """Vote a review as helpful"""
        try:
            if self.db is None:
                return False
            
            # Check if user already voted
            existing_vote = await self.db.review_votes.find_one({
                "review_id": review_id,
                "user_id": user_id
            })
            
            if existing_vote:
                return False  # User already voted
            
            # Record vote
            await self.db.review_votes.insert_one({
                "review_id": review_id,
                "user_id": user_id,
                "created_at": datetime.utcnow()
            })
            
            # Increment helpful votes count
            await self.db.reviews.update_one(
                {"id": review_id},
                {"$inc": {"helpful_votes": 1}}
            )
            
            return True
            
        except Exception as e:
            print(f"Error voting review helpful: {e}")
            return False
    
    # Watch Party System
    async def create_watch_party(self, host_user_id: str, content_id: str,
                               party_name: str, max_participants: int = 10,
                               chat_enabled: bool = True, 
                               voice_chat_enabled: bool = False) -> Optional[WatchParty]:
        """Create a new watch party"""
        try:
            party = WatchParty(
                host_user_id=host_user_id,
                content_id=content_id,
                party_name=party_name,
                max_participants=max_participants,
                chat_enabled=chat_enabled,
                voice_chat_enabled=voice_chat_enabled,
                participants=[host_user_id]
            )
            
            # Store in database
            if self.db is not None:
                await self.db.watch_parties.insert_one(party.dict())
            
            # Add to active parties
            self.active_watch_parties[party.id] = {
                "party": party,
                "current_position": 0,
                "is_playing": False,
                "last_sync": datetime.utcnow(),
                "chat_messages": []
            }
            
            # Initialize connections
            self.party_connections[party.id] = {host_user_id}
            self.user_connections[host_user_id] = party.id
            
            return party
            
        except Exception as e:
            print(f"Error creating watch party: {e}")
            return None
    
    async def join_watch_party(self, party_id: str, user_id: str) -> bool:
        """Join an existing watch party"""
        try:
            if party_id not in self.active_watch_parties:
                return False
            
            party_data = self.active_watch_parties[party_id]
            party = party_data["party"]
            
            # Check if party is full
            if len(party.participants) >= party.max_participants:
                return False
            
            # Check if user is already in party
            if user_id in party.participants:
                return True
            
            # Add user to party
            party.participants.append(user_id)
            
            # Update in database
            if self.db:
                await self.db.watch_parties.update_one(
                    {"id": party_id},
                    {"$addToSet": {"participants": user_id}}
                )
            
            # Update connections
            self.party_connections[party_id].add(user_id)
            self.user_connections[user_id] = party_id
            
            # Notify other participants
            await self._broadcast_party_event(party_id, {
                "type": "user_joined",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            return True
            
        except Exception as e:
            print(f"Error joining watch party: {e}")
            return False
    
    async def leave_watch_party(self, party_id: str, user_id: str) -> bool:
        """Leave a watch party"""
        try:
            if party_id not in self.active_watch_parties:
                return False
            
            party_data = self.active_watch_parties[party_id]
            party = party_data["party"]
            
            # Remove user from party
            if user_id in party.participants:
                party.participants.remove(user_id)
            
            # Update in database
            if self.db:
                await self.db.watch_parties.update_one(
                    {"id": party_id},
                    {"$pull": {"participants": user_id}}
                )
            
            # Update connections
            if party_id in self.party_connections:
                self.party_connections[party_id].discard(user_id)
            
            if user_id in self.user_connections:
                del self.user_connections[user_id]
            
            # If host left or no participants, end party
            if user_id == party.host_user_id or len(party.participants) == 0:
                await self._end_watch_party(party_id)
            else:
                # Notify other participants
                await self._broadcast_party_event(party_id, {
                    "type": "user_left",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            return True
            
        except Exception as e:
            print(f"Error leaving watch party: {e}")
            return False
    
    async def sync_playback(self, party_id: str, user_id: str, 
                          position: float, is_playing: bool) -> bool:
        """Synchronize playback position across party participants"""
        try:
            if party_id not in self.active_watch_parties:
                return False
            
            party_data = self.active_watch_parties[party_id]
            party = party_data["party"]
            
            # Only host or synchronized participants can control playback
            if user_id not in party.participants:
                return False
            
            # Update playback state
            party_data["current_position"] = position
            party_data["is_playing"] = is_playing
            party_data["last_sync"] = datetime.utcnow()
            
            # Broadcast sync event to all participants
            await self._broadcast_party_event(party_id, {
                "type": "playback_sync",
                "position": position,
                "is_playing": is_playing,
                "timestamp": datetime.utcnow().isoformat(),
                "sync_user": user_id
            })
            
            return True
            
        except Exception as e:
            print(f"Error syncing playback: {e}")
            return False
    
    async def send_chat_message(self, party_id: str, user_id: str, 
                              message: str) -> bool:
        """Send chat message to watch party"""
        try:
            if party_id not in self.active_watch_parties:
                return False
            
            party_data = self.active_watch_parties[party_id]
            party = party_data["party"]
            
            if not party.chat_enabled or user_id not in party.participants:
                return False
            
            # Create chat message
            chat_message = {
                "id": f"msg_{datetime.utcnow().timestamp()}",
                "user_id": user_id,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Add to party chat
            party_data["chat_messages"].append(chat_message)
            
            # Keep only last 100 messages
            if len(party_data["chat_messages"]) > 100:
                party_data["chat_messages"] = party_data["chat_messages"][-100:]
            
            # Broadcast message to all participants
            await self._broadcast_party_event(party_id, {
                "type": "chat_message",
                "message": chat_message
            })
            
            return True
            
        except Exception as e:
            print(f"Error sending chat message: {e}")
            return False
    
    async def get_watch_party_status(self, party_id: str) -> Optional[Dict]:
        """Get current watch party status"""
        try:
            if party_id not in self.active_watch_parties:
                return None
            
            party_data = self.active_watch_parties[party_id]
            party = party_data["party"]
            
            # Get participant info
            participants_info = []
            if self.db:
                for user_id in party.participants:
                    user = await self.db.users.find_one({"id": user_id})
                    if user:
                        participants_info.append({
                            "id": user_id,
                            "name": user.get("name", "Unknown"),
                            "avatar": user.get("avatar")
                        })
            
            return {
                "party": party.dict(),
                "current_position": party_data["current_position"],
                "is_playing": party_data["is_playing"],
                "last_sync": party_data["last_sync"].isoformat(),
                "participants_info": participants_info,
                "recent_chat": party_data["chat_messages"][-20:]  # Last 20 messages
            }
            
        except Exception as e:
            print(f"Error getting watch party status: {e}")
            return None
    
    async def _end_watch_party(self, party_id: str):
        """End a watch party"""
        try:
            if party_id in self.active_watch_parties:
                party_data = self.active_watch_parties[party_id]
                party = party_data["party"]
                
                # Mark as ended in database
                if self.db:
                    await self.db.watch_parties.update_one(
                        {"id": party_id},
                        {
                            "$set": {
                                "is_active": False,
                                "end_time": datetime.utcnow()
                            }
                        }
                    )
                
                # Notify all participants
                await self._broadcast_party_event(party_id, {
                    "type": "party_ended",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                # Clean up connections
                if party_id in self.party_connections:
                    for user_id in self.party_connections[party_id]:
                        if user_id in self.user_connections:
                            del self.user_connections[user_id]
                    del self.party_connections[party_id]
                
                # Remove from active parties
                del self.active_watch_parties[party_id]
                
        except Exception as e:
            print(f"Error ending watch party: {e}")
    
    async def _broadcast_party_event(self, party_id: str, event: Dict):
        """Broadcast event to all party participants"""
        # This would integrate with WebSocket connections
        # For now, we'll just log the event
        print(f"Broadcasting to party {party_id}: {event}")
        
        # In a real implementation, this would:
        # 1. Get all WebSocket connections for party participants
        # 2. Send the event data to each connection
        # 3. Handle connection errors gracefully
    
    # Social Sharing
    async def share_content(self, user_id: str, content_id: str, 
                          platform: str, message: str = None) -> Dict[str, Any]:
        """Share content to social platforms"""
        try:
            # Get content information
            content = None
            if self.db:
                content = await self.db.content.find_one({"id": content_id})
            
            if not content:
                return {"success": False, "error": "Content not found"}
            
            # Create share record
            share_record = {
                "user_id": user_id,
                "content_id": content_id,
                "platform": platform,
                "message": message,
                "timestamp": datetime.utcnow()
            }
            
            if self.db:
                await self.db.content_shares.insert_one(share_record)
            
            # Generate share URL/content based on platform
            share_url = f"https://quantummediahub.com/content/{content_id}"
            
            share_data = {
                "success": True,
                "share_url": share_url,
                "platform": platform,
                "content_title": content.get("title", "Unknown"),
                "share_text": message or f"Check out '{content.get('title')}' on Quantum Media Hub!"
            }
            
            # Platform-specific formatting
            if platform == "twitter":
                share_data["formatted_text"] = f"{share_data['share_text']} {share_url}"
            elif platform == "facebook":
                share_data["formatted_text"] = share_data['share_text']
            elif platform == "instagram":
                share_data["story_background"] = content.get("backdrop_url")
            
            return share_data
            
        except Exception as e:
            print(f"Error sharing content: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_user_social_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user's social engagement statistics"""
        try:
            if not self.db:
                return {}
            
            # Reviews written
            reviews_count = await self.db.reviews.count_documents({"user_id": user_id})
            
            # Helpful votes received
            helpful_votes_pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {"_id": None, "total_helpful": {"$sum": "$helpful_votes"}}}
            ]
            helpful_result = await self.db.reviews.aggregate(helpful_votes_pipeline).to_list(1)
            total_helpful = helpful_result[0]["total_helpful"] if helpful_result else 0
            
            # Watch parties hosted
            parties_hosted = await self.db.watch_parties.count_documents({"host_user_id": user_id})
            
            # Watch parties joined
            parties_joined = await self.db.watch_parties.count_documents({
                "participants": user_id,
                "host_user_id": {"$ne": user_id}
            })
            
            # Content shared
            shares_count = await self.db.content_shares.count_documents({"user_id": user_id})
            
            return {
                "reviews_written": reviews_count,
                "helpful_votes_received": total_helpful,
                "watch_parties_hosted": parties_hosted,
                "watch_parties_joined": parties_joined,
                "content_shared": shares_count,
                "social_score": self._calculate_social_score({
                    "reviews": reviews_count,
                    "helpful_votes": total_helpful,
                    "parties_hosted": parties_hosted,
                    "parties_joined": parties_joined,
                    "shares": shares_count
                })
            }
            
        except Exception as e:
            print(f"Error getting social stats: {e}")
            return {}
    
    def _calculate_social_score(self, stats: Dict[str, int]) -> int:
        """Calculate user's social engagement score"""
        score = 0
        score += stats.get("reviews", 0) * 10  # 10 points per review
        score += stats.get("helpful_votes", 0) * 5  # 5 points per helpful vote
        score += stats.get("parties_hosted", 0) * 15  # 15 points per party hosted
        score += stats.get("parties_joined", 0) * 5  # 5 points per party joined
        score += stats.get("shares", 0) * 3  # 3 points per share
        
        return min(score, 1000)  # Cap at 1000 points
    
    async def get_trending_content(self, time_range: str = "7d") -> List[Dict]:
        """Get trending content based on social engagement"""
        try:
            if not self.db:
                return []
            
            # Calculate time range
            if time_range == "1d":
                start_date = datetime.utcnow() - timedelta(days=1)
            elif time_range == "7d":
                start_date = datetime.utcnow() - timedelta(days=7)
            else:
                start_date = datetime.utcnow() - timedelta(days=30)
            
            # Aggregate social engagement metrics
            trending_pipeline = [
                {
                    "$facet": {
                        "views": [
                            {"$match": {"start_time": {"$gte": start_date}}},
                            {"$group": {"_id": "$content_id", "view_count": {"$sum": 1}}}
                        ],
                        "reviews": [
                            {"$match": {"created_at": {"$gte": start_date}}},
                            {"$group": {"_id": "$content_id", "review_count": {"$sum": 1}, "avg_rating": {"$avg": "$rating"}}}
                        ],
                        "shares": [
                            {"$match": {"timestamp": {"$gte": start_date}}},
                            {"$group": {"_id": "$content_id", "share_count": {"$sum": 1}}}
                        ]
                    }
                }
            ]
            
            # This is a simplified version - in reality, you'd run this across multiple collections
            # and combine the results to calculate trending scores
            
            return []  # Placeholder for now
            
        except Exception as e:
            print(f"Error getting trending content: {e}")
            return []
    
    def get_active_watch_parties(self) -> List[Dict]:
        """Get all currently active watch parties"""
        active_parties = []
        
        for party_id, party_data in self.active_watch_parties.items():
            party = party_data["party"]
            active_parties.append({
                "id": party.id,
                "name": party.party_name,
                "content_id": party.content_id,
                "host_user_id": party.host_user_id,
                "participant_count": len(party.participants),
                "max_participants": party.max_participants,
                "is_playing": party_data["is_playing"],
                "chat_enabled": party.chat_enabled,
                "voice_chat_enabled": party.voice_chat_enabled,
                "started_at": party.start_time.isoformat()
            })
        
        return active_parties
    
    def get_user_current_party(self, user_id: str) -> Optional[str]:
        """Get the party ID that user is currently in"""
        return self.user_connections.get(user_id)