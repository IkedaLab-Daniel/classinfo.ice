
import { Cloud, CheckSquare, BookOpen, Sun, CloudRain, Snowflake, IceCream, AlertCircle, Calendar, Clock, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import ice from '../assets/ice.jpeg'

const Dashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isDataExpanded, setIsDataExpanded] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good Morning!';
        if (hour < 17) return 'Good Afternoon!';
        return 'Good Evening!';
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
    
    return(
        <section id="dashboard">
            <div className="dashboard">
                <div className="left">
                    <div className="greeting-section">
                        <div className="greeting-icon">
                            <Sun size={32} />
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
                                <Sun size={16} />
                                <span>28°C</span>
                            </div>
                            <div className="data-item">
                                <AlertCircle size={16} />
                                <span>3</span>
                            </div>
                            <div className="data-item">
                                <Calendar size={16} />
                                <span>3</span>
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
                                <p><Sun size={16} /> 28°C Partly Cloudy</p>
                                <p><AlertCircle size={16} /> 3 Tasks Due Today</p>
                                <p><Calendar size={16} /> 3 Classes Today</p>
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
                                <img src={ice} alt="" />
                                <img src={ice} alt="" />
                            </div>
                            <p>Managed by: <span className='name'>Ice, Ice, Baby</span></p>
                        </div>
                    </div>
                </div>
                <div className="right">
                    <div className="card weather-card">
                        <div className="card-icon">
                            <Sun size={28} />
                        </div>
                        <span className="card-value">28°C</span>
                        <span className="card-label">Weather</span>
                        <span className="card-description">Partly Cloudy</span>
                    </div>
                    <div className="card tasks-card">
                        <div className="card-icon">
                            <AlertCircle size={28} />
                        </div>
                        <span className="card-value">3</span>
                        <span className="card-label">Tasks Due</span>
                        <span className="card-description">Today</span>
                    </div>
                    <div className="card classes-card">
                        <div className="card-icon">
                            <Calendar size={28} />
                        </div>
                        <span className="card-value">3</span>
                        <span className="card-label">Classes</span>
                        <span className="card-description">Remaining</span>
                    </div>
                </div>
                
            </div>
        </section>
    )
}

export default Dashboard