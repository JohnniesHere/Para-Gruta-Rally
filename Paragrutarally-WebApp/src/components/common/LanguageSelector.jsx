// src/components/common/LanguageSelector.jsx
import React, { useState } from 'react';
import { useLanguage, LANGUAGES } from '../../contexts/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = ({ className = '' }) => {
    const { currentLanguage, changeLanguage, t, isRTL } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: LANGUAGES.ENGLISH, name: 'English', nativeName: 'English', flag: '🇺🇸' },
        { code: LANGUAGES.HEBREW, name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' }
    ];

    const currentLang = languages.find(lang => lang.code === currentLanguage);

    const handleLanguageChange = (langCode) => {
        changeLanguage(langCode);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={`language-selector ${className} ${isRTL ? 'rtl' : 'ltr'}`}>
            <button
                className="language-button"
                onClick={toggleDropdown}
                aria-label={t('language.selectLanguage', 'Select Language')}
            >
                <span className="language-flag">{currentLang?.flag}</span>
                <span className="language-name">{currentLang?.nativeName}</span>
                <svg
                    className={`language-arrow ${isOpen ? 'open' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="currentColor"
                >
                    <path d="M2 4l4 4 4-4H2z"/>
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="language-overlay" onClick={() => setIsOpen(false)} />
                    <div className="language-dropdown">
                        {languages.map((language) => (
                            <button
                                key={language.code}
                                className={`language-option ${language.code === currentLanguage ? 'active' : ''}`}
                                onClick={() => handleLanguageChange(language.code)}
                            >
                                <span className="language-flag">{language.flag}</span>
                                <span className="language-names">
                                    <span className="language-native">{language.nativeName}</span>
                                    <span className="language-english">{language.name}</span>
                                </span>
                                {language.code === currentLanguage && (
                                    <svg
                                        className="language-check"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="currentColor"
                                    >
                                        <path d="M13.5 3.5L6 11l-3.5-3.5L1 9l5 5 9-9-1.5-1.5z"/>
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguageSelector;