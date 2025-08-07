from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json
import google.generativeai as genai
from datetime import datetime, timedelta
import threading
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print("GEMINI_API_KEY:", os.getenv('GEMINI_API_KEY'))

app = Flask(__name__)

# Enable CORS for your Netlify frontend
CORS(app, origins=[
    "http://localhost:5173",  # Vite dev server
    "https://your-netlify-app.netlify.app",  # Replace with your actual Netlify URL
    "https://*.netlify.app"
])

# Configuration
NODE_API_URL = os.getenv('NODE_API_URL', 'https://your-node-service.onrender.com')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Initialize Gemini AI
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Try different model names in order of preference
    model_names = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'models/gemini-pro']
    model = None
    
    for model_name in model_names:
        try:
            print(f"Trying model: {model_name}")
            model = genai.GenerativeModel(model_name)
            # Test with a simple prompt
            test_response = model.generate_content("Hello")
            print(f"✅ Successfully initialized Gemini AI with model: {model_name}")
            break
        except Exception as e:
            print(f"❌ Model {model_name} failed: {e}")
            model = None
            continue
    
    if not model:
        print("❌ All Gemini models failed - using fallback responses")
else:
    model = None
    print("❌ GEMINI_API_KEY not found - using fallback responses")

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
        
        # Check schedules
        for schedule in data['schedules']:
            if any(keyword in message_lower for keyword in [
                schedule.get('subject', '').lower(),
                schedule.get('room', '').lower(),
                schedule.get('day', '').lower(),
                'schedule', 'class', 'subject'
            ]):
                relevant_context.append({
                    'type': 'schedule',
                    'content': f"{schedule.get('subject')} class on {schedule.get('day')} from {schedule.get('startTime')} to {schedule.get('endTime')} in room {schedule.get('room')}"
                })
        
        # Check tasks
        for task in data['tasks']:
            if any(keyword in message_lower for keyword in [
                task.get('title', '').lower(),
                task.get('class', '').lower(),
                task.get('type', '').lower(),
                'task', 'assignment', 'homework', 'project', 'due'
            ]):
                due_date = task.get('dueDate', '')
                relevant_context.append({
                    'type': 'task',
                    'content': f"Task: {task.get('title')} for {task.get('class')} (Type: {task.get('type')}, Priority: {task.get('priority')}, Due: {due_date})"
                })
        
        # Check announcements
        for announcement in data['announcements']:
            if any(keyword in message_lower for keyword in [
                announcement.get('title', '').lower(),
                'announcement', 'news', 'update'
            ]):
                relevant_context.append({
                    'type': 'announcement',
                    'content': f"Announcement: {announcement.get('title')} - {announcement.get('description')}"
                })
        
        return relevant_context[:10]  # Limit to 10 most relevant items

class ChatService:
    """Handles chat responses using AI or fallbacks"""
    
    @staticmethod
    def generate_ai_response(message, context, conversation_history):
        """Generate response using Gemini AI"""
        if not model:
            print("No AI model available, using fallback")
            return ChatService.generate_fallback_response(message, context)
        
        try:
            # Build context string
            context_text = "\n".join([item['content'] for item in context])
            
            # Build conversation history
            history_text = ""
            if conversation_history:
                history_text = "\n".join([
                    f"User: {msg['user']}\nAssistant: {msg['assistant']}"
                    for msg in conversation_history[-3:]  # Last 3 exchanges
                ])
            
            prompt = f"""
You are a helpful academic schedule assistant for a student. You have access to their schedule, tasks, and announcements.

Previous conversation:
{history_text}

Current relevant information:
{context_text}

User's current question: {message}

Instructions:
- Answer helpfully and conversationally
- Use the provided schedule/task/announcement information when relevant
- If you can't find specific information, acknowledge it politely
- Keep responses concise but informative
- Be friendly and supportive
- Format times and dates clearly
- If asked about deadlines, calculate days remaining when possible

Response:
"""

            print(f"Sending prompt to Gemini AI...")
            response = model.generate_content(prompt)
            print(f"✅ AI response received: {len(response.text)} characters")
            return response.text.strip()
            
        except Exception as e:
            print(f"❌ AI response error: {e}")
            print(f"Falling back to rule-based response")
            return ChatService.generate_fallback_response(message, context)
    
    @staticmethod
    def generate_fallback_response(message, context):
        """Generate rule-based fallback responses"""
        message_lower = message.lower()
        
        if not context:
            if any(word in message_lower for word in ['schedule', 'class', 'subject']):
                return "I'd be happy to help with your schedule! However, I couldn't find specific schedule information for your question. Could you be more specific about which class or day you're asking about?"
            elif any(word in message_lower for word in ['task', 'assignment', 'homework', 'due']):
                return "I can help with your tasks and assignments! Could you specify which task or subject you're asking about?"
            elif any(word in message_lower for word in ['announcement', 'news', 'update']):
                return "I can help with announcements! What specific information are you looking for?"
            else:
                return "I'm here to help with your academic schedule, tasks, and announcements. What would you like to know?"
        
        # Generate response based on context type
        schedule_count = len([c for c in context if c['type'] == 'schedule'])
        task_count = len([c for c in context if c['type'] == 'task'])
        announcement_count = len([c for c in context if c['type'] == 'announcement'])
        
        response_parts = []
        
        if schedule_count > 0:
            response_parts.append(f"I found {schedule_count} relevant schedule item{'s' if schedule_count > 1 else ''}:")
            for item in [c for c in context if c['type'] == 'schedule'][:3]:
                response_parts.append(f"• {item['content']}")
        
        if task_count > 0:
            response_parts.append(f"I found {task_count} relevant task{'s' if task_count > 1 else ''}:")
            for item in [c for c in context if c['type'] == 'task'][:3]:
                response_parts.append(f"• {item['content']}")
        
        if announcement_count > 0:
            response_parts.append(f"I found {announcement_count} relevant announcement{'s' if announcement_count > 1 else ''}:")
            for item in [c for c in context if c['type'] == 'announcement'][:2]:
                response_parts.append(f"• {item['content']}")
        
        return "\n\n".join(response_parts) if response_parts else "I'm here to help! What specific information are you looking for?"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'chat-service',
        'ai_available': model is not None
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
            'ai_powered': model is not None,
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
