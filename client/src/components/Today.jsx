import { Clock, MapPin, FileText, Calendar, BookOpen, CheckCircle, Play, AlertCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const Today = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Function to determine display status based on current time
    const getDisplayStatus = (schedule) => {
        // If status is cancelled, don't change it
        if (schedule.status.toLowerCase() === 'cancelled') {
            return schedule.status;
        }

        // Only modify "active" status based on current time
        if (schedule.status.toLowerCase() === 'active') {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5); // Get HH:MM format
            
            // Check if current time is within the schedule time range
            if (currentTime >= schedule.startTime && currentTime <= schedule.endTime) {
                return 'Live Now';
            }
            // Check if current time is after the schedule's end time
            else if (currentTime > schedule.endTime) {
                return 'Completed';
            } 
            // Current time is before the schedule's start time
            else {
                return 'Upcoming';
            }
        }

        // For other statuses (completed, etc.), return as is
        return schedule.status;
    };

    // Function to get status icon
    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <CheckCircle size={14} />;
            case 'live now':
                return <Play size={14} />;
            case 'upcoming':
                return <Clock size={14} />;
            case 'cancelled':
                return <XCircle size={14} />;
            case 'active':
                return <CheckCircle size={14} />;
            case 'scheduled':
                return <Calendar size={14} />;
            default:
                return <AlertCircle size={14} />;
        }
    };

    // Fetch schedules from server
    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5001/api/schedules');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('API Response:', data);
                console.log('Schedules data:', data.data);
                setSchedules(data.data || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching schedules:', err);
                setError(err.message);
                setSchedules([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, []);

    // Debug: Log schedules when they change
    useEffect(() => {
        console.log('Schedules state updated:', schedules);
        console.log('Number of schedules:', schedules.length);
    }, [schedules]);

    // Filter schedules for today
    const todaySchedules = schedules.filter(schedule => {
        // Parse the ISO date string to get just the date part
        const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
        console.log(`Schedule: ${schedule.subject}, Date: ${scheduleDate}, Today: ${today}, Match: ${scheduleDate === today}`);
        return scheduleDate === today;
    });

    console.log('Today schedules:', todaySchedules);

    // Format time for display
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

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
       <section id="today">
        <div className="today-header">
            <Calendar size={24} />
            <h2>Today's Schedule</h2>
        </div>
        <p>{formatDate(today)}</p>
        
        <div className="schedule-cards-container">
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading today's schedules...</p>
                </div>
            ) : error ? (
                <div className="error-state">
                    <Calendar size={48} />
                    <p>Error loading schedules: {error}</p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Try Again
                    </button>
                </div>
            ) : todaySchedules.length > 0 ? (
                todaySchedules.map(schedule => (
                    <div key={schedule.id || schedule._id} className="schedule-card">
                        <div className="head">
                            <BookOpen size={20} />
                            <p className="subject">{schedule.subject}</p>
                        </div>           
                        <div className="body">
                            <div className="time-info">
                                <Clock size={16} />
                                <p className="time">
                                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                </p>
                            </div>
                            <div className="room-info">
                                <MapPin size={16} />
                                <p className="room">{schedule.room}</p>
                            </div>
                            <div className="notes-section">
                                <FileText size={16} />
                                <div>
                                    <p className="notes-label">Notes:</p>
                                    <p className="notes">{schedule.description}</p>
                                </div>
                            </div>
                            <div className={`status status-${getDisplayStatus(schedule).toLowerCase().replace(' ', '-')}`}>
                                {getStatusIcon(getDisplayStatus(schedule))}
                                <span>{getDisplayStatus(schedule)}</span>
                            </div>
                        </div>     
                    </div>
                ))
            ) : (
                <div className="no-schedules">
                    <Calendar size={48} />
                    <p>No classes scheduled for today!</p>
                </div>
            )}
        </div>
       </section>
    )
}

export default Today
