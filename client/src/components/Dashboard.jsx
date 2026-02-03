
import { Cloud, CheckSquare, BookOpen, Sun, CloudRain, Snowflake, IceCream, AlertCircle, Calendar, Clock, MapPin, Users, ChevronDown, ChevronUp, Moon, Sunset } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import LoadingModal from './LoadingModal';
import useApiWithLoading from '../hooks/useApiWithLoading';
import { taskAPI, scheduleAPI } from '../config/api';

// > images
import ice from '../assets/ice.jpeg'
import alvin from '../assets/alvin.jpg'
import matthew from '../assets/matthew.jpg'
import brix from '../assets/brix.jpeg'
import markidri from '../assets/markidri.jpeg'

const Dashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isDataExpanded, setIsDataExpanded] = useState(false);
    const { isLoading: isWeatherLoading, isServerWaking, executeRequest } = useApiWithLoading();
    const [weather, setWeather] = useState({
        temp: '--',
        description: 'Loading...',
        icon: '01d'
    });
    const [tasksDueToday, setTasksDueToday] = useState(0);
    const [classesToday, setClassesToday] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        // Ensure we're always using the user's local time
        const timer = setInterval(() => {
            setCurrentTime(new Date()); // This automatically uses local timezone
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const API_KEY = import.meta.env.VITE_OPEN_WEATHER_API;
                
                const data = await executeRequest(
                    async () => {
                        const response = await fetch(
                            `https://api.openweathermap.org/data/2.5/weather?q=Mabalacat&appid=${API_KEY}&units=metric`
                        );
                        
                        if (!response.ok) {
                            throw new Error('Weather data not available');
                        }
                        
                        return await response.json();
                    },
                    {
                        loadingMessage: "Loading weather data",
                        serverWakeThreshold: 4000, // Weather API might be slower
                        showLoading: true
                    }
                );
                
                setWeather({
                    temp: Math.round(data.main.temp),
                    description: data.weather[0].description,
                    icon: data.weather[0].icon
                });
            } catch (error) {
                console.error('Error fetching weather:', error);
                setWeather({
                    temp: '--',
                    description: 'Unavailable',
                    icon: '01d'
                });
            }
        };

        fetchWeather();
        // Refresh weather every 10 minutes
        const weatherInterval = setInterval(() => {
            // Don't show loading modal for automatic refreshes
            fetchWeather();
        }, 10 * 60 * 1000);
        
        return () => clearInterval(weatherInterval);
    }, [executeRequest]);

    // Helper function to check if a date is today (consistent with Tasks component)
    const isToday = (dueDate) => {
        const now = new Date(); // User's local time
        const due = new Date(dueDate);
        
        // Get current date in local time (start of day)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Get due date in local time (start of day)
        const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
        
        // Check if dates are the same
        return today.getTime() === dueDay.getTime();
    };

    // Helper function to check if a schedule is today
    const isScheduleToday = (schedule) => {
        const today = new Date(); // User's local time
        const scheduleDate = new Date(schedule.date);
        
        // Compare using local date strings to avoid timezone issues
        return today.toDateString() === scheduleDate.toDateString();
    };

    // Fetch tasks and schedules data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsDataLoading(true);
                
                // Fetch tasks due today
                const tasksResponse = await executeRequest(
                    () => taskAPI.getAll({ 
                        sortBy: 'dueDate', 
                        sortOrder: 'asc',
                        limit: 100 
                    }),
                    { 
                        showLoading: false // Don't show loading modal for dashboard updates
                    }
                );
                
                if (tasksResponse && tasksResponse.success && Array.isArray(tasksResponse.data)) {
                    console.log('Dashboard: All tasks received:', tasksResponse.data.length);
                    
                    const todayTasks = tasksResponse.data.filter(task => {
                        const isDueToday = isToday(task.dueDate);
                        const isNotCompleted = task.status !== 'completed';
                        
                        if (isDueToday) {
                            console.log(`Task "${task.title}" due today. Status: ${task.status}, Due: ${task.dueDate}`);
                        }
                        
                        return isDueToday && isNotCompleted;
                    });
                    
                    console.log(`Dashboard: Tasks due today (not completed): ${todayTasks.length}`);
                    setTasksDueToday(todayTasks.length);
                } else {
                    console.log('Dashboard: No valid tasks response');
                    setTasksDueToday(0);
                }

                // Fetch schedules for today
                const schedulesResponse = await executeRequest(
                    () => scheduleAPI.getAll(),
                    { 
                        showLoading: false // Don't show loading modal for dashboard updates
                    }
                );
                
                if (schedulesResponse && Array.isArray(schedulesResponse.data || schedulesResponse)) {
                    const schedules = schedulesResponse.data || schedulesResponse;
                    const todaySchedules = schedules.filter(schedule => 
                        isScheduleToday(schedule) && schedule.status === 'active'
                    );
                    setClassesToday(todaySchedules.length);
                } else {
                    setClassesToday(0);
                }
                
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setTasksDueToday(0);
                setClassesToday(0);
            } finally {
                setIsDataLoading(false);
            }
        };

        fetchDashboardData();
        
        // Refresh data every 5 minutes
        const dataInterval = setInterval(fetchDashboardData, 5 * 60 * 1000);
        
        return () => clearInterval(dataInterval);
    }, [executeRequest]);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning!';
        if (hour < 17) return 'Good Afternoon!';
        return 'Good Evening!';
    };

    const getGreetingIcon = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return Sun; // Morning: Sun
        if (hour < 17) return Sun; // Afternoon: Sun  
        if (hour < 20) return Sunset; // Early Evening: Sunset
        return Moon; // Night: Moon
    };

    const getGreetingIconStyle = () => {
        const hour = currentTime.getHours();
        if (hour < 12) {
            // Morning: Bright yellow/orange gradient
            return {
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
            };
        }
        if (hour < 17) {
            // Afternoon: Bright orange gradient
            return {
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            };
        }
        if (hour < 20) {
            // Early Evening: Sunset colors
            return {
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
            };
        }
        // Night: Deep blue/purple gradient
        return {
            background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
            boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
        };
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getWeatherIcon = (iconCode) => {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    };

    const getWeatherLucideIcon = (iconCode) => {
        // Fallback icons for when OpenWeather icons fail to load
        const iconMap = {
            '01d': Sun, '01n': Sun,
            '02d': Cloud, '02n': Cloud,
            '03d': Cloud, '03n': Cloud,
            '04d': Cloud, '04n': Cloud,
            '09d': CloudRain, '09n': CloudRain,
            '10d': CloudRain, '10n': CloudRain,
            '11d': Cloud, '11n': Cloud,
            '13d': Snowflake, '13n': Snowflake,
            '50d': Cloud, '50n': Cloud
        };
        return iconMap[iconCode] || Sun;
    };

    const formatWeatherDescription = (description) => {
        if (!description) return 'Loading...';
        
        // Capitalize the first letter of each word
        return description
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    
    return(
        <section id="dashboard">
            {/* Loading Modal */}
            <LoadingModal 
                isOpen={isWeatherLoading} 
                message="Loading weather data"
                isServerWaking={isServerWaking}
            />
            
            <div className="dashboard">
                <div className="left">
                    <div className="greeting-section">
                        <div className="greeting-icon" style={getGreetingIconStyle()}>
                            {React.createElement(getGreetingIcon(), { size: 32 })}
                        </div>
                        <p className="greeting">{getGreeting()}</p>
                    </div>
                    <div className="time-section">
                        <div className="time-icon">
                            <Clock size={20} />
                        </div>
                        <div className="time-info">
                            <p className="current-time">{formatTime(currentTime)}</p>
                            <p className="current-date">{formatDate(currentTime)}</p>
                        </div>
                    </div>
                    <div className="class-section">
                        <div className="class-icon">
                            <BookOpen size={20} />
                        </div>
                        <p className='class'>Class: BSIT - 3B</p>
                    </div>
                    <div className="data-container-mobile">
                        <div className="data-summary">
                            <div className="data-item">
                                {isWeatherLoading ? (
                                    <div className="weather-loading">
                                        <Sun size={16} />
                                        <span>--°C</span>
                                    </div>
                                ) : (
                                    <>
                                        <img 
                                            src={getWeatherIcon(weather.icon)} 
                                            alt={weather.description}
                                            className="weather-icon-small"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <Sun size={16} className="weather-icon-fallback" style={{display: 'none'}} />
                                        <span>{weather.temp}°C</span>
                                    </>
                                )}
                            </div>
                            <div className="data-item">
                                <AlertCircle size={16} />
                                <span>{isDataLoading ? '--' : tasksDueToday}</span>
                            </div>
                            <div className="data-item">
                                <Calendar size={16} />
                                <span>{isDataLoading ? '--' : classesToday}</span>
                            </div>
                            <button 
                                className="expand-btn" 
                                onClick={() => setIsDataExpanded(!isDataExpanded)}
                            >
                                {isDataExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </div>
                        {isDataExpanded && (
                            <div className="data-details">
                                <p style={{fontSize:"0.8rem"}}>
                                    <img 
                                        src={getWeatherIcon(weather.icon)} 
                                        alt={formatWeatherDescription(weather.description)}
                                        className="weather-icon-small"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <Sun size={16} className="weather-icon-fallback" style={{display: 'none'}} />
                                    {weather.temp}°C {formatWeatherDescription(weather.description)} at Mabalacat
                                </p>
                                <p><AlertCircle size={16} /> {tasksDueToday} {tasksDueToday === 1 ? 'Task' : 'Tasks'} Due Today</p>
                                <p><Calendar size={16} /> {classesToday} {classesToday === 1 ? 'Class' : 'Classes'} Today</p>
                            </div>
                        )}
                    </div>
                    <div className="manage-by-container">
                        {/* <div className="manager-icon">
                            <Users size={20} />
                        </div> */}
                        <div className="manager-info">
                            <div className="img-wrapper">
                                <img src={ice} alt="" />
                                <img src={alvin} alt="" />
                                <img src={matthew} alt="" />
                                <img src={brix} alt="" />
                                <img src={markidri} alt="" />
                            </div>
                            <p>Managed by: <span className='name'>Daniel, Alvin, Matthew, Brix, Markedrei</span></p>
                        </div>
                    </div>
                </div>
                <div className="right">
                    <div className="card weather-card">
                        <div className="card-icon">
                            {isWeatherLoading ? (
                                <Sun size={28} />
                            ) : (
                                <>
                                    <img 
                                        src={getWeatherIcon(weather.icon)} 
                                        alt={formatWeatherDescription(weather.description)}
                                        className="weather-icon-large"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <Sun size={28} className="weather-icon-fallback" style={{display: 'none'}} />
                                </>
                            )}
                        </div>
                        <span className="card-value">{weather.temp}°C</span>
                        <span className="card-label">Weather</span>
                        <span className="card-description">{formatWeatherDescription(weather.description)}</span>
                    </div>
                    <div className="card tasks-card">
                        <div className="card-icon">
                            <AlertCircle size={28} />
                        </div>
                        <span className="card-value">{isDataLoading ? '--' : tasksDueToday}</span>
                        <span className="card-label">Tasks Due</span>
                        <span className="card-description">Today</span>
                    </div>
                    <div className="card classes-card">
                        <div className="card-icon">
                            <Calendar size={28} />
                        </div>
                        <span className="card-value">{isDataLoading ? '--' : classesToday}</span>
                        <span className="card-label">Classes</span>
                        <span className="card-description">Today</span>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Dashboard