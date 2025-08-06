import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// Also export as useNotifications for backward compatibility
export const useNotifications = useNotification;

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [browserPermission, setBrowserPermission] = useState('default');
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('notificationSettings');
        return saved ? JSON.parse(saved) : {
            browserNotifications: true,
            taskReminders: true,
            classReminders: true,
            deadlineAlerts: true,
            reminderTiming: {
                tasks: 30, // minutes before due
                classes: 15, // minutes before class
                deadlines: 60 // minutes before deadline
            },
            soundEnabled: true,
            quietHours: {
                enabled: false,
                start: '22:00',
                end: '08:00'
            }
        };
    });

    // Request browser notification permission on load
    useEffect(() => {
        if ('Notification' in window) {
            setBrowserPermission(Notification.permission);
            if (Notification.permission === 'default') {
                // Auto-request permission when user enables notifications
                if (settings.browserNotifications) {
                    requestPermission();
                }
            }
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
    }, [settings]);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setBrowserPermission(permission);
            return permission === 'granted';
        }
        return false;
    };

    const addNotification = (notification) => {
        const id = Date.now() + Math.random();
        const newNotification = {
            id,
            timestamp: new Date(),
            read: false,
            ...notification
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show browser notification if enabled
        if (settings.browserNotifications && browserPermission === 'granted') {
            showBrowserNotification(newNotification);
        }
        
        // Auto-remove notification after delay (if not persistent)
        if (!notification.persistent) {
            setTimeout(() => {
                removeNotification(id);
            }, notification.duration || 5000);
        }
        
        return id;
    };

    const showBrowserNotification = (notification) => {
        if (!isQuietHours() && 'Notification' in window && browserPermission === 'granted') {
            const browserNotif = new Notification(notification.title, {
                body: notification.message,
                icon: '/vite.svg', // Your app icon
                badge: '/vite.svg',
                tag: notification.type || 'general',
                requireInteraction: notification.persistent || false,
                data: notification
            });

            browserNotif.onclick = () => {
                window.focus();
                if (notification.action) {
                    notification.action();
                }
                browserNotif.close();
            };

            // Auto-close after 5 seconds if not persistent
            if (!notification.persistent) {
                setTimeout(() => browserNotif.close(), 5000);
            }
        }
    };

    const isQuietHours = () => {
        if (!settings.quietHours.enabled) return false;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const start = timeStringToMinutes(settings.quietHours.start);
        const end = timeStringToMinutes(settings.quietHours.end);
        
        if (start < end) {
            return currentTime >= start && currentTime <= end;
        } else {
            // Handles overnight quiet hours (e.g., 22:00 to 08:00)
            return currentTime >= start || currentTime <= end;
        }
    };

    const timeStringToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
    };

    const markAsRead = (id) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === id ? { ...notif, read: true } : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    // Notification helper functions
    const notifyTaskDue = (task) => {
        addNotification({
            type: 'task_due',
            title: 'Task Due Soon!',
            message: `"${task.title}" is due ${formatDueTime(task.dueDate)}`,
            priority: task.priority === 'urgent' ? 'high' : 'medium',
            persistent: task.priority === 'urgent',
            action: () => {
                // Scroll to tasks section or navigate to manage
                const tasksSection = document.getElementById('tasks');
                if (tasksSection) {
                    tasksSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    };

    const notifyClassStarting = (schedule) => {
        addNotification({
            type: 'class_starting',
            title: 'Class Starting Soon!',
            message: `${schedule.subject} starts at ${formatTime(schedule.startTime)} in ${schedule.room}`,
            priority: 'medium',
            persistent: false,
            action: () => {
                const todaySection = document.getElementById('today');
                if (todaySection) {
                    todaySection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    };

    const notifyDeadlineApproaching = (item, timeUntil) => {
        addNotification({
            type: 'deadline',
            title: 'Deadline Approaching!',
            message: `${item.title} deadline in ${timeUntil}`,
            priority: 'high',
            persistent: true
        });
    };

    const notifySuccess = (message) => {
        addNotification({
            type: 'success',
            title: 'Success!',
            message,
            priority: 'low',
            duration: 3000
        });
    };

    const notifyError = (message) => {
        addNotification({
            type: 'error',
            title: 'Error',
            message,
            priority: 'high',
            duration: 7000
        });
    };

    const notifyInfo = (title, message) => {
        addNotification({
            type: 'info',
            title,
            message,
            priority: 'low',
            duration: 4000
        });
    };

    const formatDueTime = (dueDate) => {
        const due = new Date(dueDate);
        const now = new Date();
        const diffMs = due - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        if (diffHours < 1) {
            const diffMinutes = Math.round(diffMs / (1000 * 60));
            return `in ${diffMinutes} minutes`;
        } else if (diffHours < 24) {
            return `in ${Math.round(diffHours)} hours`;
        } else {
            return `on ${due.toLocaleDateString()}`;
        }
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getUnreadCount = () => {
        return notifications.filter(notif => !notif.read).length;
    };

    const scheduleNotification = (notification) => {
        const { scheduledTime, ...notificationData } = notification;
        const now = new Date();
        const delay = new Date(scheduledTime) - now;
        
        if (delay > 0) {
            setTimeout(() => {
                addNotification(notificationData);
            }, delay);
            return true;
        } else {
            // If scheduled time is in the past, show immediately
            addNotification(notificationData);
            return false;
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            settings,
            browserPermission,
            addNotification,
            scheduleNotification,
            removeNotification,
            markAsRead,
            markAllAsRead,
            clearAllNotifications,
            updateSettings,
            requestPermission,
            getUnreadCount,
            // Helper functions
            notifyTaskDue,
            notifyClassStarting,
            notifyDeadlineApproaching,
            notifySuccess,
            notifyError,
            notifyInfo
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
