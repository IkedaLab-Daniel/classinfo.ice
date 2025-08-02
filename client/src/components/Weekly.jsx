import './Weekly.css'
import { Calendar, Clock, MapPin, StickyNote, CheckCircle, Circle, AlertCircle, XCircle, Coffee } from 'lucide-react';
import { useState, useEffect } from 'react';
import { scheduleAPI } from '../config/api';
import useApiWithLoading from '../hooks/useApiWithLoading';

const Weekly = () => {
    const [weeklySchedules, setWeeklySchedules] = useState([]);
    const { executeRequest, isLoading, error } = useApiWithLoading();

    // Helper function to get current week's date range
    const getCurrentWeekRange = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const startOfWeek = new Date(today);
        
        // Calculate Monday of current week
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        startOfWeek.setDate(today.getDate() - daysFromMonday);
        
        // Calculate Saturday of current week (6 days from Monday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 5);
        
        const formatDate = (date) => {
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
        };
        
        return {
            start: formatDate(startOfWeek),
            end: formatDate(endOfWeek),
            startDate: startOfWeek,
            endDate: endOfWeek
        };
    };

    // Helper function to get status based on schedule timing
    const getScheduleStatus = (schedule) => {
        const now = new Date();
        const scheduleDate = new Date(schedule.date);
        const [startHour, startMinute] = schedule.startTime.split(':');
        const [endHour, endMinute] = schedule.endTime.split(':');
        
        const startDateTime = new Date(scheduleDate);
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
        
        const endDateTime = new Date(scheduleDate);
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        
        if (schedule.status === 'cancelled') {
            return 'cancelled';
        } else if (schedule.status === 'completed' || endDateTime < now) {
            return 'completed';
        } else if (startDateTime <= now && now <= endDateTime) {
            return 'live';
        } else {
            return 'upcoming';
        }
    };

    // Helper function to get status icon and text
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'completed':
                return { icon: CheckCircle, text: 'Completed' };
            case 'live':
                return { icon: AlertCircle, text: 'Live Now' };
            case 'cancelled':
                return { icon: XCircle, text: 'Cancelled' };
            default:
                return { icon: Circle, text: 'Upcoming' };
        }
    };

    // Helper function to format time from 24h to 12h format
    const formatTime = (time24) => {
        const [hour, minute] = time24.split(':');
        const hourInt = parseInt(hour);
        const ampm = hourInt >= 12 ? 'PM' : 'AM';
        const hour12 = hourInt === 0 ? 12 : hourInt > 12 ? hourInt - 12 : hourInt;
        return `${hour12}:${minute}${ampm}`;
    };

    // Helper function to get day name and date
    const getDayInfo = (dayIndex, startDate) => {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDate = new Date(startDate);
        targetDate.setDate(startDate.getDate() + dayIndex);
        
        return {
            name: dayNames[dayIndex],
            date: targetDate.getDate(),
            fullDate: targetDate.toISOString().split('T')[0]
        };
    };

    // Group schedules by day
    const groupSchedulesByDay = (schedules, weekRange) => {
        const groupedSchedules = {};
        
        // Initialize all days of the week (Monday to Saturday)
        for (let i = 0; i < 6; i++) {
            const dayInfo = getDayInfo(i, weekRange.startDate);
            groupedSchedules[dayInfo.fullDate] = [];
        }
        
        // Ensure schedules is an array before processing
        const schedulesArray = Array.isArray(schedules) ? schedules : [];
        
        // Group schedules by date
        schedulesArray.forEach(schedule => {
            const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
            if (groupedSchedules[scheduleDate]) {
                groupedSchedules[scheduleDate].push({
                    ...schedule,
                    status: getScheduleStatus(schedule)
                });
            }
        });
        
        return groupedSchedules;
    };

    // Fetch weekly schedules
    useEffect(() => {
        const fetchWeeklySchedules = async () => {
            try {
                const weekRange = getCurrentWeekRange();
                const schedulesData = await executeRequest(
                    () => scheduleAPI.getRange(weekRange.start, weekRange.end),
                    { loadingMessage: "Loading weekly schedule..." }
                );
                
                console.log("API Response:", schedulesData);
                
                // Extract schedules array from API response
                let schedulesArray = [];
                if (schedulesData && schedulesData.data && Array.isArray(schedulesData.data)) {
                    schedulesArray = schedulesData.data;
                } else if (Array.isArray(schedulesData)) {
                    schedulesArray = schedulesData;
                }
                
                setWeeklySchedules(schedulesArray);
                console.log("Processed schedules:", schedulesArray);
            } catch (error) {
                console.error('Failed to fetch weekly schedules:', error);
                setWeeklySchedules([]);
            }
        };

        fetchWeeklySchedules();
    }, [executeRequest]);

    const weekRange = getCurrentWeekRange();
    const groupedSchedules = groupSchedulesByDay(weeklySchedules, weekRange);

    return(
        <section id="weekly">
            <div className="weekly-container">
                <div className="weekly-header">
                    <h3><Calendar size={24} style={{display: 'inline', marginRight: '8px'}} />Weekly Schedule</h3>
                    <p>{new Date(weekRange.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(weekRange.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                </div>
                {error && (
                    <div className="error-message" style={{color: 'red', textAlign: 'center', margin: '20px 0'}}>
                        Error loading schedules: {error}
                    </div>
                )}
                <div className="calendar">
                    {Array.from({ length: 6 }, (_, dayIndex) => {
                        const dayInfo = getDayInfo(dayIndex, weekRange.startDate);
                        const daySchedules = groupedSchedules[dayInfo.fullDate] || [];
                        
                        return (
                            <div key={dayInfo.fullDate} className="day-card">
                                <div className="day-header">
                                    <p className="day">{dayInfo.name}</p>
                                    <p className="date">{dayInfo.date}</p>
                                </div>
                                <div className="day-content">
                                    {daySchedules.length === 0 ? (
                                        <div className="no-class">
                                            <Coffee size={50}/>
                                            <p>No Class</p>
                                        </div>
                                    ) : (
                                        daySchedules.map((schedule) => {
                                            const statusDisplay = getStatusDisplay(schedule.status);
                                            const StatusIcon = statusDisplay.icon;
                                            
                                            return (
                                                <div key={schedule._id} className={`schedule-card ${schedule.status}`}>
                                                    <p className="status-label">
                                                        <StatusIcon size={16}/>
                                                        <p>{statusDisplay.text}</p>
                                                    </p>
                                                    <p className="sched-title">{schedule.subject}</p>
                                                    <p className="time">
                                                        <Clock size={16} style={{display: 'inline', marginRight: '6px'}} />
                                                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                                    </p>
                                                    <p className="location">
                                                        <MapPin size={16} style={{display: 'inline', marginRight: '6px'}} />
                                                        {schedule.room}
                                                    </p>
                                                    {schedule.description && (
                                                        <>
                                                            <p className="note">
                                                                <StickyNote size={16} style={{display: 'inline', marginRight: '6px'}} />
                                                                Note:
                                                            </p>
                                                            <p className="note-content">{schedule.description}</p>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    )
}

export default Weekly