// src/pages/legal/PrivacyPolicyPage.jsx
import React from 'react';
import './SimpleLegalPages.css';

const PrivacyPolicyPage = () => {
    return (
        <div className="simple-legal-page">
            <div className="legal-container">
                <h1>Privacy Policy</h1>
                <p className="effective-date"><strong>Effective Date:</strong> June 23, 2025</p>

                <section>
                    <h2>Information We Collect</h2>
                    <p>The Paragrutarally application collects the following types of information:</p>
                    <ul>
                        <li><strong>Account Information:</strong> Name, email address, phone number, organization affiliation</li>
                        <li><strong>Profile Data:</strong> Display name, role within your organization, contact preferences</li>
                        <li><strong>Organizational Data:</strong> Event details, participant data, team information, form submissions</li>
                    </ul>
                </section>

                <section>
                    <h2>How We Use Your Information</h2>
                    <p>We use the collected information to:</p>
                    <ul>
                        <li>Provide core management services</li>
                        <li>Secure user authentication through Firebase</li>
                        <li>Replace disorganized Excel workflows with structured data management</li>
                        <li>Send important updates about your account and organizational activities</li>
                        <li>Improve app functionality and user experience</li>
                        <li>Protect against unauthorized access and maintain data integrity</li>
                    </ul>
                </section>

                <section>
                    <h2>Data Storage and Security</h2>
                    <p>All data is stored securely using Google Firebase services with:</p>
                    <ul>
                        <li>Data encryption in transit and at rest</li>
                        <li>Role-based access controls</li>
                        <li>Regular security audits and monitoring</li>
                        <li>Multi-factor authentication support</li>
                    </ul>
                </section>

                <section>
                    <h2>Your Rights</h2>
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
                    <h2>Data Sharing</h2>
                    <p>We never sell your personal information. We only share data:</p>
                    <ul>
                        <li>Within your organization based on assigned roles and permissions</li>
                        <li>With Firebase services for data processing and storage</li>
                        <li>When required by law or to protect our legal rights</li>
                        <li>In emergency situations to prevent harm</li>
                    </ul>
                </section>

                <section>
                    <h2>Contact Information</h2>
                    <p>For questions about this Privacy Policy, please contact us at:</p>
                    <p><strong>Email:</strong> privacy@paragrutarally.org</p>
                </section>

                <div className="back-to-app">
                    <a href="/">← Back to ParaGrutaRally</a>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;