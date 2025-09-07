import { useState, useEffect } from 'react';
import { Coffee, Clock } from 'lucide-react';
import LoaderCat from '../assets/loader-cat.gif'
import LoaderBird from '../assets/sleeping.gif'
import OfflineSchedule from '../assets/offline_sched.png'

const LoadingModal = ({ isOpen, message = "Loading...", isServerWaking = false }) => {
    const [dots, setDots] = useState('');
    const [wakingMessage, setWakingMessage] = useState('Waking up server');

    // Animated dots effect
    useEffect(() => {
        if (!isOpen) return;
        
        const interval = setInterval(() => {
            setDots(prev => {
                if (prev === '...') return '';
                return prev + '.';
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isOpen]);

    // Cycling wake up messages with better UX
    useEffect(() => {
        if (!isServerWaking) return;

        const messages = [
            'Waking up the server',
            'Starting server services',
            'Connecting to database',
            'Loading your data',
            'Almost ready'
        ];

        let index = 0;
        setWakingMessage(messages[index]);
        
        const interval = setInterval(() => {
            index = (index + 1) % messages.length;
            setWakingMessage(messages[index]);
        }, 10000); // Slower transitions for better readability

        return () => clearInterval(interval);
    }, [isServerWaking]);

    if (!isOpen) return null;

    return (
        <div className="loading-modal-overlay">
            <div className="loading-modal">
                <div className="loading-content">
                    {isServerWaking ? (
                        <>
                            <div className="loading-icon server-waking">
                                <img src={LoaderBird} alt="Server waking up"/>
                            </div>
                            <h3 className="loading-title">{wakingMessage}{dots}</h3>
                            <p className="loading-subtitle">
                                Render servers love a good nap. This may take 20–30 seconds
                            </p>
                            
                            {/* Offline Schedule Display */}
                            <div className="offline-schedule-container">
                                <p className="offline-schedule-text">
                                    Meanwhile, here's your offline schedule:
                                </p>
                                <img 
                                    src={OfflineSchedule} 
                                    alt="Offline Schedule" 
                                    className="offline-schedule-img"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="loading-icon">
                                <img src={LoaderCat} alt="Loading..." className="loader-cat" />
                            </div>
                            <h3 className="loading-title">{message}{dots}</h3>
                            <p className="loading-subtitle">Please wait while we fetch your data</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoadingModal;
