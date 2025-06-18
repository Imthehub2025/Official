import os
import json
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

class AIService:
    """
    Advanced AI service for content recommendations, moderation, and enhancement
    Uses OpenAI GPT-4o for intelligent content processing
    """
    
    def __init__(self, api_key: str, db=None):
        self.api_key = api_key
        self.db = db
        self.recommendation_cache: Dict[str, Any] = {}
        self.moderation_enabled = True
        
    async def generate_personalized_recommendations(self, 
                                                  user_id: str, 
                                                  content_history: List[Dict],
                                                  available_content: List[Dict],
                                                  limit: int = 10) -> List[Dict]:
        """Generate AI-powered personalized content recommendations"""
        try:
            # Create AI chat instance
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"recommendations_{user_id}",
                system_message="""You are an advanced AI recommendation engine for a streaming platform. 
                Analyze user viewing history and preferences to recommend the most relevant content.
                Consider factors like genres, ratings, viewing time, completion rates, and content similarity.
                Provide personalized recommendations with reasoning."""
            ).with_model("openai", "gpt-4o")
            
            # Prepare user context
            user_context = self._prepare_user_context(user_id, content_history)
            content_catalog = self._prepare_content_catalog(available_content)
            
            prompt = f"""
            User Context:
            {json.dumps(user_context, indent=2)}
            
            Available Content:
            {json.dumps(content_catalog[:50], indent=2)}  # Limit for context size
            
            Please recommend {limit} pieces of content for this user. For each recommendation, provide:
            1. Content ID
            2. Recommendation score (0-100)
            3. Reasoning (why this content matches the user)
            4. Recommendation type (trending, similar, genre-based, etc.)
            
            Return as JSON array with format:
            [{"content_id": "id", "score": 85, "reasoning": "...", "type": "similar"}]
            """
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse AI response
            recommendations = self._parse_recommendations_response(response)
            
            # Store recommendations in database
            await self._store_recommendations(user_id, recommendations)
            
            return recommendations
            
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            # Fallback to basic recommendations
            return await self._generate_fallback_recommendations(user_id, available_content, limit)
    
    async def moderate_content(self, content: Dict) -> Dict[str, Any]:
        """AI-powered content moderation"""
        if not self.moderation_enabled:
            return {"approved": True, "flags": [], "confidence": 1.0}
        
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"moderation_{content.get('id', 'unknown')}",
                system_message="""You are a content moderation AI for a streaming platform.
                Analyze content for inappropriate material including violence, adult content, hate speech, etc.
                Provide detailed moderation results with confidence scores."""
            ).with_model("openai", "gpt-4o")
            
            content_text = f"""
            Title: {content.get('title', 'Unknown')}
            Description: {content.get('description', 'No description')}
            Genre: {', '.join(content.get('genre', []))}
            Rating: {content.get('rating', 'Unrated')}
            Tags: {', '.join(content.get('ai_tags', []))}
            """
            
            prompt = f"""
            Analyze this content for moderation:
            {content_text}
            
            Check for:
            - Violence/Gore
            - Adult/Sexual content
            - Hate speech
            - Drug/Substance abuse
            - Self-harm content
            - Misinformation
            
            Return JSON with:
            {{"approved": true/false, "flags": ["category1", "category2"], "confidence": 0.0-1.0, "reasoning": "explanation"}}
            """
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return self._parse_moderation_response(response)
            
        except Exception as e:
            print(f"Error in content moderation: {e}")
            return {"approved": True, "flags": [], "confidence": 0.5, "error": str(e)}
    
    async def generate_content_metadata(self, file_path: str, basic_info: Dict) -> Dict[str, Any]:
        """Use AI to generate enhanced content metadata"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"metadata_{basic_info.get('id', 'unknown')}",
                system_message="""You are an AI metadata generator for media content.
                Based on basic information, generate comprehensive metadata including genres, 
                descriptions, tags, and content warnings."""
            ).with_model("openai", "gpt-4o")
            
            prompt = f"""
            Generate comprehensive metadata for this content:
            
            Basic Info:
            - Title: {basic_info.get('title', 'Unknown')}
            - File: {os.path.basename(file_path)}
            - Duration: {basic_info.get('duration', 'Unknown')} minutes
            - Quality: {basic_info.get('quality_available', [])}
            
            Generate:
            1. Compelling description (2-3 sentences)
            2. Genre classification (pick 2-3 main genres)
            3. Content tags (8-10 relevant tags)
            4. Content warnings if applicable
            5. Target audience age
            6. Mood/tone descriptors
            
            Return as JSON:
            {{
                "description": "...",
                "genres": ["genre1", "genre2"],
                "tags": ["tag1", "tag2", ...],
                "warnings": ["warning1", ...],
                "target_age": "13+",
                "mood": ["action-packed", "emotional"]
            }}
            """
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return self._parse_metadata_response(response)
            
        except Exception as e:
            print(f"Error generating metadata: {e}")
            return {}
    
    async def process_voice_command(self, user_id: str, command_text: str, context: Dict = None) -> Dict[str, Any]:
        """Process natural language voice commands"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"voice_{user_id}",
                system_message="""You are a voice command processor for a streaming platform.
                Parse natural language commands and convert them to structured actions.
                Handle commands like play, pause, search, navigate, adjust settings, etc."""
            ).with_model("openai", "gpt-4o")
            
            context_info = json.dumps(context or {}, indent=2)
            
            prompt = f"""
            Process this voice command: "{command_text}"
            
            Current Context:
            {context_info}
            
            Return structured action as JSON:
            {{
                "action": "play|pause|search|navigate|volume|quality|etc",
                "parameters": {{"param1": "value1", "param2": "value2"}},
                "confidence": 0.0-1.0,
                "natural_response": "Understood, playing the movie now."
            }}
            
            Common actions:
            - play: Start playback
            - pause: Pause playback
            - search: Search for content
            - navigate: Go to section
            - volume: Adjust volume
            - quality: Change video quality
            - subtitle: Toggle subtitles
            - fullscreen: Toggle fullscreen
            """
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return self._parse_voice_command_response(response)
            
        except Exception as e:
            print(f"Error processing voice command: {e}")
            return {"action": "error", "parameters": {}, "confidence": 0.0, "natural_response": "Sorry, I didn't understand that command."}
    
    async def analyze_viewing_patterns(self, user_id: str, viewing_history: List[Dict]) -> Dict[str, Any]:
        """Analyze user viewing patterns for insights"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"analysis_{user_id}",
                system_message="""You are a viewing behavior analyst for a streaming platform.
                Analyze user viewing patterns to provide insights about preferences, habits, and trends."""
            ).with_model("openai", "gpt-4o")
            
            history_summary = self._summarize_viewing_history(viewing_history)
            
            prompt = f"""
            Analyze this user's viewing patterns:
            
            {json.dumps(history_summary, indent=2)}
            
            Provide insights on:
            1. Favorite genres and content types
            2. Viewing habits (time, duration, completion rates)
            3. Device preferences
            4. Quality preferences
            5. Content discovery patterns
            6. Recommendations for improvement
            
            Return as JSON:
            {{
                "favorite_genres": ["genre1", "genre2"],
                "viewing_habits": {{"peak_time": "evening", "avg_session": "90min"}},
                "preferences": {{"quality": "4K", "device": "TV"}},
                "insights": ["insight1", "insight2"],
                "recommendations": ["rec1", "rec2"]
            }}
            """
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            return self._parse_analysis_response(response)
            
        except Exception as e:
            print(f"Error analyzing viewing patterns: {e}")
            return {}
    
    def _prepare_user_context(self, user_id: str, content_history: List[Dict]) -> Dict:
        """Prepare user context for AI processing"""
        context = {
            "user_id": user_id,
            "total_content_watched": len(content_history),
            "genres_watched": {},
            "avg_rating": 0,
            "completion_rate": 0,
            "recent_activity": []
        }
        
        if content_history:
            # Analyze genres
            for item in content_history:
                for genre in item.get("genres", []):
                    context["genres_watched"][genre] = context["genres_watched"].get(genre, 0) + 1
            
            # Calculate averages
            ratings = [item.get("rating", 0) for item in content_history if item.get("rating")]
            if ratings:
                context["avg_rating"] = sum(ratings) / len(ratings)
            
            # Recent activity (last 10 items)
            context["recent_activity"] = content_history[-10:]
        
        return context
    
    def _prepare_content_catalog(self, available_content: List[Dict]) -> List[Dict]:
        """Prepare content catalog for AI processing"""
        catalog = []
        for content in available_content:
            catalog.append({
                "id": content.get("id"),
                "title": content.get("title"),
                "genres": content.get("genre", []),
                "rating": content.get("rating"),
                "description": content.get("description", "")[:200],  # Truncate for context
                "tags": content.get("ai_tags", [])
            })
        return catalog
    
    def _parse_recommendations_response(self, response: str) -> List[Dict]:
        """Parse AI recommendations response"""
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Fallback parsing
                return []
        except Exception as e:
            print(f"Error parsing recommendations: {e}")
            return []
    
    def _parse_moderation_response(self, response: str) -> Dict[str, Any]:
        """Parse AI moderation response"""
        try:
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {"approved": True, "flags": [], "confidence": 0.5}
        except Exception as e:
            print(f"Error parsing moderation response: {e}")
            return {"approved": True, "flags": [], "confidence": 0.5}
    
    def _parse_metadata_response(self, response: str) -> Dict[str, Any]:
        """Parse AI metadata response"""
        try:
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {}
        except Exception as e:
            print(f"Error parsing metadata response: {e}")
            return {}
    
    def _parse_voice_command_response(self, response: str) -> Dict[str, Any]:
        """Parse AI voice command response"""
        try:
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {"action": "unknown", "parameters": {}, "confidence": 0.0}
        except Exception as e:
            print(f"Error parsing voice command response: {e}")
            return {"action": "error", "parameters": {}, "confidence": 0.0}
    
    def _parse_analysis_response(self, response: str) -> Dict[str, Any]:
        """Parse AI analysis response"""
        try:
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {}
        except Exception as e:
            print(f"Error parsing analysis response: {e}")
            return {}
    
    def _summarize_viewing_history(self, viewing_history: List[Dict]) -> Dict:
        """Summarize viewing history for AI analysis"""
        summary = {
            "total_sessions": len(viewing_history),
            "unique_content": len(set(item.get("content_id") for item in viewing_history)),
            "total_watch_time": sum(item.get("duration_watched", 0) for item in viewing_history),
            "devices_used": list(set(item.get("device_type") for item in viewing_history)),
            "quality_preferences": {},
            "completion_rates": []
        }
        
        for session in viewing_history:
            quality = session.get("quality")
            if quality:
                summary["quality_preferences"][quality] = summary["quality_preferences"].get(quality, 0) + 1
            
            if session.get("completed"):
                summary["completion_rates"].append(1.0)
            else:
                # Calculate completion percentage
                duration = session.get("duration_watched", 0)
                total_duration = session.get("total_duration", 0)
                if total_duration > 0:
                    summary["completion_rates"].append(duration / total_duration)
        
        return summary
    
    async def _generate_fallback_recommendations(self, user_id: str, content: List[Dict], limit: int) -> List[Dict]:
        """Generate basic recommendations without AI"""
        # Simple fallback based on popularity and ratings
        sorted_content = sorted(content, key=lambda x: (x.get("vote_average", 0), x.get("popularity", 0)), reverse=True)
        
        recommendations = []
        for i, item in enumerate(sorted_content[:limit]):
            recommendations.append({
                "content_id": item.get("id"),
                "score": max(70 - i * 2, 50),  # Decreasing score
                "reasoning": "Popular content recommendation",
                "type": "trending"
            })
        
        return recommendations
    
    async def _store_recommendations(self, user_id: str, recommendations: List[Dict]):
        """Store recommendations in database"""
        if self.db:
            try:
                for rec in recommendations:
                    rec_doc = {
                        "user_id": user_id,
                        "content_id": rec.get("content_id"),
                        "recommendation_type": rec.get("type", "ai_generated"),
                        "confidence_score": rec.get("score", 0) / 100.0,
                        "reasoning": rec.get("reasoning"),
                        "created_at": datetime.utcnow(),
                        "clicked": False,
                        "watched": False
                    }
                    await self.db.ai_recommendations.insert_one(rec_doc)
            except Exception as e:
                print(f"Error storing recommendations: {e}")
    
    def set_moderation_enabled(self, enabled: bool):
        """Enable or disable AI content moderation"""
        self.moderation_enabled = enabled
    
    async def generate_text(self, prompt: str) -> str:
        """General text generation method"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"general_{datetime.utcnow().timestamp()}",
                system_message="You are a helpful AI assistant."
            ).with_model("openai", "gpt-4o")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            return response
        except Exception as e:
            print(f"Error generating text: {e}")
            return "Unable to generate response."