
import { Megaphone, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { announcementAPI } from '../config/api';

const Announcement = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch announcements from server
    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                setLoading(true);
                const data = await announcementAPI.getLatest(3); // Get latest 3 announcements
                setAnnouncements(data.data || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching announcements:', err);
                setError(err.message);
                setAnnouncements([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return(
       <section id="announcement">
            <div className="announcement-container">
                <div className="announcement-header" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="announcement-icon">
                        <Megaphone size={24} />
                    </div>
                    <h3>Announcements</h3>
                    <div className="dropdown-icon">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
                {isExpanded && (
                    <div className="announcement-content">
                        {loading ? (
                            <div className="loading-state">
                                <p>Loading announcements...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>Error loading announcements: {error}</p>
                            </div>
                        ) : announcements.length > 0 ? (
                            announcements.map((announcement, index) => (
                                <div key={announcement._id || announcement.id} className="announcement-item">
                                    <h4>{announcement.title}</h4>
                                    <p>{announcement.description}</p>
                                    <div className="announcement-meta">
                                        <Calendar size={16} />
                                        <span>Posted on <strong>{formatDate(announcement.createdAt)}</strong></span>
                                    </div>
                                    <div className="announcement-meta">
                                        <User size={16} />
                                        <span>Posted by <strong>{announcement.postedBy}</strong></span>
                                    </div>
                                    {index < announcements.length - 1 && <hr className="announcement-divider" />}
                                </div>
                            ))
                        ) : (
                            <div className="no-announcements">
                                <p>No announcements available at this time.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
       </section>
    )
}

export default Announcement