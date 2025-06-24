// src/components/ui/LegalTrigger.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import LegalModal from '../modals/LegalModal';
import { useLanguage } from '../../contexts/LanguageContext';
import './LegalTrigger.css';

const LegalTrigger = ({
                          variant = 'button', // 'button', 'link', 'icon', 'minimal'
                          className = '',
                          size = 'default' // 'small', 'default', 'large'
                      }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useLanguage();

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Different rendering based on variant
    const renderTrigger = () => {
        switch (variant) {
            case 'link':
                return (
                    <button
                        className={`legal-trigger legal-trigger-link ${size} ${className}`}
                        onClick={handleOpenModal}
                    >
                        {t('legal.viewLegal', 'Legal Information')}
                    </button>
                );

            case 'icon':
                return (
                    <button
                        className={`legal-trigger legal-trigger-icon ${size} ${className}`}
                        onClick={handleOpenModal}
                        title={t('legal.viewLegal', 'Legal Information')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                    </button>
                );

            case 'minimal':
                return (
                    <button
                        className={`legal-trigger legal-trigger-minimal ${size} ${className}`}
                        onClick={handleOpenModal}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
                        </svg>
                        <span>{t('legal.info', 'Legal')}</span>
                    </button>
                );

            default: // 'button'
                return (
                    <button
                        className={`legal-trigger legal-trigger-button ${size} ${className}`}
                        onClick={handleOpenModal}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                        {t('legal.viewLegal', 'Legal Information')}
                    </button>
                );
        }
    };

    return (
        <>
            {renderTrigger()}
            {isModalOpen && createPortal(
                <LegalModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />,
                document.body
            )}
        </>
    );
};

export default LegalTrigger;