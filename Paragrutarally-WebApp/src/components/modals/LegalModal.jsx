// src/components/modals/LegalModal.jsx
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './LegalModal.css';

const LegalModal = ({ isOpen, onClose }) => {
    const { t, isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' or 'terms'

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="legal-modal-backdrop" onClick={handleBackdropClick}>
            <div className="legal-modal" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="legal-modal-header">
                    <div className="legal-modal-tabs">
                        <button
                            className={`legal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
                            onClick={() => setActiveTab('privacy')}
                        >
                            {t('legal.privacyPolicy', 'Privacy Policy')}
                        </button>
                        <button
                            className={`legal-tab ${activeTab === 'terms' ? 'active' : ''}`}
                            onClick={() => setActiveTab('terms')}
                        >
                            {t('legal.termsOfService', 'Terms of Service')}
                        </button>
                    </div>
                    <button className="legal-modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                </div>

                <div className="legal-modal-content">
                    {activeTab === 'privacy' && (
                        <div className="legal-content">
                            <h2>{t('legal.privacyPolicy', 'Privacy Policy')}</h2>
                            <p className="effective-date">
                                <strong>{t('legal.effectiveDate', 'Effective Date')}:</strong> {t('legal.effectiveDateValue', 'June 23, 2025')}
                            </p>

                            <section>
                                <h3>{t('legal.informationWeCollect', 'Information We Collect')}</h3>
                                <p>{t('legal.informationWeCollectDesc', 'Our charity management application collects the following types of information:')}</p>
                                <ul>
                                    <li><strong>{t('legal.accountInformation', 'Account Information')}:</strong> {t('legal.accountInformationDesc', 'Name, email address, phone number, organization affiliation')}</li>
                                    <li><strong>{t('legal.profileData', 'Profile Data')}:</strong> {t('legal.profileDataDesc', 'Display name, role within your organization, contact preferences')}</li>
                                    <li><strong>{t('legal.organizationalData', 'Organizational Data')}:</strong> {t('legal.organizationalDataDesc', 'Event details, participant data, team information, form submissions')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.howWeUseYourInformation', 'How We Use Your Information')}</h3>
                                <p>{t('legal.howWeUseYourInformationDesc', 'We use the collected information to:')}</p>
                                <ul>
                                    <li>{t('legal.useCase1', 'Provide core charity management services')}</li>
                                    <li>{t('legal.useCase2', 'Secure user authentication through Firebase')}</li>
                                    <li>{t('legal.useCase3', 'Replace disorganized Excel workflows with structured data management')}</li>
                                    <li>{t('legal.useCase4', 'Send important updates about your account and organizational activities')}</li>
                                    <li>{t('legal.useCase5', 'Improve app functionality and user experience')}</li>
                                    <li>{t('legal.useCase6', 'Protect against unauthorized access and maintain data integrity')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.dataStorageAndSecurity', 'Data Storage and Security')}</h3>
                                <p>{t('legal.dataStorageAndSecurityDesc', 'All data is stored securely using Google Firebase services with:')}</p>
                                <ul>
                                    <li>{t('legal.security1', 'Data encryption in transit and at rest')}</li>
                                    <li>{t('legal.security2', 'Role-based access controls')}</li>
                                    <li>{t('legal.security3', 'Regular security audits and monitoring')}</li>
                                    <li>{t('legal.security4', 'Multi-factor authentication support')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.yourRights', 'Your Rights')}</h3>
                                <p>{t('legal.yourRightsDesc', 'You have the right to:')}</p>
                                <ul>
                                    <li>{t('legal.right1', 'Access all personal information we have about you')}</li>
                                    <li>{t('legal.right2', 'Update your profile and organizational data at any time')}</li>
                                    <li>{t('legal.right3', 'Export your data in common formats')}</li>
                                    <li>{t('legal.right4', 'Request complete removal of your account and associated data')}</li>
                                    <li>{t('legal.right5', 'Control email notifications and communication preferences')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.dataSharing', 'Data Sharing')}</h3>
                                <p>{t('legal.dataSharingDesc', 'We never sell your personal information. We only share data:')}</p>
                                <ul>
                                    <li>{t('legal.sharing1', 'Within your charity organization based on assigned roles and permissions')}</li>
                                    <li>{t('legal.sharing2', 'With Firebase services for data processing and storage')}</li>
                                    <li>{t('legal.sharing3', 'When required by law or to protect our legal rights')}</li>
                                    <li>{t('legal.sharing4', 'In emergency situations to prevent harm')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.contactInformation', 'Contact Information')}</h3>
                                <p>{t('legal.contactInformationDesc', 'For questions about this Privacy Policy, please contact us at:')}</p>
                                <p><strong>{t('legal.email', 'Email')}:</strong> privacy@paragrutarally.org</p>
                            </section>
                        </div>
                    )}

                    {activeTab === 'terms' && (
                        <div className="legal-content">
                            <h2>{t('legal.termsOfService', 'Terms of Service')}</h2>
                            <p className="effective-date">
                                <strong>{t('legal.effectiveDate', 'Effective Date')}:</strong> {t('legal.effectiveDateValue', 'June 23, 2025')}
                            </p>

                            <section>
                                <h3>{t('legal.acceptanceOfTerms', 'Acceptance of Terms')}</h3>
                                <p>{t('legal.acceptanceOfTermsDesc', 'By accessing or using our charity management application, you agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use the Service.')}</p>
                            </section>

                            <section>
                                <h3>{t('legal.descriptionOfService', 'Description of Service')}</h3>
                                <p>{t('legal.descriptionOfServiceDesc', 'Our charity management application helps organizations:')}</p>
                                <ul>
                                    <li>{t('legal.serviceFeature1', 'Manage events, teams, and organizational data')}</li>
                                    <li>{t('legal.serviceFeature2', 'Replace disorganized Excel-based workflows')}</li>
                                    <li>{t('legal.serviceFeature3', 'Provide role-based access for different organizational positions')}</li>
                                    <li>{t('legal.serviceFeature4', 'Facilitate data import/export and form management')}</li>
                                    <li>{t('legal.serviceFeature5', 'Offer secure user authentication through Firebase')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.userAccounts', 'User Accounts')}</h3>
                                <p>{t('legal.userAccountsDesc', 'When creating an account:')}</p>
                                <ul>
                                    <li>{t('legal.accountRule1', 'You must provide accurate and complete information')}</li>
                                    <li>{t('legal.accountRule2', 'You are responsible for maintaining confidentiality of your credentials')}</li>
                                    <li>{t('legal.accountRule3', 'You must be at least 18 years old')}</li>
                                    <li>{t('legal.accountRule4', 'Each account should represent a real person within your organization')}</li>
                                    <li>{t('legal.accountRule5', 'You are responsible for all activities under your account')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.acceptableUse', 'Acceptable Use')}</h3>
                                <p><strong>{t('legal.permittedUses', 'Permitted Uses')}:</strong></p>
                                <ul>
                                    <li>{t('legal.permittedUse1', 'Use for legitimate charitable and organizational purposes')}</li>
                                    <li>{t('legal.permittedUse2', 'Manage your organization\'s data, events, and team information')}</li>
                                    <li>{t('legal.permittedUse3', 'Import and organize existing data from Excel files')}</li>
                                    <li>{t('legal.permittedUse4', 'Collaborate with team members within your organization')}</li>
                                </ul>

                                <p><strong>{t('legal.prohibitedUses', 'Prohibited Uses')}:</strong></p>
                                <ul>
                                    <li>{t('legal.prohibitedUse1', 'Violating any applicable laws or regulations')}</li>
                                    <li>{t('legal.prohibitedUse2', 'Infringing on intellectual property rights')}</li>
                                    <li>{t('legal.prohibitedUse3', 'Uploading malicious software or harmful code')}</li>
                                    <li>{t('legal.prohibitedUse4', 'Attempting unauthorized access to systems')}</li>
                                    <li>{t('legal.prohibitedUse5', 'Harassing or threatening other users')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.dataResponsibility', 'Data Responsibility')}</h3>
                                <ul>
                                    <li>{t('legal.dataResp1', 'You retain ownership of all data you upload')}</li>
                                    <li>{t('legal.dataResp2', 'You must ensure proper authorization for personal data management')}</li>
                                    <li>{t('legal.dataResp3', 'You must comply with applicable data protection laws')}</li>
                                    <li>{t('legal.dataResp4', 'You are responsible for data accuracy and completeness')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.serviceAvailability', 'Service Availability')}</h3>
                                <ul>
                                    <li>{t('legal.availability1', 'We strive for high service availability but cannot guarantee 100% uptime')}</li>
                                    <li>{t('legal.availability2', 'Planned maintenance will be communicated in advance')}</li>
                                    <li>{t('legal.availability3', 'We provide reasonable support during normal business hours')}</li>
                                    <li>{t('legal.availability4', 'Critical security issues receive priority attention')}</li>
                                </ul>
                            </section>

                            <section>
                                <h3>{t('legal.limitationOfLiability', 'Limitation of Liability')}</h3>
                                <p>{t('legal.limitationOfLiabilityDesc', 'The Service is provided "as is" without warranties. Our liability is limited to the amount paid for the Service in the past 12 months. We are not liable for indirect, incidental, or consequential damages.')}</p>
                            </section>

                            <section>
                                <h3>{t('legal.contactInformation', 'Contact Information')}</h3>
                                <p>{t('legal.contactInformationTermsDesc', 'For questions about these Terms, please contact us at:')}</p>
                                <p><strong>{t('legal.email', 'Email')}:</strong> ParaGrutaRally.Project@gmail.com</p>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegalModal;