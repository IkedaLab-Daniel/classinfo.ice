# Chat Service

A Flask-based microservice for handling AI-powered chat functionality for the ClassInfo application.

## Features

- AI-powered responses using Google Gemini
- Context-aware conversations using schedule, task, and announcement data
- Fallback responses when AI is unavailable
- Conversation history management
- CORS support for frontend integration
- Keep-alive mechanism for Render free tier

## Setup

### Local Development

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   Edit `.env` and add your API keys:
   ```
   NODE_API_URL=http://localhost:3000
   GEMINI_API_KEY=your-gemini-api-key
   FRONTEND_URL=http://localhost:5173
   ```

4. **Run the service:**
   ```bash
   python app.py
   ```

   The service will be available at `http://localhost:5000`

### Production Deployment (Render)

1. **Create new Web Service on Render**
2. **Connect your repository**
3. **Configure build settings:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`

4. **Set environment variables in Render dashboard:**
   ```
   GEMINI_API_KEY=your-production-gemini-key
   NODE_API_URL=https://your-node-service.onrender.com
   FRONTEND_URL=https://your-netlify-app.netlify.app
   RENDER_EXTERNAL_URL=https://your-chat-service.onrender.com
   ```

## API Endpoints

### `POST /chat`
Send a chat message and receive an AI response.

**Request:**
```json
{
  "message": "What classes do I have today?",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "response": "You have Math at 10:00 AM and History at 2:00 PM today.",
  "context_items_used": 2,
  "ai_powered": true,
  "timestamp": "2025-08-08T14:30:00Z"
}
```

### `GET /chat/history/<user_id>`
Get chat history for a specific user.

### `POST /chat/clear/<user_id>`
Clear chat history for a specific user.

### `GET /health`
Health check endpoint.

## Integration with Node.js API

The chat service communicates with your existing Node.js API to fetch:
- User schedules
- Tasks and assignments
- Announcements

Make sure your Node.js service is accessible and returns data in the expected format.

## AI Configuration

### Google Gemini (Recommended)
- Free tier: 60 requests per minute
- Good performance and natural responses
- Set `GEMINI_API_KEY` in environment variables

### Fallback Responses
When AI is unavailable, the service provides rule-based responses based on the context found in user data.

## CORS Configuration

The service is configured to accept requests from:
- Localhost (development)
- Netlify deployments
- Custom frontend URLs

Update `CORS_ORIGINS` in `config.py` if needed.

## Keep-Alive Mechanism

For Render free tier, the service includes a keep-alive mechanism that pings itself every 14 minutes to prevent cold starts.

## Error Handling

- Graceful fallback when AI services are down
- Timeout handling for external API calls
- Comprehensive error logging

## Testing

Test the service locally:

```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my tasks for today?", "user_id": "test"}'
```
