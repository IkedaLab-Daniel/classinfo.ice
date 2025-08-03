import "./tasks.css"
import { useState, useEffect } from 'react';
import { taskAPI } from '../config/api';
import useApiWithLoading from '../hooks/useApiWithLoading';
import { 
    ClipboardList, 
    CheckCircle, 
    Clock, 
    Calendar,
    AlertTriangle,
    BookOpen,
    FileText,
    Presentation,
    GraduationCap,
    Beaker,
    Brain,
    Lightbulb,
    Target,
    CircleDot,
    Play,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Coffee,
    Loader2
} from "lucide-react";

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const { executeRequest, isLoading, isServerWaking, error } = useApiWithLoading();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await executeRequest(
                () => taskAPI.getAll({ 
                    sortBy: 'dueDate', 
                    sortOrder: 'asc',
                    limit: 20 
                }),
                { 
                    loadingMessage: 'Loading tasks...',
                    serverWakeThreshold: 3000 
                }
            );
            
            console.log('Tasks API Response:', response);
            
            if (response && response.success && Array.isArray(response.data)) {
                setTasks(response.data);
            } else {
                console.warn('Unexpected API response format:', response);
                setTasks([]);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setTasks([]);
        }
    };

    // Helper function to get appropriate icon based on task type
    const getTaskTypeIcon = (type) => {
        const iconMap = {
            'assignment': FileText,
            'project': Target,
            'exam': GraduationCap,
            'quiz': Brain,
            'presentation': Presentation,
            'homework': BookOpen,
            'lab': Beaker,
            'reading': BookOpen,
            'other': Target
        };
        return iconMap[type] || Target;
    };

    // Helper function to get appropriate icon based on subject/class
    const getSubjectIcon = (className) => {
        const lowerClass = className.toLowerCase();
        if (lowerClass.includes('web') || lowerClass.includes('frontend') || lowerClass.includes('react')) {
            return BookOpen;
        } else if (lowerClass.includes('ai') || lowerClass.includes('ml') || lowerClass.includes('machine')) {
            return Brain;
        } else if (lowerClass.includes('data')) {
            return Beaker;
        }
        return GraduationCap;
    };

    // Helper function to get status icon
    const getStatusIcon = (status) => {
        const iconMap = {
            'pending': CircleDot,
            'in-progress': Play,
            'completed': CheckCircle2,
            'overdue': AlertCircle,
            'cancelled': XCircle
        };
        return iconMap[status] || CircleDot;
    };

    // Helper function to get priority icon
    const getPriorityIcon = (priority) => {
        const iconMap = {
            'urgent': AlertTriangle,
            'high': AlertTriangle,
            'medium': Brain,
            'low': Lightbulb
        };
        return iconMap[priority] || Brain;
    };

    // Helper function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        // Use UTC methods to avoid timezone conversion
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        
        // Create a new date using local date components to avoid timezone issues
        const localDate = new Date(year, month, day);
        
        return localDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    // Helper function to format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        // Use UTC methods to get the intended time
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        
        // Create a new date with UTC time components
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        
        return timeDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    // Helper function to calculate days remaining
    const getDaysRemaining = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        
        // Get current date in local time (start of day)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Get due date in UTC but treat as local date (start of day)
        const dueDay = new Date(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
        
        // Calculate difference in days
        const diffTime = dueDay.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return 'Overdue!';
        } else if (diffDays === 0) {
            return 'Due Today';
        } else if (diffDays === 1) {
            return '1 Day remaining';
        } else {
            return `${diffDays} Days remaining`;
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <section id="tasks">
                <div className="tasks-container">
                    <div className="tasks-header">
                        <ClipboardList size={24} />
                        <h2>Tasks</h2>
                    </div>
                    <div className="loading-container">
                        <Loader2 size={48} className="loading-spinner" />
                        <p>{isServerWaking ? 'Waking up server...' : 'Loading tasks...'}</p>
                    </div>
                </div>
            </section>
        );
    }

    // Error state
    if (error) {
        return (
            <section id="tasks">
                <div className="tasks-container">
                    <div className="tasks-header">
                        <ClipboardList size={24} />
                        <h2>Tasks</h2>
                    </div>
                    <div className="error-container">
                        <AlertCircle size={48} />
                        <p>Error loading tasks: {error}</p>
                        <button onClick={fetchTasks} className="retry-button">Try Again</button>
                    </div>
                </div>
            </section>
        );
    }

    // Empty state
    if (tasks.length === 0) {
        return (
            <section id="tasks">
                <div className="tasks-container">
                    <div className="tasks-header">
                        <ClipboardList size={24} />
                        <h2>Tasks</h2>
                    </div>
                    <div className="no-tasks">
                        <Coffee size={50} />
                        <p>No tasks found</p>
                        <p>All caught up!</p>
                    </div>
                </div>
            </section>
        );
    }

    return(
        <section id="tasks">
            <div className="tasks-container">
                <div className="tasks-header">
                    <ClipboardList size={24} />
                    <h2>Tasks</h2>
                </div>

                <div className="task-cards-container">
                    {tasks.map((task) => {
                        const StatusIcon = getStatusIcon(task.status);
                        const TaskTypeIcon = getTaskTypeIcon(task.type);
                        const SubjectIcon = getSubjectIcon(task.class);
                        const PriorityIcon = getPriorityIcon(task.priority);
                        
                        return (
                            <div key={task._id} className={`task-card ${task.status}`}>
                                <div className="head">
                                    <div className="status-icon-wrapper">
                                        <StatusIcon size={20} className="task-status-icon" />
                                        <p className="task-status">{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</p>
                                    </div>
                                    
                                    <div className="subject">
                                        <p><SubjectIcon size={14} />{task.class}</p>
                                    </div>
                                </div>

                                <div className="content">
                                    <div className="task-title">
                                        {/* <TaskTypeIcon size={18} /> */}
                                        <p className="title">{task.title}</p>
                                    </div>
                                    <p className="description">{task.description || 'No description provided'}</p>
                                    <div className="due-info">
                                        <div className="due-date-info">
                                            <Calendar size={16} />
                                            <span className="due-date-label">Due Date:</span>
                                            <span className="due-date">{formatDate(task.dueDate)}</span>
                                        </div>
                                        <div className="due-time-info">
                                            <Clock size={16} />
                                            <span className="due-time-label">At:</span>
                                            <span className="due-time">{formatTime(task.dueDate)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="foot">
                                    <div className="priority-container">
                                        <PriorityIcon size={16} />
                                        <p className={`priority ${task.priority}`}>{task.priority.toUpperCase()}</p>
                                    </div>
                                    <p>{getDaysRemaining(task.dueDate)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    )
}

export default Tasks