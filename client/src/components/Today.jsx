import { Clock, MapPin, FileText, Calendar, BookOpen, CheckCircle, Play, AlertCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { scheduleAPI } from '../config/api';
import LoadingModal from './LoadingModal';
import useApiWithLoading from '../hooks/useApiWithLoading';

const Today = () => {
    const [schedules, setSchedules] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dayOffset, setDayOffset] = useState(0); // 0 = today, 1 = tomorrow, -1 = yesterday, etc.
    const { isLoading, isServerWaking, error, executeRequest, clearError } = useApiWithLoading();

    // Get current date and selected date in YYYY-MM-DD format
    const getCurrentDate = () => {
        const now = new Date();
        return now.getFullYear() + '-' + 
               String(now.getMonth() + 1).padStart(2, '0') + '-' + 
               String(now.getDate()).padStart(2, '0');
    };

    const getSelectedDateString = () => {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    };

    const today = getCurrentDate();
    console.log('Today (local):', today);
    console.log('Selected date:', getSelectedDateString(), 'Offset:', dayOffset);

    // Navigation functions
    const goToPreviousDay = () => {
        setDayOffset(prev => prev - 1);
    };

    const goToNextDay = () => {
        setDayOffset(prev => prev + 1);
    };

    const goToToday = () => {
        setDayOffset(0);
    };

    // Get display text for the current selected day
    const getDateDisplayText = () => {
        if (dayOffset === 0) return "Today's Schedule";
        if (dayOffset === 1) return "Tomorrow's Schedule";
        if (dayOffset === -1) return "Yesterday's Schedule";
        if (dayOffset > 1) return `${dayOffset} Days From Now`;
        if (dayOffset < -1) return `${Math.abs(dayOffset)} Days Ago`;
    };

    // Get relative date description
    const getRelativeDateText = () => {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        return date.toLocaleDateString('en-US', options);
    };

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
                const selectedDateString = getSelectedDateString();
                const data = await executeRequest(
                    () => scheduleAPI.getByDate(selectedDateString),
                    { 
                        loadingMessage: `Loading ${dayOffset === 0 ? "today's" : dayOffset === 1 ? "tomorrow's" : dayOffset === -1 ? "yesterday's" : "selected day's"} schedule`,
                        serverWakeThreshold: 2500
                    }
                );
                
                console.log('Schedule API Response for', selectedDateString, ':', data);
                console.log('Schedule data:', data.data);
                setSchedules(data.data || []);
            } catch (err) {
                console.error('Error fetching schedules:', err);
                setSchedules([]);
            }
        };

        fetchSchedules();
    }, [executeRequest, dayOffset]); // Add dayOffset as dependency

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
        {/* Loading Modal */}
        <LoadingModal 
            isOpen={isLoading} 
            message={`Loading ${dayOffset === 0 ? "today's" : dayOffset === 1 ? "tomorrow's" : dayOffset === -1 ? "yesterday's" : "selected day's"} schedule`}
            isServerWaking={isServerWaking}
        />
        
        <div className="today-header">
            <div className="date-navigation">
                <button 
                    className="nav-btn nav-prev" 
                    onClick={goToPreviousDay}
                    title="Previous day"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="date-info">
                    <div className="header-icon-title">
                        <Calendar size={24} />
                        <h2>{getDateDisplayText()}</h2>
                    </div>
                    <p className="date-subtitle">{getRelativeDateText()}</p>
                    {dayOffset !== 0 && (
                        <button className="today-btn" onClick={goToToday}>
                            Go to Today
                        </button>
                    )}
                </div>
                
                <button 
                    className="nav-btn nav-next" 
                    onClick={goToNextDay}
                    title="Next day"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
        
        <div className="schedule-cards-container">
            {!isLoading && error ? (
                <div className="error-state">
                    <Calendar size={48} />
                    <p>Error loading schedules: {error}</p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Try Again
                    </button>
                </div>
            ) : !isLoading && schedules.length > 0 ? (
                schedules.map(schedule => (
                    <div key={schedule.id || schedule._id} className="schedule-card" data-aos="fade-up">
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

                            {schedule.description && (
                                <div className="notes-section">
                                <FileText size={16} />
                                <div>
                                    <p className="notes-label">Notes:</p>
                                    <p className="notes">{schedule.description}</p>
                                </div>
                            </div>
                            )}
                            
                            <div className={`status status-${getDisplayStatus(schedule).toLowerCase().replace(' ', '-')}`}>
                                {getStatusIcon(getDisplayStatus(schedule))}
                                <span>{getDisplayStatus(schedule)}</span>
                            </div>
                        </div>     
                    </div>
                ))
            ) : !isLoading ? (
                <div className="no-schedules">
                    <Calendar size={48} />
                    <p>No classes scheduled for {dayOffset === 0 ? 'today' : dayOffset === 1 ? 'tomorrow' : dayOffset === -1 ? 'yesterday' : 'this day'}!</p>
                </div>
            ) : null}
        </div>
       </section>
    )
}

export default Today
