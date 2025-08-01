
import { Plus, Calendar, Megaphone, Settings, Users, X, Save, Edit, Trash2, Clock, MapPin, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { scheduleAPI, announcementAPI } from '../config/api';

const Manage = () => {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [loading, setLoading] = useState(false);
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
    
    // Active tab state
    const [activeTab, setActiveTab] = useState('schedules');

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

    // Fetch schedules on component mount
    useEffect(() => {
        fetchSchedules();
        fetchAnnouncements();
    }, []);

    const fetchSchedules = async () => {
        try {
            setSchedulesLoading(true);
            const response = await scheduleAPI.getAll();
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
            const response = await announcementAPI.getAll();
            setAnnouncements(response.data || response);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            setMessage({ type: 'error', text: 'Failed to load announcements' });
        } finally {
            setAnnouncementsLoading(false);
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
        
        setLoading(true);
        try {
            await scheduleAPI.delete(scheduleToDelete._id);
            setMessage({ type: 'success', text: 'Schedule deleted successfully!' });
            fetchSchedules(); // Refresh the list
            setShowDeleteConfirm(false);
            setScheduleToDelete(null);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete schedule' });
        } finally {
            setLoading(false);
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
        
        setLoading(true);
        try {
            await announcementAPI.delete(announcementToDelete._id);
            setMessage({ type: 'success', text: 'Announcement deleted successfully!' });
            fetchAnnouncements(); // Refresh the list
            setShowDeleteConfirm(false);
            setAnnouncementToDelete(null);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete announcement' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddAnnouncement = () => {
        setEditingAnnouncement(null);
        setShowAnnouncementModal(true);
        setMessage({ type: '', text: '' });
    };

    const closeModals = () => {
        setShowScheduleModal(false);
        setShowAnnouncementModal(false);
        setShowDeleteConfirm(false);
        setEditingSchedule(null);
        setScheduleToDelete(null);
        setEditingAnnouncement(null);
        setAnnouncementToDelete(null);
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
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingSchedule) {
                await scheduleAPI.update(editingSchedule._id, scheduleForm);
                setMessage({ type: 'success', text: 'Schedule updated successfully!' });
            } else {
                await scheduleAPI.create(scheduleForm);
                setMessage({ type: 'success', text: 'Schedule created successfully!' });
            }
            fetchSchedules(); // Refresh the list
            setTimeout(() => {
                closeModals();
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || `Failed to ${editingSchedule ? 'update' : 'create'} schedule` });
        } finally {
            setLoading(false);
        }
    };

    const handleAnnouncementSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingAnnouncement) {
                await announcementAPI.update(editingAnnouncement._id, announcementForm);
                setMessage({ type: 'success', text: 'Announcement updated successfully!' });
            } else {
                await announcementAPI.create(announcementForm);
                setMessage({ type: 'success', text: 'Announcement created successfully!' });
            }
            fetchAnnouncements(); // Refresh the list
            setTimeout(() => {
                closeModals();
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || `Failed to ${editingAnnouncement ? 'update' : 'create'} announcement` });
        } finally {
            setLoading(false);
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

    return(
        <section id="manage">
            <div className="manage-header">
                <Settings size={24} />
                <h2>Manage</h2>
            </div>
            <p className="manage-subtitle">Add and manage your schedules and announcements</p>
            
            <div className="action-cards-container">
                <div className="action-card schedule-card" onClick={handleAddSchedule}>
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
                ) : (
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
                )}
            </div>

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
            </div>

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
                                <button type="submit" className="save-btn" disabled={loading}>
                                    <Save size={18} />
                                    {loading ? `${editingSchedule ? 'Updating' : 'Creating'}...` : `${editingSchedule ? 'Update' : 'Create'} Schedule`}
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
                                <button type="submit" className="save-btn" disabled={loading}>
                                    <Save size={18} />
                                    {loading ? `${editingAnnouncement ? 'Updating' : 'Publishing'}...` : `${editingAnnouncement ? 'Update' : 'Publish'} Announcement`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (scheduleToDelete || announcementToDelete) && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">
                                <Trash2 size={24} />
                                <h3>Delete {scheduleToDelete ? 'Schedule' : 'Announcement'}</h3>
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
                                    Are you sure you want to delete this {scheduleToDelete ? 'schedule' : 'announcement'}?
                                </p>
                                <div className="schedule-info">
                                    {scheduleToDelete ? (
                                        <>
                                            <strong>{scheduleToDelete.subject}</strong>
                                            <span>{formatDate(scheduleToDelete.date)} • {formatTime(scheduleToDelete.startTime)} - {formatTime(scheduleToDelete.endTime)}</span>
                                            <span>Room: {scheduleToDelete.room}</span>
                                        </>
                                    ) : (
                                        <>
                                            <strong>{announcementToDelete.title}</strong>
                                            <span>Posted by: {announcementToDelete.postedBy}</span>
                                            <span>{formatDate(announcementToDelete.createdAt)}</span>
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
                                    onClick={scheduleToDelete ? confirmDeleteSchedule : confirmDeleteAnnouncement}
                                    disabled={loading}
                                >
                                    <Trash2 size={18} />
                                    {loading ? 'Deleting...' : `Delete ${scheduleToDelete ? 'Schedule' : 'Announcement'}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default Manage