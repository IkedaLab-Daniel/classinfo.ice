const express = require('express');
const axios = require('axios');
const router = express.Router();

// Chat service configuration
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:5002';

/**
 * Chat endpoint - proxies to Python Flask chat service
 */
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message is required' 
            });
        }

        // Get user ID from auth middleware or use anonymous
        const userId = req.user?.id || req.headers['user-id'] || 'anonymous';

        // Forward request to Python chat service
        const chatResponse = await axios.post(`${CHAT_SERVICE_URL}/chat`, {
            message: message.trim(),
            user_id: userId
        }, {
            timeout: 30000, // 30 seconds timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return res.json({
            success: true,
            data: {
                response: chatResponse.data.response,
                context_items_used: chatResponse.data.context_items_used,
                ai_powered: chatResponse.data.ai_powered,
                timestamp: chatResponse.data.timestamp
            }
        });

    } catch (error) {
        console.error('Chat service error:', error.message);
        
        // Handle different error types
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({
                success: false,
                error: 'Chat service is temporarily unavailable. Please try again in a moment.',
                fallback_response: getFallbackResponse(req.body.message)
            });
        }

        if (error.response?.status === 400) {
            return res.status(400).json({
                success: false,
                error: error.response.data.error || 'Invalid request'
            });
        }

        // Generic error response
        return res.status(500).json({
            success: false,
            error: 'Sorry, I\'m having trouble processing your request right now.',
            fallback_response: getFallbackResponse(req.body.message)
        });
    }
});

/**
 * Get chat history
 */
router.get('/chat/history', async (req, res) => {
    try {
        const userId = req.user?.id || req.headers['user-id'] || 'anonymous';
        
        const historyResponse = await axios.get(`${CHAT_SERVICE_URL}/chat/history/${userId}`, {
            timeout: 10000
        });

        return res.json({
            success: true,
            data: historyResponse.data
        });

    } catch (error) {
        console.error('Chat history error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Unable to retrieve chat history'
        });
    }
});

/**
 * Clear chat history
 */
router.post('/chat/clear', async (req, res) => {
    try {
        const userId = req.user?.id || req.headers['user-id'] || 'anonymous';
        
        await axios.post(`${CHAT_SERVICE_URL}/chat/clear/${userId}`, {}, {
            timeout: 10000
        });

        return res.json({
            success: true,
            message: 'Chat history cleared'
        });

    } catch (error) {
        console.error('Clear chat history error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Unable to clear chat history'
        });
    }
});

/**
 * Chat service health check
 */
router.get('/chat/health', async (req, res) => {
    try {
        const healthResponse = await axios.get(`${CHAT_SERVICE_URL}/health`, {
            timeout: 5000
        });

        return res.json({
            success: true,
            data: {
                chat_service_status: 'healthy',
                ...healthResponse.data
            }
        });

    } catch (error) {
        return res.json({
            success: false,
            data: {
                chat_service_status: 'unavailable',
                error: error.message
            }
        });
    }
});

/**
 * Fallback responses when chat service is unavailable
 */
function getFallbackResponse(message) {
    if (!message) return "I'm here to help! What would you like to know?";
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('class')) {
        return "I'd be happy to help with your schedule! Unfortunately, I'm having some technical difficulties right now. Please check your schedule directly or try again in a few minutes.";
    }
    
    if (lowerMessage.includes('task') || lowerMessage.includes('assignment')) {
        return "I can help with your tasks and assignments! I'm experiencing some technical issues at the moment. Please check your tasks directly or try again shortly.";
    }
    
    if (lowerMessage.includes('announcement')) {
        return "I can help with announcements! I'm having some connectivity issues right now. Please check the announcements section or try again later.";
    }
    
    return "I'm here to help with your schedule, tasks, and announcements! I'm experiencing some technical difficulties at the moment. Please try again in a few minutes.";
}

module.exports = router;
