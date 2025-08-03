import { useState } from 'react';
import { Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import './SimpleAuth.css';
import { debugAuth } from '../utils/authDebug';

const SimpleAuth = ({ onAuthenticated, title = "Authentication Required" }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Debug logging for production
        console.log('=== SimpleAuth Debug ===');
        console.log('Environment check:');
        console.log('- NODE_ENV:', import.meta.env.NODE_ENV);
        console.log('- MODE:', import.meta.env.MODE);
        console.log('- PROD:', import.meta.env.PROD);
        console.log('- DEV:', import.meta.env.DEV);
        
        // Use debug utility
        const envPassword = debugAuth.testEnvVar('VITE_ADMIN_PASSWORD');
        
        // Check all VITE environment variables
        console.log('All VITE env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
        
        // Password debugging (careful with logging)
        const defaultPassword = 'admin123';
        const correctPassword = envPassword || defaultPassword;
        
        console.log('Password check:');
        console.log('- VITE_ADMIN_PASSWORD exists:', !!envPassword);
        console.log('- VITE_ADMIN_PASSWORD length:', envPassword ? envPassword.length : 0);
        console.log('- Using default password:', !envPassword);
        console.log('- Entered password length:', password.length);
        console.log('- Passwords match:', password === correctPassword);
        
        // Simple validation - in a real app this would be more secure
        
        // Simulate a small delay for better UX
        setTimeout(() => {
            console.log('Authentication result:', password === correctPassword);
            
            if (password === correctPassword) {
                console.log('✅ Authentication successful');
                // Store authentication in sessionStorage (expires when browser closes)
                sessionStorage.setItem('adminAuth', 'true');
                sessionStorage.setItem('adminAuthTime', Date.now().toString());
                console.log('Session data stored:', {
                    adminAuth: sessionStorage.getItem('adminAuth'),
                    adminAuthTime: sessionStorage.getItem('adminAuthTime')
                });
                onAuthenticated(true);
            } else {
                console.log('❌ Authentication failed');
                console.log('Expected:', correctPassword);
                console.log('Received:', password);
                setError('Incorrect password. Please try again.');
                setPassword('');
            }
            setIsLoading(false);
            console.log('=== End SimpleAuth Debug ===');
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
                    {(import.meta.env.PROD && window.location.search.includes('debug=true')) && (
                        <div style={{ 
                            marginTop: '1rem', 
                            padding: '0.5rem', 
                            background: '#f8f9fa', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#666',
                            fontFamily: 'monospace'
                        }}>
                            <strong>Debug Info:</strong><br/>
                            ENV: {import.meta.env.MODE}<br/>
                            PWD_SET: {!!import.meta.env.VITE_ADMIN_PASSWORD ? 'YES' : 'NO'}<br/>
                            STORAGE: {typeof Storage !== 'undefined' ? 'OK' : 'ERROR'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SimpleAuth;
