// src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme constants
export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
};

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
    // Get initial theme from localStorage or default to auto
    const getInitialTheme = () => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('charity-app-theme');
            if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
                return savedTheme;
            }
        }
        return THEMES.AUTO;
    };

    const [theme, setTheme] = useState(getInitialTheme);
    const [appliedTheme, setAppliedTheme] = useState(THEMES.LIGHT);

    // Function to detect system theme preference
    const getSystemTheme = () => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
                ? THEMES.DARK
                : THEMES.LIGHT;
        }
        return THEMES.LIGHT;
    };

    // Function to apply theme to document
    const applyTheme = (themeToApply) => {
        if (typeof document !== 'undefined') {
            const root = document.documentElement;
            const body = document.body;

            // Remove existing theme classes
            root.classList.remove('light-mode', 'dark-mode', 'light', 'dark');
            body.classList.remove('light-mode', 'dark-mode', 'light', 'dark');

            // Add new theme classes
            const themeClass = themeToApply === THEMES.DARK ? 'dark-mode' : 'light-mode';
            const altThemeClass = themeToApply === THEMES.DARK ? 'dark' : 'light';

            root.classList.add(themeClass, altThemeClass);
            body.classList.add(themeClass, altThemeClass);

            // Update CSS custom properties on root
            root.setAttribute('data-theme', themeToApply);
        }
    };

    // Effect to handle theme changes
    useEffect(() => {
        let finalTheme;

        if (theme === THEMES.AUTO) {
            finalTheme = getSystemTheme();
        } else {
            finalTheme = theme;
        }

        setAppliedTheme(finalTheme);
        applyTheme(finalTheme);

        // Save theme preference to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('charity-app-theme', theme);
        }
    }, [theme]);

    // Effect to listen for system theme changes when in auto mode
    useEffect(() => {
        if (theme === THEMES.AUTO && typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleChange = (e) => {
                const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
                setAppliedTheme(newSystemTheme);
                applyTheme(newSystemTheme);
            };

            mediaQuery.addEventListener('change', handleChange);

            // Cleanup
            return () => {
                mediaQuery.removeEventListener('change', handleChange);
            };
        }
    }, [theme]);

    // Function to change theme
    const changeTheme = (newTheme) => {
        if (Object.values(THEMES).includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    // Function to toggle between light and dark (skips auto)
    const toggleTheme = () => {
        if (appliedTheme === THEMES.DARK) {
            changeTheme(THEMES.LIGHT);
        } else {
            changeTheme(THEMES.DARK);
        }
    };

    // Function to cycle through all themes
    const cycleTheme = () => {
        switch (theme) {
            case THEMES.LIGHT:
                changeTheme(THEMES.DARK);
                break;
            case THEMES.DARK:
                changeTheme(THEMES.AUTO);
                break;
            case THEMES.AUTO:
                changeTheme(THEMES.LIGHT);
                break;
            default:
                changeTheme(THEMES.LIGHT);
        }
    };

    // Computed values
    const isDarkMode = appliedTheme === THEMES.DARK;
    const isLightMode = appliedTheme === THEMES.LIGHT;
    const isAutoMode = theme === THEMES.AUTO;

    // Context value
    const value = {
        // Current theme state
        theme,                    // User preference (light/dark/auto)
        appliedTheme,            // Actually applied theme (light/dark)
        isDarkMode,              // Boolean for dark mode
        isLightMode,             // Boolean for light mode
        isAutoMode,              // Boolean for auto mode

        // Theme functions
        changeTheme,             // Change to specific theme
        toggleTheme,             // Toggle between light/dark
        cycleTheme,              // Cycle through all themes

        // Utility functions
        getSystemTheme,          // Get system preference

        // Theme constants
        THEMES
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Higher-order component for theme support
export const withTheme = (Component) => {
    return function ThemedComponent(props) {
        return (
            <ThemeProvider>
                <Component {...props} />
            </ThemeProvider>
        );
    };
};

export default ThemeContext;