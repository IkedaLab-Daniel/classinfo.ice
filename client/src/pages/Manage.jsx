
import { Plus, Calendar, Megaphone, Settings, Users, X, Save } from 'lucide-react';
import { useState } from 'react';
import { scheduleAPI, announcementAPI } from '../config/api';

const Manage = () => {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

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

    const handleAddSchedule = () => {
        setShowScheduleModal(true);
        setMessage({ type: '', text: '' });
    };

    const handleAddAnnouncement = () => {
        setShowAnnouncementModal(true);
        setMessage({ type: '', text: '' });
    };

    const closeModals = () => {
        setShowScheduleModal(false);
        setShowAnnouncementModal(false);
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
            await scheduleAPI.create(scheduleForm);
            setMessage({ type: 'success', text: 'Schedule created successfully!' });
            setTimeout(() => {
                closeModals();
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to create schedule' });
        } finally {
            setLoading(false);
        }
    };

    const handleAnnouncementSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await announcementAPI.create(announcementForm);
            setMessage({ type: 'success', text: 'Announcement created successfully!' });
            setTimeout(() => {
                closeModals();
            }, 2000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Failed to create announcement' });
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
                                <h3>Add New Schedule</h3>
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
                                    {loading ? 'Creating...' : 'Create Schedule'}
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
                                <h3>Add New Announcement</h3>
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
                                    {loading ? 'Publishing...' : 'Publish Announcement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default Manage