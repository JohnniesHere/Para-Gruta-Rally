// src/components/common/DarkModeToggle.jsx

import React from 'react';
import { useTheme, THEMES } from '../../contexts/ThemeContext';
import './DarkModeToggle.css';

const DarkModeToggle = ({ className = '' }) => {
    const { theme, appliedTheme, toggleTheme, changeTheme } = useTheme();
    const isDark = appliedTheme === THEMES.DARK;

    return (
        <div className={`dark-mode-toggle ${className}`}>
            <label className="switch">
                <input
                    type="checkbox"
                    checked={isDark}
                    onChange={toggleTheme}
                />
                <span className="slider round">
          <div className="toggle-icons">
            {/* Sun icon for light mode */}
              <svg
                  className="sun-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
              >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>

              {/* Moon icon for dark mode */}
              <svg
                  className="moon-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
              >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </div>
        </span>
            </label>
        </div>
    );
};

export default DarkModeToggle;