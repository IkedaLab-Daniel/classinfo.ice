import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # Flask configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # External API URLs
    NODE_API_URL = os.getenv('NODE_API_URL', 'http://localhost:3000')
    
    # AI Configuration
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')  # Alternative AI option
    
    # CORS Configuration
    CORS_ORIGINS = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # React dev server
        "https://*.netlify.app",  # Netlify deployments
        os.getenv('FRONTEND_URL', '')  # Custom frontend URL
    ]
    
    # Render configuration
    RENDER_EXTERNAL_URL = os.getenv('RENDER_EXTERNAL_URL')
    PORT = int(os.getenv('PORT', 5000))
    
    # Chat configuration
    MAX_CONVERSATION_HISTORY = 10
    MAX_CONTEXT_ITEMS = 10
    REQUEST_TIMEOUT = 10
    
    # Keep-alive configuration
    KEEP_ALIVE_INTERVAL = 840  # 14 minutes in seconds
