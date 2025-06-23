// src/components/modals/LegalModal.jsx
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './LegalModal.css';

const LegalModal = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' or 'terms'

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="legal-modal-backdrop" onClick={handleBackdropClick}>
            <div className="legal-modal">
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
                            <p className="effective-date"><strong>Effective Date:</strong> June 23, 2025</p>

                            <section>
                                <h3>Information We Collect</h3>
                                <p>Our charity management application collects the following types of information:</p>
                                <ul>
                                    <li><strong>Account Information:</strong> Name, email address, phone number, organization affiliation</li>
                                    <li><strong>Profile Data:</strong> Display name, role within your organization, contact preferences</li>
                                    <li><strong>Organizational Data:</strong> Event details, participant data, team information, form submissions</li>
                                </ul>
                            </section>

                            <section>
                                <h3>How We Use Your Information</h3>
                                <p>We use the collected information to:</p>
                                <ul>
                                    <li>Provide core charity management services</li>
                                    <li>Secure user authentication through Firebase</li>
                                    <li>Replace disorganized Excel workflows with structured data management</li>
                                    <li>Send important updates about your account and organizational activities</li>
                                    <li>Improve app functionality and user experience</li>
                                    <li>Protect against unauthorized access and maintain data integrity</li>
                                </ul>
                            </section>

                            <section>
                                <h3>Data Storage and Security</h3>
                                <p>All data is stored securely using Google Firebase services with:</p>
                                <ul>
                                    <li>Data encryption in transit and at rest</li>
                                    <li>Role-based access controls</li>
                                    <li>Regular security audits and monitoring</li>
                                    <li>Multi-factor authentication support</li>
                                </ul>
                            </section>

                            <section>
                                <h3>Your Rights</h3>
                                <p>You have the right to:</p>
                                <ul>
                                    <li>Access all personal information we have about you</li>
                                    <li>Update your profile and organizational data at any time</li>
                                    <li>Export your data in common formats</li>
                                    <li>Request complete removal of your account and associated data</li>
                                    <li>Control email notifications and communication preferences</li>
                                </ul>
                            </section>

                            <section>
                                <h3>Data Sharing</h3>
                                <p>We never sell your personal information. We only share data:</p>
                                <ul>
                                    <li>Within your charity organization based on assigned roles and permissions</li>
                                    <li>With Firebase services for data processing and storage</li>
                                    <li>When required by law or to protect our legal rights</li>
                                    <li>In emergency situations to prevent harm</li>
                                </ul>
                            </section>

                            <section>
                                <h3>Contact Information</h3>
                                <p>For questions about this Privacy Policy, please contact us at:</p>
                                <p><strong>Email:</strong> privacy@paragrutarally.org<br/></p>
                            </section>
                        </div>
                    )}

                    {activeTab === 'terms' && (
                        <div className="legal-content">
                            <h2>{t('legal.termsOfService', 'Terms of Service')}</h2>
                            <p className="effective-date"><strong>Effective Date:</strong> June 23, 2025</p>

                            <section>
                                <h3>Acceptance of Terms</h3>
                                <p>By accessing or using our charity management application, you agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use the Service.</p>
                            </section>

                            <section>
                                <h3>Description of Service</h3>
                                <p>Our charity management application helps organizations:</p>
                                <ul>
                                    <li>Manage events, teams, and organizational data</li>
                                    <li>Replace disorganized Excel-based workflows</li>
                                    <li>Provide role-based access for different organizational positions</li>
                                    <li>Facilitate data import/export and form management</li>
                                    <li>Offer secure user authentication through Firebase</li>
                                </ul>
                            </section>

                            <section>
                                <h3>User Accounts</h3>
                                <p>When creating an account:</p>
                                <ul>
                                    <li>You must provide accurate and complete information</li>
                                    <li>You are responsible for maintaining confidentiality of your credentials</li>
                                    <li>You must be at least 18 years old</li>
                                    <li>Each account should represent a real person within your organization</li>
                                    <li>You are responsible for all activities under your account</li>
                                </ul>
                            </section>

                            <section>
                                <h3>Acceptable Use</h3>
                                <p><strong>Permitted Uses:</strong></p>
                                <ul>
                                    <li>Use for legitimate charitable and organizational purposes</li>
                                    <li>Manage your organization's data, events, and team information</li>
                                    <li>Import and organize existing data from Excel files</li>
                                    <li>Collaborate with team members within your organization</li>
                                </ul>

                                <p><strong>Prohibited Uses:</strong></p>
                                <ul>
                                    <li>Violating any applicable laws or regulations</li>
                                    <li>Infringing on intellectual property rights</li>
                                    <li>Uploading malicious software or harmful code</li>
                                    <li>Attempting unauthorized access to systems</li>
                                    <li>Harassing or threatening other users</li>
                                </ul>
                            </section>

                            <section>
                                <h3>Data Responsibility</h3>
                                <ul>
                                    <li>You retain ownership of all data you upload</li>
                                    <li>You must ensure proper authorization for personal data management</li>
                                    <li>You must comply with applicable data protection laws</li>
                                    <li>You are responsible for data accuracy and completeness</li>
                                </ul>
                            </section>

                            <section>
                                <h3>Service Availability</h3>
                                <ul>
                                    <li>We strive for high service availability but cannot guarantee 100% uptime</li>
                                    <li>Planned maintenance will be communicated in advance</li>
                                    <li>We provide reasonable support during normal business hours</li>
                                    <li>Critical security issues receive priority attention</li>
                                </ul>
                            </section>

                            <section>
                                <h3>Limitation of Liability</h3>
                                <p>The Service is provided "as is" without warranties. Our liability is limited to the amount paid for the Service in the past 12 months. We are not liable for indirect, incidental, or consequential damages.</p>
                            </section>

                            <section>
                                <h3>Contact Information</h3>
                                <p>For questions about these Terms, please contact us at:</p>
                                <p><strong>Email:</strong> ParaGrutaRally.Project@gmail.com</p>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
