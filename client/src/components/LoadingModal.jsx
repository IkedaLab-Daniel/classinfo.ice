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

    // Cycling wake up messages
    useEffect(() => {
        if (!isServerWaking) return;

        const messages = [
            'Waking up server',
            'Starting services',
            'Connecting to database',
            'Almost ready',
            'Loading your data'
        ];

        let index = 0;
        const interval = setInterval(() => {
            setWakingMessage(messages[index]);
            index = (index + 1) % messages.length;
        }, 2000);

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
                                Server was sleeping, please wait a moment
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
