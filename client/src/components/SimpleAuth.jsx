import { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import './SimpleAuth.css';

const SimpleAuth = ({ onAuthenticated, title = "Authentication Required" }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simple validation - in a real app this would be more secure
        const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
        
        // Simulate a small delay for better UX
        setTimeout(() => {
            if (password === correctPassword) {
                // Store authentication in sessionStorage (expires when browser closes)
                sessionStorage.setItem('adminAuth', 'true');
                sessionStorage.setItem('adminAuthTime', Date.now().toString());
                onAuthenticated(true);
            } else {
                setError('Incorrect password. Please try again.');
                setPassword('');
            }
            setIsLoading(false);
        }, 500);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="auth-overlay">
            <div className="auth-modal">
                <div className="auth-header">
                    <Shield size={32} className="auth-icon" />
                    <h2>{title}</h2>
                    <p>Enter the admin password to continue</p>
                </div>
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="password-input-container">
                        <Lock size={20} className="input-icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter admin password"
                            className={`auth-input ${error ? 'error' : ''}`}
                            disabled={isLoading}
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="toggle-password"
                            disabled={isLoading}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    
                    {error && (
                        <div className="auth-error">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading ? (
                            <>
                                <div className="loading-spinner"></div>
                                Verifying...
                            </>
                        ) : (
                            <>
                                <Shield size={16} />
                                Authenticate
                            </>
                        )}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>This is a temporary authentication system.</p>
                    <p>Full account management will be implemented later.</p>
                </div>
            </div>
        </div>
    );
};

export default SimpleAuth;
