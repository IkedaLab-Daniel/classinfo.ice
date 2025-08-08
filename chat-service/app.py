from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
import google.generativeai as genai
from datetime import datetime, timedelta, timezone, timezone
import threading
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print("GEMINI_API_KEY:", os.getenv('GEMINI_API_KEY'))

app = Flask(__name__)

# Configuration
NODE_API_URL = os.getenv('NODE_API_URL', 'https://your-node-service.onrender.com')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# Enable CORS for your Netlify frontend
CORS(app, origins=[
    "http://localhost:5173",  # Vite dev server  
    FRONTEND_URL,  # Dynamic frontend URL from environment
    "https://dailyclass.netlify.app",  # Your actual Netlify URL
    "https://*.netlify.app"  # Wildcard for any Netlify subdomain
])

print("OPENROUTER_API_KEY:", "***" + str(OPENROUTER_API_KEY)[-4:] if OPENROUTER_API_KEY else "Not set")
print("FRONTEND_URL:", FRONTEND_URL)

# Model configuration with fallback chain
MODEL_CHAIN = [
    {
        "provider": "openrouter",
        "model": "meta-llama/llama-3.1-8b-instruct:free",
        "name": "Llama 3.1 8B (Free)",
        "available": bool(OPENROUTER_API_KEY)
    },
    {
        "provider": "openrouter",
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "name": "DeepSeek V3 0324 (free)",
        "available": bool(OPENROUTER_API_KEY)
    },
    {
        "provider": "openrouter", 
        "model": "mistralai/mistral-7b-instruct:free",
        "name": "Mistral 7B (Free)",
        "available": bool(OPENROUTER_API_KEY)
    },
    {
        "provider": "gemini",
        "model": "gemini-1.5-flash",
        "name": "Gemini 1.5 Flash",
        "available": bool(GEMINI_API_KEY)
    }
]

# Filter available models
AVAILABLE_MODELS = [model for model in MODEL_CHAIN if model["available"]]
print(f"🚀 Available models: {[model['name'] for model in AVAILABLE_MODELS]}")

# OpenRouter API configuration
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# Initialize Gemini AI (as backup)
gemini_model = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    try:
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Gemini AI initialized as backup")
    except Exception as e:
        print(f"❌ Gemini AI initialization failed: {e}")

