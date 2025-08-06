import React, { useState } from 'react';
import { Bell, X, Check, Settings, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const { 
        notifications, 
        getUnreadCount, 
        markAsRead, 
        markAllAsRead, 
        clearAllNotifications,
        removeNotification
    } = useNotification();

    const unreadCount = getUnreadCount();

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} className="notification-icon success" />;
            case 'error':
                return <XCircle size={20} className="notification-icon error" />;
            case 'task_due':
            case 'deadline':
                return <AlertCircle size={20} className="notification-icon warning" />;
            case 'class_starting':
                return <Bell size={20} className="notification-icon info" />;
            default:
                return <Info size={20} className="notification-icon info" />;
        }
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case 'high':
                return 'priority-high';
            case 'medium':
                return 'priority-medium';
            case 'low':
                return 'priority-low';
            default:
                return 'priority-medium';
        }
    };

    const formatRelativeTime = (timestamp) => {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        if (notification.action) {
            notification.action();
            setIsOpen(false);
        }
    };

    return (
        <div className="notification-center">
            <button 
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notifications (${unreadCount} unread)`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-actions">
                            <button 
                                onClick={() => setShowSettings(!showSettings)}
                                className="action-btn"
                                title="Notification Settings"
                            >
                                <Settings size={16} />
                            </button>
                            {notifications.length > 0 && (
                                <>
                                    <button 
                                        onClick={markAllAsRead}
                                        className="action-btn"
                                        title="Mark all as read"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button 
                                        onClick={clearAllNotifications}
                                        className="action-btn"
                                        title="Clear all"
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {showSettings && <NotificationSettings />}

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <Bell size={48} />
                                <p>No notifications yet</p>
                                <span>You're all caught up!</span>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.read ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-content">
                                        <div className="notification-main">
                                            {getNotificationIcon(notification.type)}
                                            <div className="notification-text">
                                                <h4 className="notification-title">{notification.title}</h4>
                                                <p className="notification-message">{notification.message}</p>
                                            </div>
                                        </div>
                                        <div className="notification-meta">
                                            <span className="notification-time">
                                                {formatRelativeTime(notification.timestamp)}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeNotification(notification.id);
                                                }}
                                                className="remove-notification"
                                                title="Remove notification"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    {!notification.read && <div className="unread-indicator" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const NotificationSettings = () => {
    const { settings, updateSettings, requestPermission, browserPermission } = useNotification();

    const handleSettingChange = (key, value) => {
        updateSettings({ [key]: value });
    };

    const handleTimingChange = (type, value) => {
        updateSettings({
            reminderTiming: {
                ...settings.reminderTiming,
                [type]: parseInt(value)
            }
        });
    };

    const handleQuietHoursChange = (key, value) => {
        updateSettings({
            quietHours: {
                ...settings.quietHours,
                [key]: value
            }
        });
    };

    return (
        <div className="notification-settings">
            <h4>Notification Settings</h4>
            
            <div className="setting-group">
                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.browserNotifications}
                            onChange={(e) => {
                                handleSettingChange('browserNotifications', e.target.checked);
                                if (e.target.checked && browserPermission !== 'granted') {
                                    requestPermission();
                                }
                            }}
                        />
                        Browser Notifications
                    </label>
                    {browserPermission === 'denied' && (
                        <small className="permission-denied">
                            Permission denied. Please enable in browser settings.
                        </small>
                    )}
                </div>

                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.taskReminders}
                            onChange={(e) => handleSettingChange('taskReminders', e.target.checked)}
                        />
                        Task Reminders
                    </label>
                </div>

                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.classReminders}
                            onChange={(e) => handleSettingChange('classReminders', e.target.checked)}
                        />
                        Class Reminders
                    </label>
                </div>

                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.deadlineAlerts}
                            onChange={(e) => handleSettingChange('deadlineAlerts', e.target.checked)}
                        />
                        Deadline Alerts
                    </label>
                </div>

                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.soundEnabled}
                            onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                        />
                        Sound Effects
                    </label>
                </div>
            </div>

            <div className="setting-group">
                <h5>Reminder Timing</h5>
                <div className="timing-settings">
                    <div className="timing-item">
                        <label>Tasks:</label>
                        <select
                            value={settings.reminderTiming.tasks}
                            onChange={(e) => handleTimingChange('tasks', e.target.value)}
                        >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={1440}>1 day</option>
                        </select>
                    </div>
                    <div className="timing-item">
                        <label>Classes:</label>
                        <select
                            value={settings.reminderTiming.classes}
                            onChange={(e) => handleTimingChange('classes', e.target.value)}
                        >
                            <option value={5}>5 minutes</option>
                            <option value={10}>10 minutes</option>
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="setting-group">
                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.quietHours.enabled}
                            onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                        />
                        Quiet Hours
                    </label>
                </div>
                {settings.quietHours.enabled && (
                    <div className="quiet-hours-settings">
                        <div className="time-range">
                            <label>From:</label>
                            <input
                                type="time"
                                value={settings.quietHours.start}
                                onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                            />
                            <label>To:</label>
                            <input
                                type="time"
                                value={settings.quietHours.end}
                                onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
