
import { Cloud, CheckSquare, BookOpen, Sun, CloudRain, Snowflake, IceCream, AlertCircle, Calendar, Clock, MapPin, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import ice from '../assets/ice.jpeg'

const Dashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isDataExpanded, setIsDataExpanded] = useState(false);
    const [weather, setWeather] = useState({
        temp: '--',
        description: 'Loading...',
        icon: '01d'
    });
    const [weatherLoading, setWeatherLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setWeatherLoading(true);
                const API_KEY = import.meta.env.VITE_OPEN_WEATHER_API;
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=Mabalacat&appid=${API_KEY}&units=metric`
                );
                
                if (!response.ok) {
                    throw new Error('Weather data not available');
                }
                
                const data = await response.json();
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
            } finally {
                setWeatherLoading(false);
            }
        };

        fetchWeather();
        // Refresh weather every 10 minutes
        const weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000);
        
        return () => clearInterval(weatherInterval);
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
                                {weatherLoading ? (
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
                                <p>
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
                                    {weather.temp}°C {weather.description}
                                </p>
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
                            {weatherLoading ? (
                                <Sun size={28} />
                            ) : (
                                <>
                                    <img 
                                        src={getWeatherIcon(weather.icon)} 
                                        alt={weather.description}
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
                        <span className="card-description">{weather.description}</span>
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