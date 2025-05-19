// src/contexts/ThemeContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const ThemeContext = createContext();

// Theme options
export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

// Provider component
export function ThemeProvider({ children }) {
    // State for the current theme
    const [theme, setTheme] = useState(() => {
        // Check if a theme preference is stored in localStorage
        const savedTheme = localStorage.getItem('theme');
        return savedTheme || THEMES.SYSTEM;
    });

    // State for the actual applied theme (light or dark)
    const [appliedTheme, setAppliedTheme] = useState(THEMES.LIGHT);

    // Effect to handle system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (theme === THEMES.SYSTEM) {
                setAppliedTheme(mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT);
            }
        };

        // Initial setup
        handleChange();

        // Listen for changes
        try {
            // Modern API (newer browsers)
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } catch (e) {
            // Fallback for older browsers
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [theme]);

    // Effect to update applied theme when theme changes
    useEffect(() => {
        if (theme === THEMES.SYSTEM) {
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setAppliedTheme(isDarkMode ? THEMES.DARK : THEMES.LIGHT);
        } else {
            setAppliedTheme(theme);
        }

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Effect to apply theme to document
    useEffect(() => {
        if (appliedTheme === THEMES.DARK) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        }
    }, [appliedTheme]);

    // Function to change theme
    const changeTheme = (newTheme) => {
        if (Object.values(THEMES).includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    // Toggle between light and dark themes
    const toggleTheme = () => {
        if (theme === THEMES.LIGHT) {
            changeTheme(THEMES.DARK);
        } else if (theme === THEMES.DARK) {
            changeTheme(THEMES.LIGHT);
        } else {
            // If system, switch to the opposite of current applied theme
            changeTheme(appliedTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
        }
    };

    const value = {
        theme,
        appliedTheme,
        changeTheme,
        toggleTheme,
        isDark: appliedTheme === THEMES.DARK
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// Custom hook to use the theme context
export function useTheme() {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}

export default ThemeContext;