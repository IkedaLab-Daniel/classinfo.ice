import { Clock, MapPin, FileText, Calendar, BookOpen } from 'lucide-react';
import sampleData from '../data/sampleSchedules.json';

const Today = () => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Filter schedules for today
    const todaySchedules = sampleData.schedules.filter(schedule => 
        schedule.date === today
    );

    // Format time for display
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes}${ampm}`;
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
            {todaySchedules.length > 0 ? (
                todaySchedules.map(schedule => (
                    <div key={schedule.id} className="schedule-card">
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
                            <p className="status">{schedule.status}</p>
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
