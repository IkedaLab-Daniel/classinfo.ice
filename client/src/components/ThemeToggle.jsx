import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ className = '', size = 20 }) => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button 
            className={`theme-toggle ${className}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
        >
            <div className="theme-toggle-icon">
                {isDarkMode ? (
                    <Sun size={size} className="theme-icon sun-icon" />
                ) : (
                    <Moon size={size} className="theme-icon moon-icon" />
                )}
            </div>
        </button>
    );
};

export default ThemeToggle;
