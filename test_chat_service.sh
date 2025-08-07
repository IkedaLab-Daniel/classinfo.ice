#!/bin/bash

echo "🚀 Testing ClassInfo Chat Service Integration"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    
    echo -e "\n${YELLOW}Testing: $name${NC}"
    echo "URL: $url"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi
    
    # Extract HTTP code and body
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✅ SUCCESS (HTTP $http_code)${NC}"
        echo "Response: $body" | jq '.' 2>/dev/null || echo "Response: $body"
    else
        echo -e "${RED}❌ FAILED (HTTP $http_code)${NC}"
        echo "Response: $body"
    fi
}

# 1. Test Flask Service Health
test_endpoint "Flask Health Check" "http://localhost:5000/health"

# 2. Test Simple Chat (Direct to Flask)
test_endpoint "Direct Flask Chat" "http://localhost:5000/chat" "POST" \
'{
    "message": "Hello! What can you help me with?",
    "user_id": "curl_test"
}'

# 3. Test Schedule Question (Direct to Flask)
test_endpoint "Schedule Question (Flask)" "http://localhost:5000/chat" "POST" \
'{
    "message": "What classes do I have today?",
    "user_id": "curl_test"
}'

# 4. Test Task Question (Direct to Flask)
test_endpoint "Task Question (Flask)" "http://localhost:5000/chat" "POST" \
'{
    "message": "What tasks are due soon?",
    "user_id": "curl_test"
}'

# 5. Test Node.js Proxy Health
test_endpoint "Node.js Chat Health" "http://localhost:3000/api/chat/health"

# 6. Test Through Node.js Proxy
test_endpoint "Chat via Node.js Proxy" "http://localhost:3000/api/chat" "POST" \
'{
    "message": "Any announcements I should know about?"
}'

# 7. Test Chat History
test_endpoint "Chat History" "http://localhost:5000/chat/history/curl_test"

# 8. Test Error Handling
test_endpoint "Error Handling (Empty Message)" "http://localhost:5000/chat" "POST" \
'{
    "message": "",
    "user_id": "curl_test"
}'

echo -e "\n${YELLOW}🏁 Testing Complete!${NC}"
echo -e "\nIf you see mostly ✅ marks, your chat service is working correctly!"
echo -e "\nTo test the frontend:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Click the chat bot icon (bottom right)"
echo "3. Ask: 'What classes do I have today?'"
