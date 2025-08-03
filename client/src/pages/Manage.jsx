
import { Plus, Calendar, Megaphone, Settings, Users, X, Save, Edit, Trash2, Clock, MapPin, Eye, ClipboardList, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { scheduleAPI, announcementAPI, taskAPI } from '../config/api';
import LoadingModal from '../components/LoadingModal';
import useApiWithLoading from '../hooks/useApiWithLoading';

const Manage = () => {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [schedules, setSchedules] = useState([]);
    const [schedulesLoading, setSchedulesLoading] = useState(true);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);
    
    // Announcements state
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);
    
    // Tasks state
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [editingTask, setEditingTask] = useState(null);
    const [taskToDelete, setTaskToDelete] = useState(null);
    
    // Active tab state
    const [activeTab, setActiveTab] = useState('schedules');
    
    // Loading modal state
    const { isLoading, loadingMessage, showServerWaking, executeRequest } = useApiWithLoading();

    // Schedule form state
    const [scheduleForm, setScheduleForm] = useState({
        subject: '',
        date: '',
        startTime: '',
        endTime: '',
        room: '',
        description: '',
        status: 'active'
    });

    // Announcement form state
    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        description: '',
        postedBy: ''
    });

    // Task form state
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        type: 'assignment',
        class: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending'
    });

    // Fetch schedules on component mount
    useEffect(() => {
        fetchSchedules();
        fetchAnnouncements();
        fetchTasks();
    }, []);

    const fetchSchedules = async () => {
        try {
            setSchedulesLoading(true);
            const response = await executeRequest(
                () => scheduleAPI.getAll(),
                {
                    loadingMessage: "Loading schedules",
                    showLoading: schedules.length === 0 // Only show modal if no data yet
                }
            );
            setSchedules(response.data || response);
        } catch (error) {
            console.error('Error fetching schedules:', error);
            setMessage({ type: 'error', text: 'Failed to load schedules' });
        } finally {
            setSchedulesLoading(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);
            const response = await executeRequest(
                () => announcementAPI.getAll(),
                {
                    loadingMessage: "Loading announcements",
                    showLoading: announcements.length === 0 // Only show modal if no data yet
                }
            );
            setAnnouncements(response.data || response);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            setMessage({ type: 'error', text: 'Failed to load announcements' });
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            setTasksLoading(true);
            const response = await executeRequest(
                () => taskAPI.getAll({
                    sortBy: 'dueDate',
                    sortOrder: 'desc',
                    limit: 50
                }),
                {
                    loadingMessage: "Loading tasks",
                    showLoading: tasks.length === 0 // Only show modal if no data yet
                }
            );
            if (response && response.success && Array.isArray(response.data)) {
                setTasks(response.data);
            } else {
                setTasks(response.data || response || []);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setMessage({ type: 'error', text: 'Failed to load tasks' });
        } finally {
            setTasksLoading(false);
        }
    };

    const handleAddSchedule = () => {
        setEditingSchedule(null);
        setShowScheduleModal(true);
        setMessage({ type: '', text: '' });
    };

    const handleEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setScheduleForm({
            subject: schedule.subject || '',
            date: schedule.date ? schedule.date.split('T')[0] : '',
            startTime: schedule.startTime || '',
            endTime: schedule.endTime || '',
            room: schedule.room || '',
            description: schedule.description || '',
            status: schedule.status || 'active'
        });
        setShowScheduleModal(true);
        setMessage({ type: '', text: '' });
    };

    const handleDeleteSchedule = (schedule) => {
        setScheduleToDelete(schedule);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteSchedule = async () => {
        if (!scheduleToDelete) return;
        
        try {
            await executeRequest(
                () => scheduleAPI.delete(scheduleToDelete._id),
                { loadingMessage: "Deleting schedule..." }
            );
            setMessage({ type: 'success', text: 'Schedule deleted successfully!' });
            fetchSchedules(); // Refresh the list
            setShowDeleteConfirm(false);
            setScheduleToDelete(null);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete schedule' });
        }
    };

    // Announcement handlers
    const handleEditAnnouncement = (announcement) => {
        setEditingAnnouncement(announcement);
        setAnnouncementForm({
            title: announcement.title || '',
            description: announcement.description || '',
            postedBy: announcement.postedBy || ''
        });
        setShowAnnouncementModal(true);
        setMessage({ type: '', text: '' });
    };

    const handleDeleteAnnouncement = (announcement) => {
        setAnnouncementToDelete(announcement);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteAnnouncement = async () => {
        if (!announcementToDelete) return;
        
        try {
            await executeRequest(
                () => announcementAPI.delete(announcementToDelete._id),
                { loadingMessage: "Deleting announcement..." }
            );
            setMessage({ type: 'success', text: 'Announcement deleted successfully!' });
            fetchAnnouncements(); // Refresh the list
            setShowDeleteConfirm(false);
            setAnnouncementToDelete(null);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete announcement' });
        }
    };

    const handleAddAnnouncement = () => {
        setEditingAnnouncement(null);
        setShowAnnouncementModal(true);
        setMessage({ type: '', text: '' });
    };

    // Task handlers
    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskForm({
            title: task.title || '',
            description: task.description || '',
            type: task.type || 'assignment',
            class: task.class || '',
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
            priority: task.priority || 'medium',
            status: task.status || 'pending'
        });
        setShowTaskModal(true);
        setMessage({ type: '', text: '' });
    };

    const handleDeleteTask = (task) => {
        setTaskToDelete(task);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;
        
        try {
            await executeRequest(
                () => taskAPI.delete(taskToDelete._id),
                { loadingMessage: "Deleting task..." }
            );
            setMessage({ type: 'success', text: 'Task deleted successfully!' });
            fetchTasks(); // Refresh the list
            setShowDeleteConfirm(false);
            setTaskToDelete(null);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete task' });
        }
    };

    const handleAddTask = () => {
        setEditingTask(null);
        setShowTaskModal(true);
        setMessage({ type: '', text: '' });
    };

    const closeModals = () => {
        setShowScheduleModal(false);
        setShowAnnouncementModal(false);
        setShowTaskModal(false);
        setShowDeleteConfirm(false);
        setEditingSchedule(null);
        setScheduleToDelete(null);
        setEditingAnnouncement(null);
        setAnnouncementToDelete(null);
        setEditingTask(null);
        setTaskToDelete(null);
        setMessage({ type: '', text: '' });
        // Reset forms
        setScheduleForm({
            subject: '',
            date: '',
            startTime: '',
            endTime: '',
            room: '',
            description: '',
            status: 'active'
        });
        setAnnouncementForm({
            title: '',
            description: '',
            postedBy: ''
        });
        setTaskForm({
            title: '',
            description: '',
            type: 'assignment',
            class: '',
            dueDate: '',
            priority: 'medium',
            status: 'pending'
        });
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSchedule) {
                await executeRequest(
                    () => scheduleAPI.update(editingSchedule._id, scheduleForm),
                    { loadingMessage: "Updating schedule..." }
                );
                setMessage({ type: 'success', text: 'Schedule updated successfully!' });
            } else {
                await executeRequest(
                    () => scheduleAPI.create(scheduleForm),
                    { loadingMessage: "Creating schedule..." }
                );
                setMessage({ type: 'success', text: 'Schedule created successfully!' });
            }
            fetchSchedules(); // Refresh the list
            setTimeout(() => {
                closeModals();
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || `Failed to ${editingSchedule ? 'update' : 'create'} schedule` });
        }
    };

    const handleAnnouncementSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAnnouncement) {
                await executeRequest(
                    () => announcementAPI.update(editingAnnouncement._id, announcementForm),
                    { loadingMessage: "Updating announcement..." }
                );
                setMessage({ type: 'success', text: 'Announcement updated successfully!' });
            } else {
                await executeRequest(
                    () => announcementAPI.create(announcementForm),
                    { loadingMessage: "Creating announcement..." }
                );
                setMessage({ type: 'success', text: 'Announcement created successfully!' });
            }
            fetchAnnouncements(); // Refresh the list
            setTimeout(() => {
                closeModals();
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || `Failed to ${editingAnnouncement ? 'update' : 'create'} announcement` });
        }
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTask) {
                await executeRequest(
                    () => taskAPI.update(editingTask._id, taskForm),
                    { loadingMessage: "Updating task..." }
                );
                setMessage({ type: 'success', text: 'Task updated successfully!' });
            } else {
                await executeRequest(
                    () => taskAPI.create(taskForm),
                    { loadingMessage: "Creating task..." }
                );
                setMessage({ type: 'success', text: 'Task created successfully!' });
            }
            fetchTasks(); // Refresh the list
            setTimeout(() => {
                closeModals();
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || `Failed to ${editingTask ? 'update' : 'create'} task` });
        }
    };

    const handleScheduleChange = (e) => {
        setScheduleForm({
            ...scheduleForm,
            [e.target.name]: e.target.value
        });
    };

    const handleAnnouncementChange = (e) => {
        setAnnouncementForm({
            ...announcementForm,
            [e.target.name]: e.target.value
        });
    };

    const handleTaskChange = (e) => {
        setTaskForm({
            ...taskForm,
            [e.target.name]: e.target.value
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'status-active';
            case 'completed':
                return 'status-completed';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return 'status-scheduled';
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) + ' at ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getTaskStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'status-completed';
            case 'pending':
                return 'status-scheduled';
            case 'in-progress':
                return 'status-active';
            case 'overdue':
                return 'status-cancelled';
            default:
                return 'status-scheduled';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return '#dc2626';
            case 'high':
                return '#ef4444';
            case 'medium':
                return '#3b82f6';
            case 'low':
                return '#10b981';
            default:
                return '#6b7280';
        }
    };

    return(
        <section id="manage">
            <div className="manage-header">
                <Settings size={24} />
                <h2>Manage</h2>
            </div>
            <p className="manage-subtitle">Add and manage your schedules and announcements</p>
            
            <div className="action-cards-container">
                <div className="action-card schedule-card" id='add-schedule-card' onClick={handleAddSchedule}>
                    <div className="action-card-icon">
                        <Calendar size={32} />
                    </div>
                    <div className="action-card-content">
                        <h3>Add Schedule</h3>
                        <p>Create new class schedules and manage existing ones</p>
                        <div className="action-button">
                            <Plus size={20} />
                            <span>Add New</span>
                        </div>
                    </div>
                </div>

                <div className="action-card announcement-card" onClick={handleAddAnnouncement}>
                    <div className="action-card-icon">
                        <Megaphone size={32} />
                    </div>
                    <div className="action-card-content">
                        <h3>Add Announcement</h3>
                        <p>Post important announcements and updates for students</p>
                        <div className="action-button">
                            <Plus size={20} />
                            <span>Add New</span>
                        </div>
                    </div>
                </div>

                <div className="action-card task-card" onClick={handleAddTask}>
                    <div className="action-card-icon">
                        <ClipboardList size={32} />
                    </div>
                    <div className="action-card-content">
                        <h3>Add Task</h3>
                        <p>Create and manage assignments, projects, and other tasks</p>
                        <div className="action-button">
                            <Plus size={20} />
                            <span>Add New</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedules and Announcements Table */}
            <div className="schedules-section">
                <div className="section-header">
                    <div className="section-tabs">
                        <button 
                            className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
                            onClick={() => setActiveTab('schedules')}
                        >
                            <Calendar size={18} />
                            <span>Schedules</span>
                            <span className="tab-count">{schedules.length}</span>
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
                            onClick={() => setActiveTab('announcements')}
                        >
                            <Megaphone size={18} />
                            <span>Announcements</span>
                            <span className="tab-count">{announcements.length}</span>
                        </button>
                        <button 
                            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tasks')}
                        >
                            <ClipboardList size={18} />
                            <span>Tasks</span>
                            <span className="tab-count">{tasks.length}</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'schedules' ? (
                    <>
                        {schedulesLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading schedules...</p>
                            </div>
                        ) : schedules.length === 0 ? (
                            <div className="no-schedules-container">
                                <Calendar size={48} />
                                <p>No schedules found</p>
                                <button className="add-first-schedule-btn" onClick={handleAddSchedule}>
                                    <Plus size={16} />
                                    Add Your First Schedule
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Schedule Table */}
                                <div className="schedules-table-container desktop-table">
                                    <table className="schedules-table">
                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Date</th>
                                                <th>Time</th>
                                                <th>Room</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedules.map((schedule) => (
                                                <tr key={schedule._id}>
                                                    <td className="subject-cell">
                                                        <div className="subject-info">
                                                            <span className="subject-name">{schedule.subject}</span>
                                                            {schedule.description && (
                                                                <span className="subject-desc">{schedule.description}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{formatDate(schedule.date)}</td>
                                                    <td className="time-cell">
                                                        <div className="time-range">
                                                            <span>{formatTime(schedule.startTime)}</span>
                                                            <span className="time-separator">-</span>
                                                            <span>{formatTime(schedule.endTime)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="room-cell">
                                                        <span className="room-badge">{schedule.room}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${getStatusColor(schedule.status)}`}>
                                                            {schedule.status}
                                                        </span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        <div className="action-buttons">
                                                            <button 
                                                                className="edit-btn"
                                                                onClick={() => handleEditSchedule(schedule)}
                                                                title="Edit Schedule"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                className="delete-btn"
                                                                onClick={() => handleDeleteSchedule(schedule)}
                                                                title="Delete Schedule"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Schedule Cards */}
                                <div className="schedules-mobile-container mobile-cards">
                                    {schedules.map((schedule) => (
                                        <div key={schedule._id} className="schedule-mobile-card">
                                            <div className="mobile-card-header">
                                                <div className="mobile-subject">
                                                    <h4>{schedule.subject}</h4>
                                                    <span className={`status-badge ${getStatusColor(schedule.status)}`}>
                                                        {schedule.status}
                                                    </span>
                                                </div>
                                                <div className="mobile-actions">
                                                    <button 
                                                        className="edit-btn"
                                                        onClick={() => handleEditSchedule(schedule)}
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        className="delete-btn"
                                                        onClick={() => handleDeleteSchedule(schedule)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="mobile-card-body">
                                                <div className="mobile-info-row">
                                                    <div className="mobile-info-item">
                                                        <Calendar size={14} />
                                                        <span>{formatDate(schedule.date)}</span>
                                                    </div>
                                                    <div className="mobile-info-item">
                                                        <Clock size={14} />
                                                        <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mobile-info-row">
                                                    <div className="mobile-info-item">
                                                        <MapPin size={14} />
                                                        <span className="room-badge">{schedule.room}</span>
                                                    </div>
                                                </div>
                                                
                                                {schedule.description && (
                                                    <div className="mobile-description">
                                                        <Eye size={14} />
                                                        <span>{schedule.description}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : activeTab === 'announcements' ? (
                    <>
                        {announcementsLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading announcements...</p>
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="no-schedules-container">
                                <Megaphone size={48} />
                                <p>No announcements found</p>
                                <button className="add-first-schedule-btn" onClick={handleAddAnnouncement}>
                                    <Plus size={16} />
                                    Add Your First Announcement
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Announcements Table */}
                                <div className="schedules-table-container desktop-table">
                                    <table className="schedules-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Description</th>
                                                <th>Posted By</th>
                                                <th>Date Posted</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {announcements.map((announcement) => (
                                                <tr key={announcement._id}>
                                                    <td className="subject-cell">
                                                        <div className="subject-info">
                                                            <span className="subject-name">{announcement.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="description-cell">
                                                        <span className="description-text">
                                                            {announcement.description.length > 100 
                                                                ? `${announcement.description.substring(0, 100)}...` 
                                                                : announcement.description}
                                                        </span>
                                                    </td>
                                                    <td className="posted-by-cell">
                                                        <span className="posted-by-badge">{announcement.postedBy}</span>
                                                    </td>
                                                    <td>{formatDate(announcement.createdAt)}</td>
                                                    <td className="actions-cell">
                                                        <div className="action-buttons">
                                                            <button 
                                                                className="edit-btn"
                                                                onClick={() => handleEditAnnouncement(announcement)}
                                                                title="Edit Announcement"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                className="delete-btn"
                                                                onClick={() => handleDeleteAnnouncement(announcement)}
                                                                title="Delete Announcement"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Announcements Cards */}
                                <div className="schedules-mobile-container mobile-cards">
                                    {announcements.map((announcement) => (
                                        <div key={announcement._id} className="schedule-mobile-card">
                                            <div className="mobile-card-header">
                                                <div className="mobile-subject">
                                                    <h4>{announcement.title}</h4>
                                                </div>
                                                <div className="mobile-actions">
                                                    <button 
                                                        className="edit-btn"
                                                        onClick={() => handleEditAnnouncement(announcement)}
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        className="delete-btn"
                                                        onClick={() => handleDeleteAnnouncement(announcement)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="mobile-card-body">
                                                <div className="mobile-info-row">
                                                    <div className="mobile-info-item">
                                                        <Users size={14} />
                                                        <span className="posted-by-badge">{announcement.postedBy}</span>
                                                    </div>
                                                    <div className="mobile-info-item">
                                                        <Calendar size={14} />
                                                        <span>{formatDate(announcement.createdAt)}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mobile-description">
                                                    <Eye size={14} />
                                                    <span>{announcement.description}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {tasksLoading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading tasks...</p>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="no-schedules-container">
                                <ClipboardList size={48} />
                                <p>No tasks found</p>
                                <button className="add-first-schedule-btn" onClick={handleAddTask}>
                                    <Plus size={16} />
                                    Add Your First Task
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Tasks Table */}
                                <div className="schedules-table-container desktop-table">
                                    <table className="schedules-table">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Type</th>
                                                <th>Class</th>
                                                <th>Due Date</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map((task) => (
                                                <tr key={task._id}>
                                                    <td className="subject-cell">
                                                        <div className="subject-info">
                                                            <span className="subject-name">{task.title}</span>
                                                            {task.description && (
                                                                <span className="subject-desc">
                                                                    {task.description.length > 80 
                                                                        ? `${task.description.substring(0, 80)}...` 
                                                                        : task.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="room-badge">{task.type}</span>
                                                    </td>
                                                    <td className="posted-by-cell">
                                                        <span className="posted-by-badge">{task.class}</span>
                                                    </td>
                                                    <td>{formatDateTime(task.dueDate)}</td>
                                                    <td>
                                                        <span 
                                                            className="status-badge" 
                                                            style={{ 
                                                                backgroundColor: getPriorityColor(task.priority),
                                                                color: 'white' 
                                                            }}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${getTaskStatusColor(task.status)}`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        <div className="action-buttons">
                                                            <button 
                                                                className="edit-btn"
                                                                onClick={() => handleEditTask(task)}
                                                                title="Edit Task"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                className="delete-btn"
                                                                onClick={() => handleDeleteTask(task)}
                                                                title="Delete Task"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Tasks Cards */}
                                <div className="schedules-mobile-container mobile-cards">
                                    {tasks.map((task) => (
                                        <div key={task._id} className="schedule-mobile-card">
                                            <div className="mobile-card-header">
                                                <div className="mobile-subject">
                                                    <h4>{task.title}</h4>
                                                    <span className={`status-badge ${getTaskStatusColor(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <div className="mobile-actions">
                                                    <button 
                                                        className="edit-btn"
                                                        onClick={() => handleEditTask(task)}
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        className="delete-btn"
                                                        onClick={() => handleDeleteTask(task)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="mobile-card-body">
                                                <div className="mobile-info-row">
                                                    <div className="mobile-info-item">
                                                        <Target size={14} />
                                                        <span className="room-badge">{task.type}</span>
                                                    </div>
                                                    <div className="mobile-info-item">
                                                        <Users size={14} />
                                                        <span className="posted-by-badge">{task.class}</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mobile-info-row">
                                                    <div className="mobile-info-item">
                                                        <Clock size={14} />
                                                        <span>{formatDateTime(task.dueDate)}</span>
                                                    </div>
                                                    <div className="mobile-info-item">
                                                        <AlertTriangle size={14} />
                                                        <span 
                                                            style={{ 
                                                                color: getPriorityColor(task.priority),
                                                                fontWeight: '600' 
                                                            }}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {task.description && (
                                                    <div className="mobile-description">
                                                        <Eye size={14} />
                                                        <span>{task.description}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* TODO:
            <div className="quick-stats">
                <div className="stat-item">
                    <div className="stat-icon">
                        <Calendar size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">12</span>
                        <span className="stat-label">Active Schedules</span>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">
                        <Megaphone size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">6</span>
                        <span className="stat-label">Announcements</span>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon">
                        <Users size={20} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-number">48</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                </div>
            </div> */}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <Calendar size={24} />
                                <h3>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</h3>
                            </div>
                            <button className="close-btn" onClick={closeModals}>
                                <X size={20} />
                            </button>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleScheduleSubmit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="subject">Subject *</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={scheduleForm.subject}
                                    onChange={handleScheduleChange}
                                    required
                                    placeholder="Enter subject name"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="date">Date *</label>
                                    <input
                                        type="date"
                                        id="date"
                                        name="date"
                                        value={scheduleForm.date}
                                        onChange={handleScheduleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="room">Room *</label>
                                    <input
                                        type="text"
                                        id="room"
                                        name="room"
                                        value={scheduleForm.room}
                                        onChange={handleScheduleChange}
                                        required
                                        placeholder="e.g., LAB-209"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="startTime">Start Time *</label>
                                    <input
                                        type="time"
                                        id="startTime"
                                        name="startTime"
                                        value={scheduleForm.startTime}
                                        onChange={handleScheduleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="endTime">End Time *</label>
                                    <input
                                        type="time"
                                        id="endTime"
                                        name="endTime"
                                        value={scheduleForm.endTime}
                                        onChange={handleScheduleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={scheduleForm.status}
                                    onChange={handleScheduleChange}
                                >
                                    <option value="active">Active</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={scheduleForm.description}
                                    onChange={handleScheduleChange}
                                    placeholder="Optional description or notes"
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={closeModals}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn">
                                    <Save size={18} />
                                    {editingSchedule ? 'Update' : 'Create'} Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Announcement Modal */}
            {showAnnouncementModal && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <Megaphone size={24} />
                                <h3>{editingAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}</h3>
                            </div>
                            <button className="close-btn" onClick={closeModals}>
                                <X size={20} />
                            </button>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleAnnouncementSubmit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="title">Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={announcementForm.title}
                                    onChange={handleAnnouncementChange}
                                    required
                                    placeholder="Enter announcement title"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="postedBy">Posted By *</label>
                                <input
                                    type="text"
                                    id="postedBy"
                                    name="postedBy"
                                    value={announcementForm.postedBy}
                                    onChange={handleAnnouncementChange}
                                    required
                                    placeholder="e.g., Admin Office, IT Department"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="announcementDescription">Description *</label>
                                <textarea
                                    id="announcementDescription"
                                    name="description"
                                    value={announcementForm.description}
                                    onChange={handleAnnouncementChange}
                                    required
                                    placeholder="Enter the announcement content"
                                    rows="5"
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={closeModals}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn">
                                    <Save size={18} />
                                    {editingAnnouncement ? 'Update' : 'Publish'} Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <ClipboardList size={24} />
                                <h3>{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
                            </div>
                            <button className="close-btn" onClick={closeModals}>
                                <X size={20} />
                            </button>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleTaskSubmit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="taskTitle">Title *</label>
                                <input
                                    type="text"
                                    id="taskTitle"
                                    name="title"
                                    value={taskForm.title}
                                    onChange={handleTaskChange}
                                    required
                                    placeholder="Enter task title"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="taskType">Type *</label>
                                    <select
                                        id="taskType"
                                        name="type"
                                        value={taskForm.type}
                                        onChange={handleTaskChange}
                                        required
                                    >
                                        <option value="assignment">Assignment</option>
                                        <option value="project">Project</option>
                                        <option value="exam">Exam</option>
                                        <option value="quiz">Quiz</option>
                                        <option value="presentation">Presentation</option>
                                        <option value="homework">Homework</option>
                                        <option value="lab">Lab</option>
                                        <option value="reading">Reading</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="taskClass">Class *</label>
                                    <input
                                        type="text"
                                        id="taskClass"
                                        name="class"
                                        value={taskForm.class}
                                        onChange={handleTaskChange}
                                        required
                                        placeholder="e.g., Web Development, Data Science"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="taskDueDate">Due Date *</label>
                                    <input
                                        type="datetime-local"
                                        id="taskDueDate"
                                        name="dueDate"
                                        value={taskForm.dueDate}
                                        onChange={handleTaskChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="taskPriority">Priority *</label>
                                    <select
                                        id="taskPriority"
                                        name="priority"
                                        value={taskForm.priority}
                                        onChange={handleTaskChange}
                                        required
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* <div className="form-group">
                                <label htmlFor="taskStatus">Status *</label>
                                <select
                                    id="taskStatus"
                                    name="status"
                                    value={taskForm.status}
                                    onChange={handleTaskChange}
                                    required
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="overdue">Overdue</option>
                                </select>
                            </div> */}

                            <div className="form-group">
                                <label htmlFor="taskDescription">Description</label>
                                <textarea
                                    id="taskDescription"
                                    name="description"
                                    value={taskForm.description}
                                    onChange={handleTaskChange}
                                    placeholder="Enter task description (optional)"
                                    rows="4"
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={closeModals}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn">
                                    <Save size={18} />
                                    {editingTask ? 'Update' : 'Create'} Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (scheduleToDelete || announcementToDelete || taskToDelete) && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <Trash2 size={24} />
                                <h3>Delete {scheduleToDelete ? 'Schedule' : announcementToDelete ? 'Announcement' : 'Task'}</h3>
                            </div>
                            <button className="close-btn" onClick={closeModals}>
                                <X size={20} />
                            </button>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="modal-form">
                            <div className="delete-confirmation">
                                <div className="delete-icon">
                                    <Trash2 size={32} />
                                </div>
                                <p className="delete-message">
                                    Are you sure you want to delete this {scheduleToDelete ? 'schedule' : announcementToDelete ? 'announcement' : 'task'}?
                                </p>
                                <div className="schedule-info">
                                    {scheduleToDelete ? (
                                        <>
                                            <strong>{scheduleToDelete.subject}</strong>
                                            <span>{formatDate(scheduleToDelete.date)} • {formatTime(scheduleToDelete.startTime)} - {formatTime(scheduleToDelete.endTime)}</span>
                                            <span>Room: {scheduleToDelete.room}</span>
                                        </>
                                    ) : announcementToDelete ? (
                                        <>
                                            <strong>{announcementToDelete.title}</strong>
                                            <span>Posted by: {announcementToDelete.postedBy}</span>
                                            <span>{formatDate(announcementToDelete.createdAt)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <strong>{taskToDelete.title}</strong>
                                            <span>{taskToDelete.type} • {taskToDelete.class}</span>
                                            <span>Due: {formatDateTime(taskToDelete.dueDate)}</span>
                                        </>
                                    )}
                                </div>
                                <p className="warning-text">
                                    This action cannot be undone.
                                </p>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={closeModals}>
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="delete-confirm-btn" 
                                    onClick={scheduleToDelete ? confirmDeleteSchedule : announcementToDelete ? confirmDeleteAnnouncement : confirmDeleteTask}
                                >
                                    <Trash2 size={18} />
                                    Delete {scheduleToDelete ? 'Schedule' : announcementToDelete ? 'Announcement' : 'Task'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <LoadingModal
                isLoading={isLoading}
                message={loadingMessage}
                showServerWaking={showServerWaking}
            />
        </section>
    )
}

export default Manage