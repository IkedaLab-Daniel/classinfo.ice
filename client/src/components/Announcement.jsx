
import { Megaphone, Calendar, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const Announcement = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return(
       <section id="announcement">
            <div className="announcement-container">
                <div className="announcement-card">
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
                            <h4>Welcome to the New Semester!</h4>
                            <p>Classes will begin on August 5, 2025. Please make sure to check your schedules and prepare all necessary materials. Late enrollment is available until August 10, 2025.</p>
                            <div className="announcement-meta">
                                <Calendar size={16} />
                                <span>Posted on <strong>July 30, 2025</strong></span>
                            </div>
                            <div className="announcement-meta">
                                <User size={16} />
                                <span>Posted by <strong>Admin Office</strong></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
       </section>
    )
}

export default Announcement