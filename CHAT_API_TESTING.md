# Chat Service API Testing with CURL

This document provides CURL commands to test your Flask chat microservice at different levels.

## Service URLs
- **Flask Chat Service (Direct):** http://localhost:5002
- **Node.js API (Proxy):** http://localhost:3000/api
- **React Frontend:** http://localhost:5173

---

## 1. Test Flask Chat Service Directly

### Health Check
```bash
curl -X GET http://localhost:5002/health \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-08T14:30:00.123456",
  "service": "chat-service",
  "ai_available": true
}
```

### Simple Chat Message
```bash
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what can you help me with?",
    "user_id": "test_user"
  }'
```

### Schedule-Related Questions
```bash
# Ask about today's classes
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What classes do I have today?",
    "user_id": "test_user"
  }'
```

```bash
# Ask about specific subject
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "When is my Math class?",
    "user_id": "test_user"
  }'
```

```bash
# Ask about room information
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Which room is my Physics class in?",
    "user_id": "test_user"
  }'
```

### Task-Related Questions
```bash
# Ask about pending tasks
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What tasks are due soon?",
    "user_id": "test_user"
  }'
```

```bash
# Ask about specific task
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "When is my assignment due?",
    "user_id": "test_user"
  }'
```

```bash
# Ask about overdue tasks
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Do I have any overdue assignments?",
    "user_id": "test_user"
  }'
```

### Announcement Questions
```bash
# Ask about announcements
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Are there any new announcements?",
    "user_id": "test_user"
  }'
```

### Complex Questions
```bash
# Multiple context question
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What do I need to prepare for tomorrow?",
    "user_id": "test_user"
  }'
```

```bash
# Time management question
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much free time do I have this week?",
    "user_id": "test_user"
  }'
```

---

## 2. Test Through Node.js API (Proxy)

### Health Check (Chat Service Status)
```bash
curl -X GET http://localhost:3000/api/chat/health \
  -H "Content-Type: application/json"
```

### Chat Through Proxy
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What classes do I have today?"
  }'
```

### Chat with User ID Header
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "user-id: student_123" \
  -d '{
    "message": "Show me my upcoming deadlines"
  }'
```

---

## 3. Test Chat History Features

### Send Multiple Messages (Build History)
```bash
# Message 1
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What classes do I have today?",
    "user_id": "history_test"
  }'

# Message 2
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about tomorrow?",
    "user_id": "history_test"
  }'

# Message 3
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Any tasks due this week?",
    "user_id": "history_test"
  }'
```

### Get Chat History
```bash
curl -X GET http://localhost:5002/chat/history/history_test \
  -H "Content-Type: application/json"
```

### Clear Chat History
```bash
curl -X POST http://localhost:5002/chat/clear/history_test \
  -H "Content-Type: application/json"
```

---

## 4. Test Error Handling

### Empty Message
```bash
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "",
    "user_id": "test_user"
  }'
```

### Missing Message Field
```bash
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user"
  }'
```

### Invalid JSON
```bash
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", invalid_json}'
```

---

## 5. Performance Testing

### Rapid Requests (Test Rate Limiting)
```bash
# Send 5 rapid requests
for i in {1..5}; do
  curl -X POST http://localhost:5002/chat \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Test message $i\", \"user_id\": \"perf_test\"}" &
done
wait
```

### Large Message
```bash
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "This is a very long message that tests how the system handles larger inputs. It includes multiple sentences and should test the AI processing capabilities as well as the response time for more complex queries that might require more context processing and analysis.",
    "user_id": "large_test"
  }'
```

---

## 6. Integration Testing

### Test Full Flow Through React App
```bash
# This simulates what the React app sends
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5173" \
  -H "Referer: http://localhost:5173/" \
  -d '{
    "message": "What do I have scheduled for today?"
  }'
```

---

## 7. Expected Response Formats

### Successful Chat Response
```json
{
  "response": "You have Math class at 10:00 AM and History at 2:00 PM today.",
  "context_items_used": 2,
  "ai_powered": true,
  "timestamp": "2025-08-08T14:30:00.123456"
}
```

### Through Node.js Proxy
```json
{
  "success": true,
  "data": {
    "response": "You have Math class at 10:00 AM and History at 2:00 PM today.",
    "context_items_used": 2,
    "ai_powered": true,
    "timestamp": "2025-08-08T14:30:00.123456"
  }
}
```

### Error Response
```json
{
  "response": "I'm sorry, I'm having trouble processing your request right now.",
  "error": true
}
```

### Chat History Response
```json
{
  "history": [
    {
      "user": "What classes do I have today?",
      "assistant": "You have Math at 10:00 AM and History at 2:00 PM.",
      "timestamp": "2025-08-08T14:30:00.123456",
      "context_used": 2
    }
  ],
  "count": 1
}
```

---

## 8. Debugging Commands

### Check if Services are Running
```bash
# Check Flask service
curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/health

# Check Node.js service
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/chat/health

# Check React frontend
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

### Test CORS
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:5002/chat \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

---

## Quick Test Script

Save this as `test_chat.sh` and run it:

```bash
#!/bin/bash

echo "🚀 Testing Chat Service..."

echo "1. Health Check:"
curl -s http://localhost:5002/health | jq '.'

echo -e "\n2. Simple Chat:"
curl -s -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "user_id": "test"}' | jq '.'

echo -e "\n3. Schedule Question:"
curl -s -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What classes do I have today?", "user_id": "test"}' | jq '.'

echo -e "\n4. Through Node.js Proxy:"
curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Any tasks due soon?"}' | jq '.'

echo -e "\n✅ Testing Complete!"
```

Run it with: `chmod +x test_chat.sh && ./test_chat.sh`
