from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
import google.generativeai as genai
from datetime import datetime, timedelta, timezone
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

# Model configuration with fallback chain - Updated with more reliable models
MODEL_CHAIN = [
    {
        "provider": "openrouter", 
        "model": "mistralai/mistral-7b-instruct:free",
        "name": "Mistral 7B (Free)",
        "available": bool(OPENROUTER_API_KEY)
    },
    {
        "provider": "openrouter",
        "model": "huggingface/meta-llama/llama-3.2-3b-instruct:free",
        "name": "Llama 3.2 3B (Free)",
        "available": bool(OPENROUTER_API_KEY)
    },
    {
        "provider": "openrouter",
        "model": "microsoft/phi-3-mini-128k-instruct:free",
        "name": "Phi-3 Mini (Free)",
        "available": bool(OPENROUTER_API_KEY)
    },
    {
        "provider": "openrouter",
        "model": "qwen/qwen-2-7b-instruct:free",
        "name": "Qwen 2 7B (Free)",
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
def call_openrouter_api(model, messages, max_tokens=1000, temperature=0.7):
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
            "temperature": temperature
        }
        
        response = requests.post(OPENROUTER_BASE_URL, headers=headers, json=data, timeout=30)
        
        # Handle different HTTP status codes
        if response.status_code == 404:
            raise Exception(f"Model '{model}' not found (404). Model may be discontinued or moved.")
        elif response.status_code == 429:
            raise Exception(f"Rate limit exceeded (429). Please wait before retrying.")
        elif response.status_code == 524:
            raise Exception(f"Provider timeout (524). Upstream service unavailable.")
        elif response.status_code >= 500:
            raise Exception(f"Server error ({response.status_code}). Provider service issue.")
        
        response.raise_for_status()
        
        result = response.json()
        
        # Check for API-level errors in the response
        if 'error' in result:
            error_info = result['error']
            error_code = error_info.get('code', 'unknown')
            error_message = error_info.get('message', 'Unknown error')
            
            if error_code == 524:
                raise Exception(f"Provider timeout (524): {error_message}")
            elif error_code == 429:
                raise Exception(f"Rate limit (429): {error_message}")
            elif error_code == 404:
                raise Exception(f"Model not found (404): {error_message}")
            else:
                raise Exception(f"API error ({error_code}): {error_message}")
        
        if 'choices' in result and len(result['choices']) > 0:
            return result['choices'][0]['message']['content']
        else:
            raise Exception(f"Unexpected response format: {result}")
            
    except requests.exceptions.Timeout:
        raise Exception(f"Request timeout for model '{model}'. Try again later.")
    except requests.exceptions.ConnectionError:
        raise Exception(f"Connection error to OpenRouter API. Check your internet connection.")
    except Exception as e:
        # Re-raise our custom exceptions
        if "Model" in str(e) and "not found" in str(e):
            raise e
        elif "timeout" in str(e).lower():
            raise e
        elif "rate limit" in str(e).lower():
            raise e
        else:
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
        is_schedule_query = any(word in message_lower for word in ['schedule', 'class', 'classes', 'subject', 'today', 'tomorrow'])
        
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
        tomorrow_query = any(word in message_lower for word in ['tomorrow', 'tomorrow?'])
        
        # Detect if this is a casual follow-up question (less strict filtering)
        is_casual_followup = any(phrase in message_lower for phrase in ['how about', 'what about', 'and tomorrow', 'for tomorrow'])
        
        for schedule in data['schedules']:
            should_include = False
            
            # Check if this is a date-specific query (like "today" or "tomorrow")
            if (today_query or tomorrow_query) and not is_casual_followup:
                # Apply strict date filtering only for direct date queries, not casual follow-ups
                # Get today's date in proper timezone (Philippines UTC+8)
                def get_user_timezone():
                    """Get current time in appropriate timezone based on user location"""
                    utc_now = datetime.now(timezone.utc)
                    
                    # Default to Philippines timezone (UTC+8) since users are experiencing issues there
                    # Philippines doesn't observe DST, so it's consistently UTC+8
                    philippines_offset = timedelta(hours=8)
                    philippines_time = utc_now.replace(tzinfo=timezone.utc).astimezone(timezone(philippines_offset))
                    
                    return philippines_time
                
                user_tz_now = get_user_timezone()
                today_user_tz = user_tz_now.date()
                
                if tomorrow_query:
                    # Get tomorrow's date
                    target_date = today_user_tz + timedelta(days=1)
                    query_type = "tomorrow"
                else:
                    # Get today's date
                    target_date = today_user_tz
                    query_type = "today"
                
                # Parse schedule date
                schedule_date_str = schedule.get('date', '')
                if schedule_date_str:
                    try:
                        # Parse ISO date string and convert to date
                        schedule_date = datetime.fromisoformat(schedule_date_str.replace('Z', '+00:00')).date()
                        
                        print(f"DEBUG - Schedule: {schedule.get('subject')} on {schedule_date}, Target ({query_type}): {target_date}")
                        
                        # Only include if it matches the target date
                        if schedule_date == target_date:
                            should_include = True
                            print(f"DEBUG - Including schedule for {query_type}: {schedule.get('subject')}")
                        else:
                            print(f"DEBUG - Excluding schedule (not {query_type}): {schedule.get('subject')} on {schedule_date}")
                            
                    except Exception as e:
                        print(f"DEBUG - Error parsing date {schedule_date_str}: {e}")
                        continue
            else:
                # For casual follow-ups or general queries, use keyword matching
                if any(keyword in message_lower for keyword in [
                    schedule.get('subject', '').lower(),
                    schedule.get('room', '').lower(),
                    schedule.get('day', '').lower(),
                    'schedule', 'class', 'subject', 'today', 'tomorrow'
                ]):
                    should_include = True
                    print(f"DEBUG - Including schedule via keyword match: {schedule.get('subject')}")
            
            # Include the schedule if it meets our criteria
            if should_include:
                # Format times for better display
                start_time = ChatService.format_time(schedule.get('startTime', 'TBA'))
                end_time = ChatService.format_time(schedule.get('endTime', 'TBA'))
                
                # Include date information in the context
                schedule_date_str = schedule.get('date', '')
                if schedule_date_str:
                    try:
                        # Parse and format the date for better readability
                        schedule_date = datetime.fromisoformat(schedule_date_str.replace('Z', '+00:00'))
                        formatted_date = schedule_date.strftime('%A, %B %d, %Y')
                        content_with_date = f"{schedule.get('subject')} class on {formatted_date} from {start_time} to {end_time} in room {schedule.get('room')}"
                    except Exception as e:
                        # Fallback if date parsing fails
                        content_with_date = f"{schedule.get('subject')} class from {start_time} to {end_time} in room {schedule.get('room')} (date: {schedule_date_str})"
                else:
                    content_with_date = f"{schedule.get('subject')} class from {start_time} to {end_time} in room {schedule.get('room')} (no date specified)"
                
                relevant_context.append({
                    'type': 'schedule',
                    'content': content_with_date
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
        
        # Special handling for "today" or "tomorrow" queries with no results
        if (today_query or tomorrow_query) and not relevant_context:
            if tomorrow_query:
                tomorrow_date = (datetime.now() + timedelta(days=1)).strftime('%A, %B %d, %Y')
                print("DEBUG - Tomorrow query with no results - adding explicit 'no classes tomorrow' context")
                relevant_context.append({
                    'type': 'schedule',
                    'content': f"No classes scheduled for tomorrow ({tomorrow_date})"
                })
            else:
                today_date = datetime.now().strftime('%A, %B %d, %Y')
                print("DEBUG - Today query with no results - adding explicit 'no classes today' context")
                relevant_context.append({
                    'type': 'schedule',
                    'content': f"No classes scheduled for today ({today_date})"
                })
        
        # For assignment queries, prioritize task context
        if is_task_query:
            # Sort so tasks come first
            relevant_context.sort(key=lambda x: 0 if x['type'] == 'task' else 1)
            print("DEBUG - Prioritizing task context for assignment query")
        
        limited_context = relevant_context[:15]
        print(f"DEBUG - Final context items after limit: {len(limited_context)}")
        for i, item in enumerate(limited_context):
            print(f"DEBUG - Context item {i+1}: {item['type']} - {item['content'][:100]}...")
        
        return limited_context  # Limit to 15 most relevant items

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
    def format_time(time_str):
        """Format time string from 24-hour to 12-hour AM/PM format"""
        if not time_str or time_str == 'TBA':
            return 'TBA'
        
        try:
            # Parse time string (assuming format like "14:30" or "14:30:00")
            if ':' in time_str:
                time_parts = time_str.split(':')
                hour = int(time_parts[0])
                minute = int(time_parts[1])
                
                # Convert to 12-hour format
                if hour == 0:
                    formatted_time = f"12:{minute:02d}AM"
                elif hour < 12:
                    formatted_time = f"{hour}:{minute:02d}AM"
                elif hour == 12:
                    formatted_time = f"12:{minute:02d}PM"
                else:
                    formatted_time = f"{hour - 12}:{minute:02d}PM"
                
                return formatted_time
            else:
                return time_str  # Return original if not in expected format
                
        except Exception as e:
            print(f"Error formatting time {time_str}: {e}")
            return time_str  # Return original if parsing fails
    
    @staticmethod
    def generate_ai_response(message, context, conversation_history):
        """Generate response using multi-model fallback chain"""
        if not WORKING_MODELS:
            print("No AI models available, using rule-based fallback")
            return ChatService.generate_fallback_response(message, context), True
        
        # Build context string with clear structure
        if not context:
            context_text = "NO DATA AVAILABLE - The student has no schedules, tasks, or announcements in the database for this query."
        else:
            context_sections = []
            
            # Group context by type
            schedules = [c for c in context if c['type'] == 'schedule']
            tasks = [c for c in context if c['type'] == 'task']
            announcements = [c for c in context if c['type'] == 'announcement']
            
            if schedules:
                context_sections.append(f"SCHEDULES ({len(schedules)} found):")
                for i, schedule in enumerate(schedules, 1):
                    context_sections.append(f"{i}. {schedule['content']}")
            
            if tasks:
                context_sections.append(f"\nTASKS ({len(tasks)} found):")
                for i, task in enumerate(tasks, 1):
                    context_sections.append(f"{i}. {task['content']}")
            
            if announcements:
                context_sections.append(f"\nANNOUNCEMENTS ({len(announcements)} found):")
                for i, announcement in enumerate(announcements, 1):
                    context_sections.append(f"{i}. {announcement['content']}")
            
            context_text = "\n".join(context_sections)
        
        print(f"DEBUG - Context being sent to AI ({len(context)} items):")
        print(f"DEBUG - Context text (first 800 chars):\n{context_text[:800]}...")
        
        # Build conversation history
        history_text = ""
        if conversation_history:
            history_text = "\n".join([
                f"User: {msg['user']}\nAssistant: {msg['assistant']}"
                for msg in conversation_history[-3:]  # Last 3 exchanges
            ])

        # Get current date and time in appropriate timezone (Philippines UTC+8 or Eastern Time)
        def get_user_timezone():
            """Get current time in appropriate timezone based on user location"""
            utc_now = datetime.now(timezone.utc)
            
            # Default to Philippines timezone (UTC+8) since users are experiencing issues there
            # Philippines doesn't observe DST, so it's consistently UTC+8
            philippines_offset = timedelta(hours=8)
            philippines_time = utc_now.replace(tzinfo=timezone.utc).astimezone(timezone(philippines_offset))
            
            # For now, prioritize Philippines time since that's where the issue is occurring
            # In the future, this could be made configurable per user
            return philippines_time
        
        current_datetime = get_user_timezone()
        current_date = current_datetime.strftime("%A, %B %d, %Y")
        current_time = current_datetime.strftime("%I:%M %p")
        timezone_info = "PHT"  # Philippines Time (UTC+8)

        # Build prompt
        prompt_content = f"""
You are HunniBee, a friendly and helpful academic assistant for a student. You can have normal conversations while also helping with academic information.

Current Date and Time: {current_date} at {current_time} {timezone_info}

Previous conversation:
{history_text}

AVAILABLE ACADEMIC DATA:
{context_text}

User's current question: {message}

INSTRUCTIONS:
- You can engage in normal, friendly conversation about any topic
- For ACADEMIC QUERIES (schedules, tasks, assignments, announcements): Use information from the "AVAILABLE ACADEMIC DATA" section above
- The academic data includes complete information with dates, times, and locations - use this information to answer questions
- For academic data, be accurate and don't invent schedules, tasks, or announcements not listed
- When answering follow-up questions like "how about tomorrow?" or "what about next class?", look through ALL the academic data provided to find relevant information
- If you see schedule data in the available academic data, you can discuss it and identify which schedules are for today, tomorrow, or other specific dates
- For general questions, study tips, motivation, or casual conversation: Respond naturally and helpfully
- Use a friendly, encouraging tone with appropriate emojis
- Today is {current_date}
- Keep responses engaging and helpful

Response:
"""

        print(f"DEBUG - Full prompt length: {len(prompt_content)} characters")
        
        # Try each model in the chain
        for model_config in WORKING_MODELS:
            try:
                print(f"🔄 Trying {model_config['name']}...")
                
                if model_config["provider"] == "openrouter":
                    messages = [
                        {
                            "role": "system", 
                            "content": "You are HunniBee, a friendly academic assistant. You can have normal conversations and help with general questions. For academic data (schedules, tasks, announcements), only use provided information and don't invent details."
                        },
                        {
                            "role": "user", 
                            "content": prompt_content
                        }
                    ]
                    response = call_openrouter_api(model_config["model"], messages, max_tokens=1500, temperature=0.3)
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
        
        # For Smart Mode button requests, don't add throttle notice - just return clean response
        if ('show my schedules for this week' in message_lower or 
            'show my tasks' in message_lower or 
            'show announcements' in message_lower):
            return ChatService.generate_fallback_response(message, context)
        
        # Add throttling notice to other responses
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
        
        elif 'show my schedules for next week' in message_lower or 'schedules for next week' in message_lower:
            return ChatService.format_next_week_schedule_response(context)
        
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
        """Format weekly schedule response with day-by-day breakdown for CURRENT WEEK ONLY"""
        # Get fresh schedule data to properly organize by day
        try:
            user_data = ContextManager.fetch_user_data()
            raw_schedules = user_data.get('schedules', [])
        except Exception as e:
            print(f"Error fetching fresh schedule data: {e}")
            raw_schedules = []
        
        # Get current week date range using appropriate timezone (Philippines UTC+8)
        def get_user_timezone():
            """Get current time in appropriate timezone based on user location"""
            utc_now = datetime.now(timezone.utc)
            
            # Default to Philippines timezone (UTC+8) since users are experiencing issues there
            # Philippines doesn't observe DST, so it's consistently UTC+8
            philippines_offset = timedelta(hours=8)
            philippines_time = utc_now.replace(tzinfo=timezone.utc).astimezone(timezone(philippines_offset))
            
            return philippines_time
        
        today = get_user_timezone()
        
        # Find Monday of current week
        days_since_monday = today.weekday()  # Monday is 0
        monday = today - timedelta(days=days_since_monday)
        sunday = monday + timedelta(days=6)
        
        week_range = f"{monday.strftime('%B %d')} - {sunday.strftime('%B %d, %Y')}"
        print(f"DEBUG - Current week range: {monday.date()} to {sunday.date()}")
        
        # Filter schedules to only include those from the current week
        current_week_schedules = []
        for schedule in raw_schedules:
            schedule_date_str = schedule.get('date', '')
            if schedule_date_str:
                try:
                    # Parse ISO date string and convert to date
                    schedule_date = datetime.fromisoformat(schedule_date_str.replace('Z', '+00:00')).date()
                    
                    # Check if this schedule falls within the current week
                    if monday.date() <= schedule_date <= sunday.date():
                        current_week_schedules.append(schedule)
                        print(f"DEBUG - Including schedule: {schedule.get('subject')} on {schedule_date} (current week)")
                    else:
                        print(f"DEBUG - Excluding schedule: {schedule.get('subject')} on {schedule_date} (not current week)")
                        
                except Exception as e:
                    print(f"DEBUG - Error parsing schedule date {schedule_date_str}: {e}")
                    # If we can't parse the date, try to match by day name as fallback
                    schedule_day = schedule.get('day', '').strip()
                    if schedule_day:
                        print(f"DEBUG - Fallback: trying to match by day name '{schedule_day}' for {schedule.get('subject')}")
                        # Only include if we can't determine the date, but this is risky
                        # Better to exclude uncertain schedules for weekly view
        
        print(f"DEBUG - Found {len(current_week_schedules)} schedules for current week out of {len(raw_schedules)} total")
        
        response_parts = [f"📅 **Your Schedule This Week**"]
        response_parts.append(f"*Week of {week_range}*")
        response_parts.append("")
        
        # Group schedules by day for the current week
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        schedule_by_day = {day: [] for day in days_of_week}
        
        # Organize current week schedules by day
        for schedule in current_week_schedules:
            schedule_date_str = schedule.get('date', '')
            if schedule_date_str:
                try:
                    # Parse ISO date string and get day name
                    schedule_date = datetime.fromisoformat(schedule_date_str.replace('Z', '+00:00'))
                    schedule_day = schedule_date.strftime('%A')  # Gets day name like "Monday"
                    
                    # Format times for better display
                    start_time = ChatService.format_time(schedule.get('startTime', 'TBA'))
                    end_time = ChatService.format_time(schedule.get('endTime', 'TBA'))
                    
                    # Format the schedule entry
                    schedule_entry = f"{schedule.get('subject', 'Unknown Class')} from {start_time} to {end_time} in room {schedule.get('room', 'TBA')}"
                    schedule_by_day[schedule_day].append(schedule_entry)
                    print(f"DEBUG - Assigned {schedule.get('subject')} to {schedule_day}")
                    
                except Exception as e:
                    print(f"DEBUG - Error processing schedule date {schedule_date_str}: {e}")
        
        # Display each day - show "No classes scheduled" for empty days
        for day in days_of_week:
            if schedule_by_day[day]:
                response_parts.append(f"**{day}:**")
                for schedule in schedule_by_day[day]:
                    response_parts.append(f"  • {schedule}")
                response_parts.append("")
            else:
                response_parts.append(f"**{day}:** No classes scheduled")
                response_parts.append("")
        
        # If no schedules found for the entire week, add a helpful note
        if not current_week_schedules:
            response_parts.append("🎉 **You have a free week!** No classes scheduled for this week.")
            response_parts.append("")
            response_parts.append("💡 *Tip: Use this time to catch up on assignments or prepare for upcoming classes.*")
        
        return "\n".join(response_parts).strip()
    
    @staticmethod
    def format_next_week_schedule_response(context):
        """Format next week schedule response with day-by-day breakdown for NEXT WEEK ONLY"""
        # Get fresh schedule data to properly organize by day
        try:
            user_data = ContextManager.fetch_user_data()
            raw_schedules = user_data.get('schedules', [])
        except Exception as e:
            print(f"Error fetching fresh schedule data: {e}")
            raw_schedules = []
        
        # Get next week date range using appropriate timezone (Philippines UTC+8)
        def get_user_timezone():
            """Get current time in appropriate timezone based on user location"""
            utc_now = datetime.now(timezone.utc)
            
            # Default to Philippines timezone (UTC+8) since users are experiencing issues there
            # Philippines doesn't observe DST, so it's consistently UTC+8
            philippines_offset = timedelta(hours=8)
            philippines_time = utc_now.replace(tzinfo=timezone.utc).astimezone(timezone(philippines_offset))
            
            return philippines_time
        
        today = get_user_timezone()
        
        # Find Monday of current week, then add 7 days for next week
        days_since_monday = today.weekday()  # Monday is 0
        current_monday = today - timedelta(days=days_since_monday)
        next_monday = current_monday + timedelta(days=7)
        next_sunday = next_monday + timedelta(days=6)
        
        week_range = f"{next_monday.strftime('%B %d')} - {next_sunday.strftime('%B %d, %Y')}"
        print(f"DEBUG - Next week range: {next_monday.date()} to {next_sunday.date()}")
        
        # Filter schedules to only include those from next week
        next_week_schedules = []
        for schedule in raw_schedules:
            schedule_date_str = schedule.get('date', '')
            if schedule_date_str:
                try:
                    # Parse ISO date string and convert to date
                    schedule_date = datetime.fromisoformat(schedule_date_str.replace('Z', '+00:00')).date()
                    
                    # Check if this schedule falls within next week
                    if next_monday.date() <= schedule_date <= next_sunday.date():
                        next_week_schedules.append(schedule)
                        print(f"DEBUG - Including schedule: {schedule.get('subject')} on {schedule_date} (next week)")
                    else:
                        print(f"DEBUG - Excluding schedule: {schedule.get('subject')} on {schedule_date} (not next week)")
                        
                except Exception as e:
                    print(f"DEBUG - Error parsing schedule date {schedule_date_str}: {e}")
        
        print(f"DEBUG - Found {len(next_week_schedules)} schedules for next week out of {len(raw_schedules)} total")
        
        response_parts = [f"📅 **Your Schedule Next Week**"]
        response_parts.append(f"*Week of {week_range}*")
        response_parts.append("")
        
        # Group schedules by day for next week
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        schedule_by_day = {day: [] for day in days_of_week}
        
        # Organize next week schedules by day
        for schedule in next_week_schedules:
            schedule_date_str = schedule.get('date', '')
            if schedule_date_str:
                try:
                    # Parse ISO date string and get day name
                    schedule_date = datetime.fromisoformat(schedule_date_str.replace('Z', '+00:00'))
                    schedule_day = schedule_date.strftime('%A')  # Gets day name like "Monday"
                    
                    # Format times for better display
                    start_time = ChatService.format_time(schedule.get('startTime', 'TBA'))
                    end_time = ChatService.format_time(schedule.get('endTime', 'TBA'))
                    
                    # Format the schedule entry
                    schedule_entry = f"{schedule.get('subject', 'Unknown Class')} from {start_time} to {end_time} in room {schedule.get('room', 'TBA')}"
                    schedule_by_day[schedule_day].append(schedule_entry)
                    print(f"DEBUG - Assigned {schedule.get('subject')} to {schedule_day}")
                    
                except Exception as e:
                    print(f"DEBUG - Error processing schedule date {schedule_date_str}: {e}")
        
        # Display each day - show "No classes scheduled" for empty days
        for day in days_of_week:
            if schedule_by_day[day]:
                response_parts.append(f"**{day}:**")
                for schedule in schedule_by_day[day]:
                    response_parts.append(f"  • {schedule}")
                response_parts.append("")
            else:
                response_parts.append(f"**{day}:** No classes scheduled")
                response_parts.append("")
        
        # If no schedules found for the entire week, add a helpful note
        if not next_week_schedules:
            response_parts.append("🎉 **You have a free week ahead!** No classes scheduled for next week.")
            response_parts.append("")
            response_parts.append("💡 *Tip: Perfect time to plan ahead or work on long-term projects.*")
        
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
    """Health check endpoint"""
    global last_throttle_check
    
    # Test basic service functionality (database connectivity)
    try:
        # Test if we can fetch data (core service functionality)
        test_data = ContextManager.fetch_user_data()
        service_functional = True
        service_error = None
    except Exception as e:
        service_functional = False
        service_error = str(e)
    
    # Check available models (not forced anymore)
    available_models = [model for model in WORKING_MODELS if model['name'] not in throttled_models]
    
    # Determine service mode and status
    if not service_functional:
        # Core service is broken
        mode = 'error'
        status = 'unhealthy' 
        description = 'Service error - core functionality unavailable'
    elif len(available_models) > 0:
        # AI Enhanced mode - we have working AI models
        mode = 'ai_enhanced'
        status = 'healthy'
        description = 'AI Enhanced - Full AI capabilities with context retrieval'
    else:
        # Smart Mode - no AI available, use structured responses
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
        
        # Use AI when available, fall back to Smart Mode when needed
        available_models = [model for model in WORKING_MODELS if model['name'] not in throttled_models]
        
        if available_models:
            # Try AI first
            response, is_fallback = ChatService.generate_ai_response(message, context, conversation_history)
        else:
            # Use Smart Mode fallback
            response = ChatService.generate_fallback_response(message, context)
            is_fallback = True
        
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
        
        # Determine if this is a Smart Mode button action for navigation
        navigation_action = None
        navigation_actions = []  # Support multiple navigation actions
        message_lower = message.lower().strip()
        if ('show my schedules for this week' in message_lower or 
            'schedules for this week' in message_lower):
            # For current week schedule, provide both "View Full Schedule" and "See Next Week" actions
            navigation_actions = [
                {
                    'type': 'navigate',
                    'action': 'schedule',
                    'label': '📅 View Full Schedule',
                    'url': '/#weekly'
                },
                {
                    'type': 'chat_action',
                    'action': 'next_week_schedule',
                    'label': '📆 See Next Week',
                    'message': 'Show my schedules for next week'
                }
            ]
            # Keep single navigation_action for backward compatibility
            navigation_action = navigation_actions[0]
        elif ('show my schedules for next week' in message_lower or 
              'schedules for next week' in message_lower):
            navigation_action = {
                'type': 'navigate',
                'action': 'next_week_schedule',
                'label': '📅 View Full Schedule',
                'url': '/#weekly'
            }
        elif ('show my tasks' in message_lower or 'show tasks' in message_lower):
            navigation_action = {
                'type': 'navigate',
                'action': 'tasks',
                'label': '📚 View All Tasks',
                'url': '/#tasks' 
            }
        elif 'show announcements' in message_lower:
            navigation_action = {
                'type': 'navigate',
                'action': 'announcements',
                'label': '📢 View All Announcements',
                'url': '/#announcements'  # Changed from /#dashboard to /#announcements
            }
        
        return jsonify({
            'response': response,
            'context_items_used': len(context),
            'ai_powered': len(available_models) > 0 and not is_fallback,
            'is_throttled': is_fallback and len(WORKING_MODELS) > 0,
            'model_used': available_models[0]['name'] if available_models and not is_fallback else 'Rule-based',
            'timestamp': datetime.now().isoformat(),
            'navigation_action': navigation_action,
            'navigation_actions': navigation_actions if navigation_actions else None
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
