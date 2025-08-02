import './Weekly.css'
import { Calendar, Clock, MapPin, StickyNote, CheckCircle, Circle, AlertCircle, XCircle, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { scheduleAPI } from '../config/api';
import useApiWithLoading from '../hooks/useApiWithLoading';

const Weekly = () => {
    const [weeklySchedules, setWeeklySchedules] = useState([]);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, -1 = previous week, +1 = next week
    const { executeRequest, isLoading, error } = useApiWithLoading();

    // Helper function to get current week's date range
    const getCurrentWeekRange = (weekOffset = 0) => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const startOfWeek = new Date(today);
        
        // Calculate Monday of current week
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        startOfWeek.setDate(today.getDate() - daysFromMonday);
        
        // Apply week offset (add/subtract weeks)
        startOfWeek.setDate(startOfWeek.getDate() + (weekOffset * 7));
        
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
        
        // Use consistent date formatting
        const fullDate = targetDate.getFullYear() + '-' + 
                         String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(targetDate.getDate()).padStart(2, '0');
        
        console.log(`Day ${dayIndex} (${dayNames[dayIndex]}):`, fullDate);
        
        return {
            name: dayNames[dayIndex],
            date: targetDate.getDate(),
            fullDate: fullDate
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
        
        console.log('Grouping schedules:');
        console.log('Week range:', weekRange);
        console.log('Available days:', Object.keys(groupedSchedules));
        console.log('Schedules to group:', schedulesArray);
        
        // Group schedules by date
        schedulesArray.forEach(schedule => {
            // Handle UTC date properly - create date from the ISO string and get local date
            const scheduleDate = new Date(schedule.date);
            const localDateString = scheduleDate.getFullYear() + '-' + 
                                   String(scheduleDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                   String(scheduleDate.getDate()).padStart(2, '0');
            
            console.log(`Schedule "${schedule.subject}" date:`, schedule.date, '-> local:', localDateString);
            
            if (groupedSchedules[localDateString]) {
                groupedSchedules[localDateString].push({
                    ...schedule,
                    status: getScheduleStatus(schedule)
                });
                console.log(`✓ Added to ${localDateString}`);
            } else {
                console.log(`✗ No matching day for ${localDateString}. Available:`, Object.keys(groupedSchedules));
            }
        });
        
        console.log('Final grouped schedules:', groupedSchedules);
        return groupedSchedules;
    };

    // Fetch weekly schedules
    useEffect(() => {
        const fetchWeeklySchedules = async () => {
            try {
                const weekRange = getCurrentWeekRange(currentWeekOffset);
                const schedulesData = await executeRequest(
                    () => scheduleAPI.getRange(weekRange.start, weekRange.end),
                    { loadingMessage: "Loading weekly schedule..." }
                );
                
                console.log("API Response:", schedulesData);
                
                // ? Extract schedules array from API response
                let schedulesArray = [];
                if (schedulesData && schedulesData.data && Array.isArray(schedulesData.data)) {
                    schedulesArray = schedulesData.data;
                } else if (Array.isArray(schedulesData)) {
                    schedulesArray = schedulesData;
                }
                
                setWeeklySchedules(schedulesArray);
                // > console.log > debugger
                console.log("Processed schedules:", schedulesArray);
            } catch (error) {
                console.error('Failed to fetch weekly schedules:', error);
                setWeeklySchedules([]);
            }
        };

        fetchWeeklySchedules();
    }, [executeRequest, currentWeekOffset]); // Add currentWeekOffset to dependency array

    // Navigation functions
    const goToPreviousWeek = () => {
        setCurrentWeekOffset(prev => prev - 1);
    };

    const goToNextWeek = () => {
        setCurrentWeekOffset(prev => prev + 1);
    };

    const goToCurrentWeek = () => {
        setCurrentWeekOffset(0);
    };

    const weekRange = getCurrentWeekRange(currentWeekOffset);
    const groupedSchedules = groupSchedulesByDay(weeklySchedules, weekRange);

    return(
        <section id="weekly">
            <div className="weekly-container">
                <div className="weekly-header">
                    <div className="week-navigation">
                        <button 
                            className="nav-button prev-button" 
                            onClick={goToPreviousWeek}
                            aria-label="Previous week"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        
                        <div className="week-info">
                            <h2><Calendar size={24} style={{display: 'inline', marginRight: '8px'}} />Weekly Schedule</h2>
                            <p>{new Date(weekRange.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(weekRange.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                            {currentWeekOffset !== 0 && (
                                <button 
                                    className="current-week-button" 
                                    onClick={goToCurrentWeek}
                                >
                                    Go to Current Week
                                </button>
                            )}
                        </div>
                        
                        <button 
                            className="nav-button next-button" 
                            onClick={goToNextWeek}
                            aria-label="Next week"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
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
                                                    <div className="status-label">
                                                        <StatusIcon size={16}/>
                                                        <p>{statusDisplay.text}</p>
                                                    </div>
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