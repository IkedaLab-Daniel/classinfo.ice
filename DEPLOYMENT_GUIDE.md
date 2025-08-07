# Dual Service Deployment Guide

This guide covers deploying both your existing Node.js API and the new Flask chat service on Render.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│  Netlify        │    │  Render (Node.js)│    │  Render (Flask)    │
│  (Frontend)     │───▶│  (Main API)      │───▶│  (Chat Service)    │
│                 │    │                  │    │                    │
│  React App      │    │  Schedules API   │    │  AI Chat API       │
│  ChatBot UI     │    │  Tasks API       │    │  Context Processing│
└─────────────────┘    │  Announcements   │    │  Gemini AI         │
                       │  Chat Proxy      │    └────────────────────┘
                       └──────────────────┘
```

## 1. Deploy Flask Chat Service

### Step 1: Create New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your repository
4. Configure settings:

**Basic Settings:**
- **Name:** `classinfo-chat-service`
- **Region:** Same as your Node.js service
- **Branch:** `chat` (or your preferred branch)
- **Root Directory:** `chat-service`
- **Runtime:** `Python 3`

**Build & Deploy:**
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1`

**Environment Variables:**
```bash
GEMINI_API_KEY=your-gemini-api-key-here
NODE_API_URL=https://your-existing-node-service.onrender.com
FRONTEND_URL=https://your-netlify-app.netlify.app
RENDER_EXTERNAL_URL=https://classinfo-chat-service.onrender.com
FLASK_ENV=production
```

### Step 2: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your Render environment variables as `GEMINI_API_KEY`

## 2. Update Your Existing Node.js Service

### Step 1: Add Chat Service URL

In your existing Node.js service on Render, add this environment variable:
```bash
CHAT_SERVICE_URL=https://classinfo-chat-service.onrender.com
```

### Step 2: Deploy Updated Code

Make sure your Node.js service includes the new `routes/chat.js` file and updated `server.js`.

## 3. Update Frontend (Netlify)

### Step 1: Update API URL

In your React app, update the ChatBot component's API_BASE URL:

```javascript
// client/src/components/ChatBot.jsx
const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://your-node-service.onrender.com/api'  // Your existing Node.js service
    : 'http://localhost:3000/api';
```

### Step 2: Deploy to Netlify

Push your changes and Netlify will auto-deploy.

## 4. Testing the Complete Setup

### Test Chat Service Directly:
```bash
curl -X POST https://classinfo-chat-service.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What classes do I have today?", "user_id": "test"}'
```

### Test Through Node.js Proxy:
```bash
curl -X POST https://your-node-service.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my upcoming tasks?"}'
```

### Test Frontend:
1. Visit your Netlify app
2. Click the chat bot icon (bottom right)
3. Ask a question about schedules or tasks

## 5. Environment Variables Summary

### Flask Chat Service:
```env
GEMINI_API_KEY=your-gemini-api-key
NODE_API_URL=https://your-node-service.onrender.com
FRONTEND_URL=https://your-netlify-app.netlify.app
RENDER_EXTERNAL_URL=https://classinfo-chat-service.onrender.com
FLASK_ENV=production
```

### Node.js API Service:
```env
CHAT_SERVICE_URL=https://classinfo-chat-service.onrender.com
# ... your existing environment variables
```

### Netlify (if needed):
```env
# Usually not needed, but if you want to override the API URL
REACT_APP_API_URL=https://your-node-service.onrender.com
```

## 6. Monitoring and Troubleshooting

### Check Service Health:
- Flask Chat: `https://classinfo-chat-service.onrender.com/health`
- Node.js API: `https://your-node-service.onrender.com/api/health` (if you have this endpoint)

### Common Issues:

**1. Cold Start Problems:**
- Both services include keep-alive mechanisms
- First request after 15 minutes of inactivity will be slow

**2. CORS Issues:**
- Make sure your Netlify URL is in the CORS configuration of both services

**3. API Communication Issues:**
- Verify `NODE_API_URL` in Flask service points to your Node.js service
- Verify `CHAT_SERVICE_URL` in Node.js service points to your Flask service

**4. AI Not Working:**
- Check `GEMINI_API_KEY` is set correctly
- Monitor Gemini API usage in Google AI Studio
- System will fall back to rule-based responses if AI fails

### View Logs:
- Go to your Render service dashboards
- Click on "Logs" to see real-time logging
- Look for startup messages and error logs

## 7. Cost Considerations

**Render Free Tier (both services):**
- 2 services × 750 hours = total coverage for both
- Both services will sleep after 15 minutes of inactivity
- Keep-alive mechanisms help but don't eliminate cold starts

**Gemini API:**
- Free tier: 60 requests per minute
- Very generous limits for small applications
- Monitor usage in Google AI Studio

## 8. Future Enhancements

**Performance:**
- Consider upgrading to Render paid plan for no cold starts
- Add Redis for conversation persistence
- Implement response caching

**Features:**
- Add user authentication integration
- Implement conversation export
- Add more AI model options (OpenAI, Claude)

**Monitoring:**
- Add application monitoring (Sentry, LogRocket)
- Implement usage analytics
- Set up uptime monitoring

## 9. Development Workflow

**Local Development:**
```bash
# Terminal 1: Run Node.js API
cd server
npm run dev

# Terminal 2: Run Flask Chat Service
cd chat-service
python app.py

# Terminal 3: Run React Frontend
cd client
npm run dev
```

**Environment Files:**
- `server/.env` - Node.js environment variables
- `chat-service/.env` - Flask environment variables
- `client/.env` - React environment variables (if needed)

Your dual service architecture is now ready! The Flask chat service handles AI processing while your existing Node.js API continues to manage your core application data.
