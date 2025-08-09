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
    WifiOff,
    Calendar,
    CheckSquare,
    Megaphone
} from 'lucide-react';
import './ChatBot.css';
import hunnibee from '../assets/HunniBee.gif'
import thinking_orb from '../assets/thinking2.gif'

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serviceMode, setServiceMode] = useState('loading'); // 'ai_enhanced', 'smart_mode', 'error', or 'loading'
    const [serviceDescription, setServiceDescription] = useState('Checking service status...');
    const [aiAvailable, setAiAvailable] = useState(true); // Track AI availability separately
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

    // Check chat service health and mode
    const checkServiceHealth = async () => {
        try {
            setServiceMode('loading');
            setServiceDescription('Checking service status...');
            
            const response = await fetch(`${API_BASE}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(15000) // 15 second timeout
            });
            const data = await response.json();
            
            // Update service mode based on enhanced health response
            setServiceMode(data.mode || 'error');
            setServiceDescription(data.description || 'Unknown status');
            setAiAvailable(data.ai_available !== false); // Default to true if not specified
            
            console.log('Service status:', data.mode, '-', data.description, '- AI Available:', data.ai_available);
        } catch (error) {
            console.error('Health check failed:', error);
            
            if (error.name === 'TimeoutError') {
                setServiceMode('loading');
                setServiceDescription('Service is starting up... Please wait.');
            } else {
                setServiceMode('error');
                setServiceDescription('Unable to connect to service');
            }
            setAiAvailable(false);
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
                    isThrottled: responseData.success ? responseData.data.is_throttled : responseData.is_throttled,
                    navigationAction: responseData.success ? responseData.data.navigation_action : responseData.navigation_action,
                    navigationActions: responseData.success ? responseData.data.navigation_actions : responseData.navigation_actions
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

    // Handle navigation actions
    const handleNavigationAction = (action) => {
        console.log('Navigation action:', action);
        
        if (action.type === 'navigate') {
            // Close the chat modal first for navigation
            setIsOpen(false);
            
            // Navigate to the specified URL/section
            if (action.url) {
                // Use a small delay to allow modal close animation
                setTimeout(() => {
                    // Perform actual navigation using window.location
                    window.location.href = action.url;
                }, 200);
            }
        } else if (action.type === 'chat_action') {
            // Handle chat actions (send a message) with loading state
            if (action.message && !isLoading) {
                setIsLoading(true);
                
                // Add user action message to chat
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'user',
                    content: action.message,
                    timestamp: new Date(),
                    isNavigationAction: true
                }]);
                
                // Send the chat request
                sendChatRequest(action.message);
            }
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
                <div className={`service-status-indicator ${serviceMode}`}>
                    {serviceMode === 'ai_enhanced' ? (
                        <Wifi />
                    ) : serviceMode === 'smart_mode' ? (
                        <Bot />
                    ) : serviceMode === 'loading' ? (
                        <Loader2 className="spin" />
                    ) : (
                        <WifiOff />
                    )}
                </div>
                <img src={hunnibee} alt="" />
            </div>

            {/* Chat Modal */}
            {isOpen && (
                <div 
                    className={`chat-modal-overlay ${isOpen ? 'active' : ''}`}
                    onClick={(e) => {
                        // Close sidebar when clicking on the overlay (not on the modal itself)
                        if (e.target === e.currentTarget) {
                            setIsOpen(false);
                        }
                    }}
                >
                    <div className={`chat-modal ${isOpen ? 'open' : ''}`}>
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                {/* <Bot size={20} /> */}
                                <img src={hunnibee} className='hunnibee' />
                                <div>
                                    <h3>HunniBee</h3>
                                    <span className={`ai-status ${serviceMode}`} title={serviceDescription}>
                                        {serviceMode === 'ai_enhanced' ? (
                                            <><Wifi size={14} style={{ marginRight: '4px' }} /> AI Enhanced</>
                                        ) : serviceMode === 'smart_mode' ? (
                                            <><Bot size={14} style={{ marginRight: '4px' }} /> Smart Mode</>
                                        ) : serviceMode === 'loading' ? (
                                            <><Loader2 size={14} className="spin" style={{ marginRight: '4px' }} /> Checking Status...</>
                                        ) : (
                                            <><WifiOff size={14} style={{ marginRight: '4px' }} /> Offline</>
                                        )}
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
                                    <h4>Hi! I'm HunniBee 🐝</h4>
                                    <p>Your AI-powered academic assistant with two intelligent modes:</p>
                                    
                                    <div className="modes-explanation">
                                        <div className={`mode-card ${serviceMode === 'loading' ? 'active' : ''}`} style={{ display: serviceMode === 'loading' ? 'block' : 'none' }}>
                                            <div className="mode-header">
                                                <span className="mode-icon"><Loader2 size={18} className="spin" /></span>
                                                <strong>Checking Service...</strong>
                                                <span className="current-badge">LOADING</span>
                                            </div>
                                            <p>Please wait while we check the service status. The server may be starting up.</p>
                                        </div>

                                        <div className={`mode-card ${serviceMode === 'ai_enhanced' ? 'active' : ''}`} style={{ display: serviceMode === 'loading' ? 'none' : 'block' }}>
                                            <div className="mode-header">
                                                <span className="mode-icon"><Wifi size={18} /></span>
                                                <strong>AI Enhanced Mode</strong>
                                                {serviceMode === 'ai_enhanced' && <span className="current-badge">CURRENT</span>}
                                                {!aiAvailable && <span className="unavailable-badge">UNAVAILABLE</span>}
                                            </div>
                                            <p>Chat with natural conversations with contextual understanding. Ask anything about your schedule, tasks, and announcements in your own words!</p>
                                        </div>
                                        
                                        <div className={`mode-card ${serviceMode === 'smart_mode' ? 'active' : ''}`} style={{ display: serviceMode === 'loading' ? 'none' : 'block' }}>
                                            <div className="mode-header">
                                                <span className="mode-icon"><Bot size={18} /></span>
                                                <strong>Smart Mode</strong>
                                                {serviceMode === 'smart_mode' && <span className="current-badge">CURRENT</span>}
                                            </div>
                                            <p>Reliable structured responses with real-time data. Choose from preset options for consistent, accurate results!</p>
                                        </div>
                                    </div>

                                    {serviceMode === 'ai_enhanced' ? (
                                        <div className="current-mode-actions">
                                            <span>Try asking me:</span>
                                            <div className="example-questions">
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
                                    ) : serviceMode === 'smart_mode' ? (
                                        <div className="current-mode-actions">
                                            <span>Choose from reliable options below:</span>
                                        </div>
                                    ) : serviceMode === 'loading' ? (
                                        <div className="loading-actions">
                                            <div className="loading-spinner">
                                                <Loader2 size={24} className="spin" />
                                            </div>
                                        </div>
                                    ) : (
                                        // <div className="error-message">
                                        //     <p><strong>❌ Service temporarily unavailable.</strong> Please try again in a moment.</p>
                                        // </div>
                                        <>
                                        </>
                                    )}

                                    {process.env.NODE_ENV === 'production' && serviceMode === 'ai_enhanced' && (
                                        <div className="production-notice">
                                            <p style={{ fontSize: '0.85rem', color: '#f59e0b', fontStyle: 'italic', marginTop: '12px' }}>
                                                <Wifi size={16} style={{ display: 'inline', marginRight: '4px' }} /> <strong>Production Note:</strong> Using lighter AI models for efficiency. Please double-check critical information!
                                            </p>
                                        </div>
                                    )}
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
                                            
                                            {/* Navigation Action Buttons */}
                                            {(message.navigationActions || message.navigationAction) && (
                                                <div className="navigation-action">
                                                    {message.navigationActions ? (
                                                        // Multiple navigation actions
                                                        message.navigationActions.map((action, index) => (
                                                            <button 
                                                                key={index}
                                                                className="navigation-btn"
                                                                onClick={() => handleNavigationAction(action)}
                                                                disabled={isLoading}
                                                            >
                                                                {action.label}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        // Single navigation action (backward compatibility)
                                                        <button 
                                                            className="navigation-btn"
                                                            onClick={() => handleNavigationAction(message.navigationAction)}
                                                            disabled={isLoading}
                                                        >
                                                            {message.navigationAction.label}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="message-meta">
                                                <span className="message-time">
                                                    {formatTime(message.timestamp)}
                                                </span>
                                                {/* {message.type === 'bot' && !message.isError && (
                                                    <span className="message-info">
                                                        {message.isThrottled ? '⚡ Smart RAG' : 
                                                         message.aiPowered ? '🐝 HunniBee' : '📝 Rule-based'}
                                                        {message.contextItemsUsed > 0 && 
                                                            ` • ${message.contextItemsUsed} context items`
                                                        }
                                                    </span>
                                                )} */}
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
                        {serviceMode === 'ai_enhanced' ? (
                            <div className="chat-input-area">
                                <div className="chat-input-container">
                                    <textarea
                                        ref={inputRef}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask me anything about your schedule..."
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
                        ) : serviceMode === 'smart_mode' ? (
                            <div className="smart-mode-buttons-area">
                                <div className="smart-mode-buttons">
                                    <button 
                                        className="smart-mode-btn"
                                        onClick={() => handleOfflineAction("schedules")}
                                        disabled={isLoading}
                                    >
                                        <Calendar size={18} />
                                        Schedule
                                    </button>
                                    <button 
                                        className="smart-mode-btn"
                                        onClick={() => handleOfflineAction("tasks")}
                                        disabled={isLoading}
                                    >
                                        <CheckSquare size={18} />
                                        Tasks
                                    </button>
                                    <button 
                                        className="smart-mode-btn"
                                        onClick={() => handleOfflineAction("announcements")}
                                        disabled={isLoading}
                                    >
                                        <Megaphone size={18} />
                                        News
                                    </button>
                                </div>
                            </div>
                        ) : serviceMode === 'loading' ? (
                            <div className="loading-buttons-area">
                                <div className="loading-notice">
                                    <Loader2 size={20} className="spin" />
                                    <span>Service is starting up... Please wait.</span>
                                </div>
                                <button 
                                    className="retry-btn"
                                    onClick={checkServiceHealth}
                                    disabled={false}
                                >
                                    <RefreshCw size={18} />
                                    Retry Connection
                                </button>
                            </div>
                        ) : (
                            <div className="offline-buttons-area">
                                <div className="offline-notice">
                                    <WifiOff size={20} />
                                    <span>Service temporarily unavailable. Please try again later.</span>
                                </div>
                                <button 
                                    className="retry-btn"
                                    onClick={checkServiceHealth}
                                    disabled={isLoading}
                                >
                                    <RefreshCw size={18} />
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatBot;
