import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageCircle, 
    X, 
    Send, 
    Bot, 
    User, 
    Loader2,
    AlertCircle,
    Trash2,
    RefreshCw,
    Wifi,
    WifiOff
} from 'lucide-react';
import './ChatBot.css';
import hunnibee from '../assets/HunniBee.gif'
import thinking_orb from '../assets/thinking2.gif'

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isServiceHealthy, setIsServiceHealthy] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // API base URL - Direct Flask service
    const API_BASE = process.env.NODE_ENV === 'production' 
        ? 'https://dailyclass-rag.onrender.com' 
        : 'http://localhost:5002';

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Check service health on component mount
    useEffect(() => {
        checkServiceHealth();
    }, []);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            checkServiceHealth();
        }
    }, [isOpen]);

    // Check chat service health
    const checkServiceHealth = async () => {
        try {
            const response = await fetch(`${API_BASE}/health`);
            const data = await response.json();
            // Flask service returns { ai-status: 'healthy', ai_available: true, ... }
            setIsServiceHealthy(data.status === 'healthy');
        } catch (error) {
            setIsServiceHealthy(false);
        }
    };

    // Send message to chat service
    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        setIsLoading(true);

        // Add user message to chat
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: userMessage,
            timestamp: new Date()
        }]);

        await sendChatRequest(userMessage);
    };

    // Handle offline button actions
    const handleOfflineAction = async (action) => {
        if (isLoading) return;

        let actionMessage = '';
        switch (action) {
            case 'schedules':
                actionMessage = 'Show my schedules for this week';
                break;
            case 'tasks':
                actionMessage = 'Show my tasks';
                break;
            case 'announcements':
                actionMessage = 'Show announcements';
                break;
            default:
                return;
        }

        setIsLoading(true);

        // Add user action message to chat
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: actionMessage,
            timestamp: new Date(),
            isOfflineAction: true
        }]);

        await sendChatRequest(actionMessage);
    };

    // Common function to send chat requests
    const sendChatRequest = async (message) => {
        try {
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            const responseData = await response.json();

            // Check if response is successful (either with success field or direct Flask response)
            if (responseData.success || responseData.response) {
                // Add bot response - handle both Node.js proxy format and direct Flask format
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: responseData.success ? responseData.data.response : responseData.response,
                    timestamp: new Date(),
                    contextItemsUsed: responseData.success ? responseData.data.context_items_used : responseData.context_items_used,
                    aiPowered: responseData.success ? responseData.data.ai_powered : responseData.ai_powered,
                    isThrottled: responseData.success ? responseData.data.is_throttled : responseData.is_throttled
                }]);
            } else {
                // Add error message with fallback if available
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    type: 'bot',
                    content: responseData.error || 'Sorry, I encountered an error.',
                    timestamp: new Date(),
                    isError: true
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'bot',
                content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
                timestamp: new Date(),
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear chat history
    const clearChat = async () => {
        try {
            // Flask service uses different endpoint format
            await fetch(`${API_BASE}/chat/clear/anonymous`, { method: 'POST' });
            setMessages([]);
        } catch (error) {
            console.error('Clear chat error:', error);
            // Clear locally even if API call fails
            setMessages([]);
        }
    };

    // Handle enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Format timestamp
    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    // Format bot message with basic markdown support
    const formatBotMessage = (content) => {
        if (!content) return content;
        
        return content
            // Bold text: **text** -> <strong>text</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic text: *text* -> <em>text</em> (but not bullet points)
            .replace(/(?<!\n)\*([^*\n]+)\*/g, '<em>$1</em>')
            // Bullet points: * text -> • text
            .replace(/^\* /gm, '• ')
            // Line breaks
            .replace(/\n/g, '<br>');
    };

    return (
        <>
            {/* Chat Bot Trigger Button */}
            <div 
                className={`chat-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(true)}
                title="Ask about your schedule"
            >
                {/* <MessageCircle size={24} /> */}
                <div className={`service-status-indicator ${isServiceHealthy ? 'online' : 'offline'}`}>
                    {isServiceHealthy ? (
                        <Wifi size={16} />
                    ) : (
                        <WifiOff size={16} />
                    )}
                </div>
                <img src={hunnibee} alt="" />
            </div>

            {/* Chat Modal */}
            {isOpen && (
                <div className="chat-modal-overlay">
                    <div className="chat-modal">
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                {/* <Bot size={20} /> */}
                                <img src={hunnibee} className='hunnibee' />
                                <div>
                                    <h3>HunniBee</h3>
                                    <span className={`ai-status ${isServiceHealthy ? 'online' : 'offline'}`}>
                                        {isServiceHealthy ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <div className="chat-header-actions">
                                {messages.length > 0 && (
                                    <button 
                                        className="clear-btn" 
                                        onClick={clearChat}
                                        title="Clear chat"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                {/* <button 
                                    className="refresh-btn" 
                                    onClick={checkServiceHealth}
                                    title="Check service ai-status"
                                >
                                    <RefreshCw size={18} />
                                </button> */}
                                <button 
                                    className="close-btn" 
                                    onClick={() => setIsOpen(false)}
                                    title="Close chat"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="welcome-message">
                                    {/* <Bot size={40} /> */}
                                    <h4>Hi! I'm HunniBee</h4>
                                    <p>Ask me about your schedule, tasks, or announcements!</p>
                                    {process.env.NODE_ENV === 'production' && (
                                        <div className="production-notice">
                                            <p style={{ fontSize: '0.85rem', color: '#f59e0b', fontStyle: 'italic', marginTop: '8px' }}>
                                                ⚡ <strong>Production Note:</strong> I'm using lighter AI models for memory efficiency, so I might occasionally hallucinate or provide less accurate responses. For critical information, please double-check! 🐝
                                            </p>
                                        </div>
                                    )}
                                    <div className="example-questions">
                                        <span>Try asking:</span>
                                        <button onClick={() => setInputMessage("What classes do I have today?")}>
                                            "What classes do I have today?"
                                        </button>
                                        <button onClick={() => setInputMessage("What tasks are due soon?")}>
                                            "What tasks are due soon?"
                                        </button>
                                        <button onClick={() => setInputMessage("Any new announcements?")}>
                                            "Any new announcements?"
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div key={message.id} className={`message ${message.type}`}>
                                        <div className="message-avatar">
                                            {message.type === 'user' ? 
                                                <User size={18} /> : 
                                                // <Bot size={18} />
                                                <img className='hunnibee-avatar' src={hunnibee} />
                                            }
                                        </div>
                                        <div className="message-content">
                                            <div className="message-text">
                                                {message.type === 'bot' ? (
                                                    <div 
                                                        dangerouslySetInnerHTML={{ 
                                                            __html: formatBotMessage(message.content) 
                                                        }} 
                                                    />
                                                ) : (
                                                    message.content
                                                )}
                                            </div>
                                            <div className="message-meta">
                                                <span className="message-time">
                                                    {formatTime(message.timestamp)}
                                                </span>
                                                {message.type === 'bot' && !message.isError && (
                                                    <span className="message-info">
                                                        {message.isThrottled ? '⚡ Backup Mode' : 
                                                         message.aiPowered ? '🐝 HunniBee' : '📝 Rule-based'}
                                                        {message.contextItemsUsed > 0 && 
                                                            ` • ${message.contextItemsUsed} context items`
                                                        }
                                                    </span>
                                                )}
                                                {message.isError && (
                                                    <span className="message-error">
                                                        <AlertCircle size={12} /> Error
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            {isLoading && (
                                <div className="message bot">
                                    <div className="message-avatar">
                                        <img className='hunnibee-avatar' src={thinking_orb} />
                                    </div>
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <Loader2 size={16} className="spin" />
                                            <span>Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        {isServiceHealthy ? (
                            <div className="chat-input-area">
                                <div className="chat-input-container">
                                    <textarea
                                        ref={inputRef}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Send a message.."
                                        className="chat-input"
                                        rows="1"
                                        disabled={isLoading}
                                    />
                                    <button 
                                        onClick={sendMessage}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="send-btn"
                                        title="Send message"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="offline-buttons-area">
                                <div className="offline-notice">
                                    <WifiOff size={20} />
                                    <span>AI is offline. Use quick actions below:</span>
                                </div>
                                <div className="offline-buttons">
                                    <button 
                                        className="offline-btn"
                                        onClick={() => handleOfflineAction("schedules")}
                                        disabled={isLoading}
                                    >
                                        📅 Schedules (This Week)
                                    </button>
                                    <button 
                                        className="offline-btn"
                                        onClick={() => handleOfflineAction("tasks")}
                                        disabled={isLoading}
                                    >
                                        📋 Tasks
                                    </button>
                                    <button 
                                        className="offline-btn"
                                        onClick={() => handleOfflineAction("announcements")}
                                        disabled={isLoading}
                                    >
                                        📢 Announcements
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;
