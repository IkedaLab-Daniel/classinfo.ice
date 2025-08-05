import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check if user has a saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
        // Otherwise, check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        // Save preference to localStorage
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            // Only auto-switch if user hasn't set a manual preference
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                setIsDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    const setTheme = (theme) => {
        setIsDarkMode(theme === 'dark');
    };

    return (
        <ThemeContext.Provider value={{
            isDarkMode,
            toggleTheme,
            setTheme,
            theme: isDarkMode ? 'dark' : 'light'
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