# OpenRouter API helper function
def call_openrouter_api(model, messages, max_tokens=1000):
    """Call OpenRouter API with the specified model"""
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:5002",  # Optional
            "X-Title": "Academic Schedule Assistant",   # Optional
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7
        }
        
        response = requests.post(OPENROUTER_BASE_URL, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        if 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']
        else:
            raise Exception(f"Unexpected response format: {result}")
            
    except Exception as e:
        raise Exception(f"OpenRouter API error: {e}")

# Test available models on startup
def test_models():
    """Test which models are actually working"""
    working_models = []
    test_messages = [{"role": "user", "content": "Hello, respond with just 'OK'"}]
    
    for model_config in AVAILABLE_MODELS:
        try:
            if model_config["provider"] == "openrouter":
                response = call_openrouter_api(model_config["model"], test_messages)
                working_models.append(model_config)
                print(f"✅ {model_config['name']} is working")
            elif model_config["provider"] == "gemini" and gemini_model:
                response = gemini_model.generate_content("Hello")
                working_models.append(model_config)
                print(f"✅ {model_config['name']} is working")
        except Exception as e:
            print(f"❌ {model_config['name']} failed test: {e}")
    
    return working_models

# Test models and update available list
print("🧪 Testing available models...")
WORKING_MODELS = test_models()
print(f"🚀 Working models: {[model['name'] for model in WORKING_MODELS]}")

if not WORKING_MODELS:
    print("⚠️ No AI models available - will use rule-based responses only")

# In-memory conversation storage (use Redis in production)
conversations = {}

# Global throttling state tracker
throttled_models = set()
last_throttle_check = datetime.now()

class ContextManager:
    """Handles context retrieval and processing"""
    
    @staticmethod
    def fetch_user_data():
        """Fetch schedules and tasks from Node.js API"""
        try:
            # Fetch schedules
            schedules_response = requests.get(f"{NODE_API_URL}/api/schedules", timeout=10)
            schedules = schedules_response.json().get('data', []) if schedules_response.status_code == 200 else []
            
            # Fetch tasks
            tasks_response = requests.get(f"{NODE_API_URL}/api/tasks", timeout=10)
            tasks = tasks_response.json().get('data', []) if tasks_response.status_code == 200 else []
            print(f"DEBUG - Fetched {len(tasks)} tasks from API")
            
            # Fetch announcements
            announcements_response = requests.get(f"{NODE_API_URL}/api/announcements", timeout=10)
            announcements = announcements_response.json().get('data', []) if announcements_response.status_code == 200 else []
            
            return {
                'schedules': schedules,
                'tasks': tasks,
                'announcements': announcements
            }
        except Exception as e:
            print(f"Error fetching data from Node.js API: {e}")
            return {'schedules': [], 'tasks': [], 'announcements': []}
    
    @staticmethod
    def find_relevant_context(message, data):
        """Find relevant schedules, tasks, and announcements based on the message"""
        message_lower = message.lower()
        relevant_context = []
        
        print(f"DEBUG - Processing message: '{message}' (lower: '{message_lower}')")
        print(f"DEBUG - Available data: {len(data['schedules'])} schedules, {len(data['tasks'])} tasks, {len(data['announcements'])} announcements")
        
        # Check if this is a specific content type query
        is_announcement_query = any(word in message_lower for word in ['announcement', 'announcements', 'news', 'update'])
        is_task_query = any(word in message_lower for word in ['task', 'tasks', 'assignment', 'assignments', 'homework', 'project', 'due'])
        is_schedule_query = any(word in message_lower for word in ['schedule', 'class', 'classes', 'subject', 'today'])
        
        print(f"DEBUG - Query type detection: announcement={is_announcement_query}, task={is_task_query}, schedule={is_schedule_query}")
        
        # If asking specifically for announcements, prioritize announcements
        if is_announcement_query and not is_task_query and not is_schedule_query:
            print("DEBUG - Detected specific announcement query - focusing on announcements only")
            announcement_matches = 0
            for announcement in data['announcements']:
                relevant_context.append({
                    'type': 'announcement',
                    'content': f"Announcement: {announcement.get('title')} - {announcement.get('description')}"
                })
                announcement_matches += 1
            
            print(f"DEBUG - Found {announcement_matches} announcements for specific query")
            limited_context = relevant_context[:10]
            print(f"DEBUG - Final context items after limit: {len(limited_context)}")
            for i, item in enumerate(limited_context):
                print(f"DEBUG - Context item {i+1}: {item['type']} - {item['content'][:100]}...")
            return limited_context
        
        # If asking specifically for tasks, prioritize tasks
        if is_task_query and not is_announcement_query and not is_schedule_query:
            print("DEBUG - Detected specific task query - focusing on tasks only")
            task_matches = 0
            for task in data['tasks']:
                due_date = task.get('dueDate', '')
                formatted_due_date = ChatService.format_date(due_date)
                
                relevant_context.append({
                    'type': 'task',
                    'content': f"Assignment: '{task.get('title')}' for {task.get('class')} - Type: {task.get('type')}, Priority: {task.get('priority')}, Status: {task.get('status')}, Due: {formatted_due_date}. Description: {task.get('description', '')[:100]}..."
                })
                task_matches += 1
            
            print(f"DEBUG - Found {task_matches} tasks for specific query")
            limited_context = relevant_context[:10]
            print(f"DEBUG - Final context items after limit: {len(limited_context)}")
            for i, item in enumerate(limited_context):
                print(f"DEBUG - Context item {i+1}: {item['type']} - {item['content'][:100]}...")
            return limited_context
        
        # Check schedules
        schedule_matches = 0
        today_query = any(word in message_lower for word in ['today', 'today?'])
        
        for schedule in data['schedules']:
            # Check if this is a date-specific query (like "today")
            if today_query:
                # Get today's date in UTC
                today_utc = datetime.now(timezone.utc).date()
                
                # Parse schedule date
                schedule_date_str = schedule.get('date', '')
                if schedule_date_str:
                    try:
                        # Parse ISO date string and convert to date
                        schedule_date = datetime.fromisoformat(schedule_date_str.replace('Z', '+00:00')).date()
                        
                        print(f"DEBUG - Schedule: {schedule.get('subject')} on {schedule_date}, Today: {today_utc}")
                        
                        # Only include if it's actually today
                        if schedule_date != today_utc:
                            continue
                            
                    except Exception as e:
                        print(f"DEBUG - Error parsing date {schedule_date_str}: {e}")
                        continue
            
            # Check if schedule matches query keywords
            if any(keyword in message_lower for keyword in [
                schedule.get('subject', '').lower(),
                schedule.get('room', '').lower(),
                schedule.get('day', '').lower(),
                'schedule', 'class', 'subject', 'today'
            ]):
                relevant_context.append({
                    'type': 'schedule',
                    'content': f"{schedule.get('subject')} class from {schedule.get('startTime')} to {schedule.get('endTime')} in room {schedule.get('room')}"
                })
                schedule_matches += 1
                print(f"DEBUG - Including schedule: {schedule.get('subject')} on {schedule.get('date', 'unknown date')}")
        
        print(f"DEBUG - Found {schedule_matches} relevant schedules")
        
        # Check tasks - prioritize tasks for assignment-related queries
        task_matches = 0
        
        for task in data['tasks']:
            # Print first task for debugging
            if task_matches == 0:
                print(f"DEBUG - Sample task: {task}")
            
            task_keywords = [
                task.get('title', '').lower(),
                task.get('class', '').lower(),
                task.get('type', '').lower(),
                'task', 'assignment', 'homework', 'project', 'due'
            ]
            
            if any(keyword in message_lower for keyword in task_keywords):
                due_date = task.get('dueDate', '')
                status = task.get('status', '')
                priority = task.get('priority', '')
                
                # Format the due date
                formatted_due_date = ChatService.format_date(due_date)
                
                relevant_context.append({
                    'type': 'task',
                    'content': f"Assignment: '{task.get('title')}' for {task.get('class')} - Type: {task.get('type')}, Priority: {priority}, Status: {status}, Due: {formatted_due_date}. Description: {task.get('description', '')[:100]}..."
                })
                task_matches += 1
                print(f"DEBUG - Found relevant task: {task.get('title')} for {task.get('class')}")
        
        print(f"DEBUG - Found {task_matches} relevant tasks")
        
        # Check announcements
        announcement_matches = 0
        for announcement in data['announcements']:
            if any(keyword in message_lower for keyword in [
                announcement.get('title', '').lower(),
                'announcement', 'news', 'update'
            ]):
                relevant_context.append({
                    'type': 'announcement',
                    'content': f"Announcement: {announcement.get('title')} - {announcement.get('description')}"
                })
                announcement_matches += 1
        
        print(f"DEBUG - Found {announcement_matches} relevant announcements")
        print(f"DEBUG - Total context items: {len(relevant_context)}")
        
        # For assignment queries, prioritize task context
        if is_task_query:
            # Sort so tasks come first
            relevant_context.sort(key=lambda x: 0 if x['type'] == 'task' else 1)
            print("DEBUG - Prioritizing task context for assignment query")
        
        limited_context = relevant_context[:10]
        print(f"DEBUG - Final context items after limit: {len(limited_context)}")
        for i, item in enumerate(limited_context):
            print(f"DEBUG - Context item {i+1}: {item['type']} - {item['content'][:100]}...")
        
        return limited_context  # Limit to 10 most relevant items

class ChatService:
    """Handles chat responses using AI or fallbacks"""
    
    @staticmethod
    def format_date(date_str):
        """Format ISO date string to user-friendly format"""
        if not date_str:
            return "No due date"
        
        try:
            # Parse ISO date string
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            
            # Format as "Sep 30, 2025 at 4:00 PM"
            formatted_date = date_obj.strftime("%b %d, %Y at %I:%M %p")
            
            # Calculate days from now using local dates for comparison
            now = datetime.now()
            days_diff = (date_obj.date() - now.date()).days
            
            if days_diff == 0:
                return f"{formatted_date} (Today)"
            elif days_diff == 1:
                return f"{formatted_date} (Tomorrow)"
            elif days_diff == -1:
                return f"{formatted_date} (Yesterday)"
            elif days_diff > 1:
                return f"{formatted_date} (in {days_diff} days)"
            else:
                return f"{formatted_date} ({abs(days_diff)} days overdue)"
                
        except Exception as e:
            print(f"Error formatting date {date_str}: {e}")
            return date_str  # Return original if parsing fails
    
    @staticmethod
    def generate_ai_response(message, context, conversation_history):
        """Generate response using multi-model fallback chain"""
        if not WORKING_MODELS:
            print("No AI models available, using rule-based fallback")
            return ChatService.generate_fallback_response(message, context), True
        
        # Build context string
        context_text = "\n".join([item['content'] for item in context])
        
        print(f"DEBUG - Context being sent to AI ({len(context)} items):")
        print(f"DEBUG - Context text (first 800 chars):\n{context_text[:800]}...")
        
        # Build conversation history
        history_text = ""
        if conversation_history:
            history_text = "\n".join([
                f"User: {msg['user']}\nAssistant: {msg['assistant']}"
                for msg in conversation_history[-3:]  # Last 3 exchanges
            ])

        # Get current date and time
        current_datetime = datetime.now()
        current_date = current_datetime.strftime("%A, %B %d, %Y")
        current_time = current_datetime.strftime("%I:%M %p")

        # Build prompt
        prompt_content = f"""
You are a Bee professional academic assistant for a student. You have access to their schedule, tasks, and announcements. Maintain a helpful, supportive, and informative tone.

Current Date and Time: {current_date} at {current_time}

Previous conversation:
{history_text}

Current relevant information:
{context_text}

User's current question: {message}

Instructions:
- Provide clear, accurate, and helpful information
- Use appropriate emojis sparingly for clarity and organization
- Today is {current_date}
- Use the provided schedule/task/announcement information when relevant
- For overdue tasks, provide gentle reminders and practical advice
- For upcoming classes or deadlines, offer helpful preparation suggestions
- Be encouraging and supportive in your responses
- Format times and dates clearly and professionally
- Calculate days remaining for deadlines accurately
- When referring to "today", use {current_date}
- Keep responses concise, organized, and actionable

Response:
"""

        print(f"DEBUG - Full prompt length: {len(prompt_content)} characters")
        
        # Try each model in the chain
        for model_config in WORKING_MODELS:
            try:
                print(f"🔄 Trying {model_config['name']}...")
                
                if model_config["provider"] == "openrouter":
                    messages = [{"role": "user", "content": prompt_content}]
                    response = call_openrouter_api(model_config["model"], messages, max_tokens=1500)
                    print(f"✅ {model_config['name']} response received: {len(response)} characters")
                    # Remove from throttled list if successful
                    throttled_models.discard(model_config['name'])
                    return response.strip(), False
                
                elif model_config["provider"] == "gemini" and gemini_model:
                    response = gemini_model.generate_content(prompt_content)
                    print(f"✅ {model_config['name']} response received: {len(response.text)} characters")
                    # Remove from throttled list if successful
                    throttled_models.discard(model_config['name'])
                    return response.text.strip(), False
                    
            except Exception as e:
                error_str = str(e)
                print(f"❌ {model_config['name']} error: {e}")
                
                # Check for throttling errors
                if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                    print(f"🚨 {model_config['name']} throttled - trying next model")
                    # Track this model as throttled
                    throttled_models.add(model_config['name'])
                    continue
                else:
                    print(f"💥 {model_config['name']} failed - trying next model")
                    continue
        
        # All AI models failed, use enhanced fallback
        print("🚨 All AI models failed or throttled - using enhanced fallback")
        # Mark all models as potentially throttled if they all failed
        for model in WORKING_MODELS:
            throttled_models.add(model['name'])
        return ChatService.generate_throttled_response(message, context), True
    
    @staticmethod
    def generate_throttled_response(message, context):
        """Generate response when AI service is throttled"""
        message_lower = message.lower()
        
        # Add throttling notice to the regular fallback response
        base_response = ChatService.generate_fallback_response(message, context)
        
        throttle_notice = "\n\n⚡ *Please note:* The AI service is currently experiencing high demand or has reached usage limits. I'm using my structured response system to provide you with the best information available."
        
        return base_response + throttle_notice
    
    @staticmethod
    def generate_fallback_response(message, context):
        """Generate rule-based fallback responses"""
        message_lower = message.lower()
        
        # Handle specific offline button requests with better formatting
        if 'show my schedules for this week' in message_lower or 'schedules for this week' in message_lower:
            return ChatService.format_weekly_schedule_response(context)
        
        elif 'show my tasks' in message_lower or 'show tasks' in message_lower:
            return ChatService.format_tasks_response(context)
        
        elif 'show announcements' in message_lower:
            return ChatService.format_announcements_response(context)
        
        # Original fallback logic for other messages
        if not context:
            if any(word in message_lower for word in ['schedule', 'class', 'subject']):
                return "I don't have specific schedule information matching your query. 📅 Could you try asking about a particular class, subject, or day? I'll do my best to help you find what you need."
            elif any(word in message_lower for word in ['task', 'assignment', 'homework', 'due']):
                return "I'd be happy to help you with your assignments and tasks! 📚 Could you provide more details about the specific subject or type of assignment you're asking about?"
            elif any(word in message_lower for word in ['announcement', 'news', 'update']):
                return "I can help you find announcements and updates. 📢 What type of announcements are you looking for? Academic notices, course updates, or general information?"
            else:
                return "Hello! I'm your academic assistant. 🎓 I can help you with your class schedule, assignments, tasks, and announcements. What would you like to know about today?"
        
        # Generate response based on context type
        schedule_count = len([c for c in context if c['type'] == 'schedule'])
        task_count = len([c for c in context if c['type'] == 'task'])
        announcement_count = len([c for c in context if c['type'] == 'announcement'])
        
        response_parts = []
        
        if schedule_count > 0:
            response_parts.append(f"📅 Found {schedule_count} schedule item{'s' if schedule_count > 1 else ''}:")
            for item in [c for c in context if c['type'] == 'schedule'][:3]:
                response_parts.append(f"• {item['content']}")
        
        if task_count > 0:
            response_parts.append(f"📋 Found {task_count} task{'s' if task_count > 1 else ''}:")
            for item in [c for c in context if c['type'] == 'task'][:3]:
                response_parts.append(f"• {item['content']}")
        
        if announcement_count > 0:
            response_parts.append(f"📢 Found {announcement_count} announcement{'s' if announcement_count > 1 else ''}:")
            for item in [c for c in context if c['type'] == 'announcement'][:2]:
                response_parts.append(f"• {item['content']}")
        
        return "\n\n".join(response_parts) if response_parts else "I'm here to help you stay organized with your academic schedule and assignments. What can I assist you with today? 🎓"
    
    @staticmethod
    def format_weekly_schedule_response(context):
        """Format weekly schedule response with day-by-day breakdown"""
        # Get fresh schedule data to properly organize by day
        try:
            user_data = ContextManager.fetch_user_data()
            raw_schedules = user_data.get('schedules', [])
        except Exception as e:
            print(f"Error fetching fresh schedule data: {e}")
            raw_schedules = []
        
        if not raw_schedules:
            return "📅 **Your Schedule This Week**\n\nNo scheduled classes found for this week. Your calendar is clear!"
        
        # Get current week date range
        today = datetime.now()
        # Find Monday of current week
        days_since_monday = today.weekday()  # Monday is 0
        monday = today - timedelta(days=days_since_monday)
        sunday = monday + timedelta(days=6)
        
        week_range = f"{monday.strftime('%B %d')} - {sunday.strftime('%B %d, %Y')}"
        
        response_parts = [f"📅 **Your Schedule This Week**"]
        response_parts.append(f"*Week of {week_range}*")
        response_parts.append("")
        
        # Group schedules by day
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        schedule_by_day = {day: [] for day in days_of_week}
        
        # Parse and organize schedules by day using actual schedule data
        for schedule in raw_schedules:
            # First try to use the 'day' field if available
            schedule_day = schedule.get('day', '').strip()
            
            # If no day field, try to extract from date
            if not schedule_day:
                schedule_date_str = schedule.get('date', '')
                if schedule_date_str:
                    try:
                        # Parse ISO date string and get day name
                        schedule_date = datetime.fromisoformat(schedule_date_str.replace('Z', '+00:00'))
                        schedule_day = schedule_date.strftime('%A')  # Gets day name like "Monday"
                    except Exception as e:
                        print(f"DEBUG - Error parsing date {schedule_date_str}: {e}")
                        continue
            
            # Normalize day name and find match
            day_found = False
            if schedule_day:
                # Handle different day formats (Mon, Monday, etc.)
                schedule_day_lower = schedule_day.lower()
                for day in days_of_week:
                    if (day.lower() == schedule_day_lower or 
                        day.lower().startswith(schedule_day_lower[:3]) or
                        schedule_day_lower.startswith(day.lower()[:3])):
                        
                        # Format the schedule entry
                        schedule_entry = f"{schedule.get('subject', 'Unknown Class')} class from {schedule.get('startTime', 'TBA')} to {schedule.get('endTime', 'TBA')} in room {schedule.get('room', 'TBA')}"
                        schedule_by_day[day].append(schedule_entry)
                        day_found = True
                        print(f"DEBUG - Assigned {schedule.get('subject')} to {day} (from '{schedule_day}')")
                        break
            
            if not day_found:
                print(f"DEBUG - Could not assign day for schedule: {schedule.get('subject')} (day field: '{schedule_day}')")
        
        # Display each day
        for day in days_of_week:
            if schedule_by_day[day]:
                response_parts.append(f"**{day}:**")
                for schedule in schedule_by_day[day]:
                    response_parts.append(f"  • {schedule}")
                response_parts.append("")
            else:
                response_parts.append(f"**{day}:** No classes scheduled")
                response_parts.append("")
        
        return "\n".join(response_parts).strip()
    
    @staticmethod
    def format_tasks_response(context):
        """Format tasks response showing up to 3 tasks with navigation hint"""
        # Get fresh task data to properly format dates
        try:
            user_data = ContextManager.fetch_user_data()
            raw_tasks = user_data.get('tasks', [])
        except Exception as e:
            print(f"Error fetching fresh task data: {e}")
            raw_tasks = []
        
        if not raw_tasks:
            return "📋 **Your Tasks**\n\nNo tasks found. You're all caught up! 🎉"
        
        response_parts = [f"📋 **Your Tasks** (Showing {min(3, len(raw_tasks))} of {len(raw_tasks)}):"]
        response_parts.append("")
        
        # Show up to 3 tasks with properly formatted layout
        for i, task in enumerate(raw_tasks[:3], 1):
            due_date = task.get('dueDate', '')
            formatted_due_date = ChatService.format_date(due_date)
            
            # Create a clean, multi-line format for each task
            task_title = task.get('title', 'Untitled')
            task_class = task.get('class', 'Unknown Class')
            task_type = task.get('type', 'N/A')
            task_priority = task.get('priority', 'N/A')
            task_status = task.get('status', 'N/A')
            
            response_parts.append(f"**{i}. {task_title}**")
            response_parts.append(f"   📚 **Class:** {task_class}")
            response_parts.append(f"   📝 **Type:** {task_type} | **Priority:** {task_priority} | **Status:** {task_status}")
            response_parts.append(f"   📅 **Due:** {formatted_due_date}")
            
            # Add description if available
            description = task.get('description', '')
            if description:
                # Truncate description and format nicely
                desc_text = description[:80] + ('...' if len(description) > 80 else '')
                response_parts.append(f"   💭 **Description:** {desc_text}")
            
            # Add spacing between tasks (except for the last one)
            if i < min(3, len(raw_tasks)):
                response_parts.append("")
        
        # Add navigation hint if there are more tasks
        if len(raw_tasks) > 3:
            response_parts.append("")
            response_parts.append(f"📋 *You have {len(raw_tasks) - 3} more tasks. Navigate to the **Tasks** section to see all your assignments.*")
        
        return "\n".join(response_parts)
    
    @staticmethod
    def format_announcements_response(context):
        """Format announcements response showing up to 3 announcements with navigation hint"""
        announcements = [c for c in context if c['type'] == 'announcement']
        
        if not announcements:
            return "📢 **Announcements**\n\nNo announcements at this time. Check back later!"
        
        response_parts = [f"📢 **Announcements** (Showing {min(3, len(announcements))} of {len(announcements)}):"]
        response_parts.append("")
        
        # Show up to 3 announcements
        for announcement in announcements[:3]:
            response_parts.append(f"• {announcement['content']}")
        
        # Add navigation hint if there are more announcements
        if len(announcements) > 3:
            response_parts.append("")
            response_parts.append(f"📢 *You have {len(announcements) - 3} more announcements. Navigate to the **Announcements** section to see all updates.*")
        
        return "\n".join(response_parts)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint with enhanced service state detection"""
    global last_throttle_check
    
    # Clear throttle status every 30 minutes to allow retry
    if datetime.now() - last_throttle_check > timedelta(minutes=30):
        throttled_models.clear()
        last_throttle_check = datetime.now()
    
    # Test basic service functionality (database connectivity)
    try:
        # Test if we can fetch data (core service functionality)
        test_data = ContextManager.fetch_user_data()
        service_functional = True
        service_error = None
    except Exception as e:
        service_functional = False
        service_error = str(e)
    
    # Determine available AI models
    available_models = [model for model in WORKING_MODELS if model['name'] not in throttled_models]
    
    # Determine service mode and status
    if not service_functional:
        # Core service is broken
        mode = 'error'
        status = 'unhealthy' 
        description = 'Service error - core functionality unavailable'
    elif len(available_models) > 0:
        # AI models available - full RAG capability
        mode = 'ai_enhanced'
        status = 'healthy'
        description = 'AI Enhanced - Full conversational responses with context retrieval'
    else:
        # No AI models but rule-based system works
        mode = 'smart_mode'
        status = 'healthy'
        description = 'Smart Mode - Structured responses with context retrieval'
    
    return jsonify({
        'status': status,
        'mode': mode,
        'description': description,
        'timestamp': datetime.now().isoformat(),
        'service': 'chat-service',
        'ai_available': len(available_models) > 0,
        'working_models': [model['name'] for model in available_models],
        'throttled_models': list(throttled_models),
        'service_functional': service_functional,
        'service_error': service_error
    })

@app.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        user_id = data.get('user_id', 'anonymous')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Check for generic greetings and respond as a bee character
        message_lower = message.lower().strip()
        generic_greetings = [
            'hi', 'hello', 'hey', 'hiya', 'yo', 'sup', 'wassup', 
            'good morning', 'good afternoon', 'good evening',
            'greetings', 'howdy', 'what\'s up', 'whats up'
        ]
        
        if message_lower in generic_greetings or any(greeting in message_lower for greeting in ['hi there', 'hello there']):
            # Get current time for time-based greeting
            current_hour = datetime.now().hour
            if 5 <= current_hour < 12:
                time_greeting = "Good morning"
            elif 12 <= current_hour < 17:
                time_greeting = "Good afternoon"
            elif 17 <= current_hour < 21:
                time_greeting = "Good evening"
            else:
                time_greeting = "Hello"
                
            bee_response = f"{time_greeting}! 🐝 *Buzz buzz!* I'm HunniBee, your busy little academic assistant! I've been buzzing around collecting all the sweet information about your classes, tasks, and announcements.\n\nI'm here to help you stay organized and make your academic life as smooth as honey! 🍯 What can I help you with today? Need to know about:\n\n• 📅 Your class schedule\n• 📚 Upcoming assignments and tasks\n• 📢 Important announcements\n\nJust ask away, and I'll bee right on it! 🐝✨"
            
            # Store conversation
            if user_id not in conversations:
                conversations[user_id] = []
            
            conversations[user_id].append({
                'user': message,
                'assistant': bee_response,
                'timestamp': datetime.now().isoformat(),
                'context_used': 0
            })
            
            return jsonify({
                'response': bee_response,
                'context_items_used': 0,
                'ai_powered': False,
                'is_throttled': False,
                'model_used': 'Bee Character Response',
                'timestamp': datetime.now().isoformat()
            })
        
        # Get conversation history
        conversation_history = conversations.get(user_id, [])
        
        # Fetch user data from Node.js API
        user_data = ContextManager.fetch_user_data()
        
        # Find relevant context
        context = ContextManager.find_relevant_context(message, user_data)
        
        # Generate response
        response_result = ChatService.generate_ai_response(message, context, conversation_history)
        
        # Handle tuple return (response, is_fallback) or just response string
        if isinstance(response_result, tuple):
            response, is_fallback = response_result
        else:
            response, is_fallback = response_result, False
        
        # Check available models for metadata
        available_models = [model for model in WORKING_MODELS if model['name'] not in throttled_models]
        
        # Store conversation
        if user_id not in conversations:
            conversations[user_id] = []
        
        conversations[user_id].append({
            'user': message,
            'assistant': response,
            'timestamp': datetime.now().isoformat(),
            'context_used': len(context)
        })
        
        # Keep only last 10 exchanges per user
        if len(conversations[user_id]) > 10:
            conversations[user_id] = conversations[user_id][-10:]
        
        return jsonify({
            'response': response,
            'context_items_used': len(context),
            'ai_powered': len(available_models) > 0 and not is_fallback,
            'is_throttled': is_fallback and len(WORKING_MODELS) > 0,
            'model_used': available_models[0]['name'] if available_models and not is_fallback else 'Rule-based',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            'response': "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
            'error': True
        }), 500

@app.route('/chat/history/<user_id>', methods=['GET'])
def get_chat_history(user_id):
    """Get chat history for a user"""
    history = conversations.get(user_id, [])
    return jsonify({
        'history': history[-10:],  # Last 10 exchanges
        'count': len(history)
    })

@app.route('/chat/clear/<user_id>', methods=['POST'])
def clear_chat_history(user_id):
    """Clear chat history for a user"""
    if user_id in conversations:
        del conversations[user_id]
    return jsonify({'message': 'Chat history cleared'})

def keep_alive():
    """Keep the service alive by self-pinging every 14 minutes"""
    while True:
        try:
            time.sleep(840)  # 14 minutes
            requests.get(f"{os.getenv('RENDER_EXTERNAL_URL', 'http://localhost:5002')}/health", timeout=10)
            print(f"Keep-alive ping at {datetime.now()}")
        except Exception as e:
            print(f"Keep-alive error: {e}")

if __name__ == '__main__':
    # Start keep-alive thread in production
    if os.getenv('RENDER_EXTERNAL_URL'):
        threading.Thread(target=keep_alive, daemon=True).start()
    
    port = int(os.getenv('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
