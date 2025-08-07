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
        assignment_query = any(word in message_lower for word in ['task', 'assignment', 'homework', 'project', 'due'])
        
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
                
                relevant_context.append({
                    'type': 'task',
                    'content': f"Assignment: '{task.get('title')}' for {task.get('class')} - Type: {task.get('type')}, Priority: {priority}, Status: {status}, Due: {due_date}. Description: {task.get('description', '')[:100]}..."
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
        if assignment_query:
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
    def generate_ai_response(message, context, conversation_history):
        """Generate response using multi-model fallback chain"""
        if not WORKING_MODELS:
            print("No AI models available, using rule-based fallback")
            return ChatService.generate_fallback_response(message, context)
        
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
You are a helpful and hilariously witty academic schedule assistant for a student. You have access to their schedule, tasks, and announcements. Your personality is like a friendly, slightly sarcastic best friend who loves to make jokes while still being genuinely helpful.

Current Date and Time: {current_date} at {current_time}

Previous conversation:
{history_text}

Current relevant information:
{context_text}

User's current question: {message}

Instructions:
- Reponse in Filipino language
- Be funny and entertaining while still being helpful
- Use humor, wit, and playful sarcasm appropriately
- Make jokes about procrastination, student life, deadlines, etc.
- Add emojis and casual language to make it fun
- Today is {current_date}
- Use the provided schedule/task/announcement information when relevant
- When tasks are overdue, make gentle jokes about procrastination
- When classes are coming up, add encouraging or funny comments
- Be supportive but in a humorous way
- Format times and dates clearly
- Calculate days remaining for deadlines and make it dramatic/funny
- When referring to "today", use {current_date}
- Keep responses concise but entertaining
- Use double (*) for bold: **bold**

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
                    return response.strip()
                
                elif model_config["provider"] == "gemini" and gemini_model:
                    response = gemini_model.generate_content(prompt_content)
                    print(f"✅ {model_config['name']} response received: {len(response.text)} characters")
                    return response.text.strip()
                    
            except Exception as e:
                error_str = str(e)
                print(f"❌ {model_config['name']} error: {e}")
                
                # Check for throttling errors
                if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                    print(f"🚨 {model_config['name']} throttled - trying next model")
                    continue
                else:
                    print(f"💥 {model_config['name']} failed - trying next model")
                    continue
        
        # All AI models failed, use enhanced fallback
        print("🚨 All AI models failed or throttled - using enhanced fallback")
        return ChatService.generate_throttled_response(message, context)
    
    @staticmethod
    def generate_throttled_response(message, context):
        """Generate response when AI service is throttled"""
        message_lower = message.lower()
        
        # Add throttling notice to the regular fallback response
        base_response = ChatService.generate_fallback_response(message, context)
        
        throttle_notice = "\n\n⚡ *Psst!* Mukhang sobrang busy ng AI ko ngayon - naka-reach na niya ang daily limit! 😅 Pero hindi ako susuko! Ginagawa ko pa rin ang best ko para sa'yo gamit ang aking *backup brain*! 🧠✨"
        
        return base_response + throttle_notice
    
    @staticmethod
    def generate_fallback_response(message, context):
        """Generate rule-based fallback responses with humor"""
        message_lower = message.lower()
        
        if not context:
            if any(word in message_lower for word in ['schedule', 'class', 'subject']):
                return "Hmm, I'd love to spill the tea on your schedule, but I'm coming up empty! 🤔 Maybe try asking about a specific class or day? I promise I'm not usually this useless! 😅"
            elif any(word in message_lower for word in ['task', 'assignment', 'homework', 'due']):
                return "Ah, the eternal student question about assignments! 📚 I can definitely help with your academic doom- I mean, tasks! Could you be more specific about which subject you're procrastinating on? 😏"
            elif any(word in message_lower for word in ['announcement', 'news', 'update']):
                return "Looking for the latest academic gossip? 📢 I'm your bot! What kind of announcements are you hunting for? Please tell me it's not about another surprise quiz! 😱"
            else:
                return "Hey there, fellow academic survivor! 🎓 I'm here to help with your schedule, tasks, and announcements. What chaos can I help you organize today? 😄"
        
        # Generate response based on context type
        schedule_count = len([c for c in context if c['type'] == 'schedule'])
        task_count = len([c for c in context if c['type'] == 'task'])
        announcement_count = len([c for c in context if c['type'] == 'announcement'])
        
        response_parts = []
        
        if schedule_count > 0:
            response_parts.append(f"🎯 Found {schedule_count} schedule item{'s' if schedule_count > 1 else ''} (your day just got busier!):")
            for item in [c for c in context if c['type'] == 'schedule'][:3]:
                response_parts.append(f"• {item['content']}")
        
        if task_count > 0:
            response_parts.append(f"📋 Discovered {task_count} task{'s' if task_count > 1 else ''} (the procrastination station!):")
            for item in [c for c in context if c['type'] == 'task'][:3]:
                response_parts.append(f"• {item['content']}")
        
        if announcement_count > 0:
            response_parts.append(f"📣 Spotted {announcement_count} announcement{'s' if announcement_count > 1 else ''} (hope it's good news!):")
            for item in [c for c in context if c['type'] == 'announcement'][:2]:
                response_parts.append(f"• {item['content']}")
        
        return "\n\n".join(response_parts) if response_parts else "I'm here to make your academic life less chaotic! 🚀 What can I help you with today? 😊"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'chat-service',
        'ai_available': len(WORKING_MODELS) > 0,
        'working_models': [model['name'] for model in WORKING_MODELS]
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
        
        # Get conversation history
        conversation_history = conversations.get(user_id, [])
        
        # Fetch user data from Node.js API
        user_data = ContextManager.fetch_user_data()
        
        # Find relevant context
        context = ContextManager.find_relevant_context(message, user_data)
        
        # Generate response
        response = ChatService.generate_ai_response(message, context, conversation_history)
        
        # Check if response contains throttling notice
        is_throttled = "daily limit" in response and "backup brain" in response
        
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
            'ai_powered': len(WORKING_MODELS) > 0 and not is_throttled,
            'is_throttled': is_throttled,
            'model_used': WORKING_MODELS[0]['name'] if WORKING_MODELS and not is_throttled else 'Rule-based',
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
