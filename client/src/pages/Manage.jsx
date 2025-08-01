
import { Plus, Calendar, Megaphone, Settings, Users } from 'lucide-react';

const Manage = () => {
    const handleAddSchedule = () => {
        console.log('Add Schedule clicked');
        // TODO: Implement add schedule functionality
    };

    const handleAddAnnouncement = () => {
        console.log('Add Announcement clicked');
        // TODO: Implement add announcement functionality
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
        </section>
    )
}

export default Manage