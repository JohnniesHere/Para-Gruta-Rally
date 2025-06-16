// src/components/common/LanguageSelector.jsx
import React from 'react';
import { useLanguage, LANGUAGES } from '../../contexts/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = ({ className = '' }) => {
    const { currentLanguage, changeLanguage, t } = useLanguage();

    const languages = [
        { code: LANGUAGES.ENGLISH, label: 'English', flag: '🇺🇸' },
        { code: LANGUAGES.HEBREW, label: 'עברית', flag: '🇮🇱' }
    ];

    return (
        <div className={`language-selector ${className}`}>
            <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="language-select"
                title={t('language.selectLanguage', 'Select Language')}
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;