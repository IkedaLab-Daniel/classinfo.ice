import { useState, useEffect } from 'react';
import { Coffee, Clock } from 'lucide-react';
import LoaderCat from '../assets/loader-cat.gif'

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
            'Server is sleeping, waking it up',
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
        }, 3000); // Slower transitions for better readability

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
                                <Coffee size={48} />
                                <div className="pulse-rings">
                                    <div className="pulse-ring"></div>
                                    <div className="pulse-ring"></div>
                                    <div className="pulse-ring"></div>
                                </div>
                            </div>
                            <h3 className="loading-title">{wakingMessage}{dots}</h3>
                            <p className="loading-subtitle">
                                <Clock size={16} />
                                Server response is taking longer than usual - this may take up to 30 seconds
                            </p>
                            <div className="loading-progress">
                                <div className="progress-bar">
                                    <div className="progress-fill"></div>
                                </div>
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
