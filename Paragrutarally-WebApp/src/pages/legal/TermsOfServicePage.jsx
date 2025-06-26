// src/pages/legal/TermsOfServicePage.jsx
import React from 'react';
import './SimpleLegalPages.css';

const TermsOfServicePage = () => {
    return (
        <div className="simple-legal-page">
            <div className="legal-container">
                <h1>Terms of Service</h1>
                <p className="effective-date"><strong>Effective Date:</strong> December 25, 2024</p>

                <section>
                    <h2>Acceptance of Terms</h2>
                    <p>By accessing or using our charity management application, you agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use the Service.</p>
                </section>

                <section>
                    <h2>Description of Service</h2>
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
                    <h2>User Accounts</h2>
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
                    <h2>Acceptable Use</h2>
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
                    <h2>Data Responsibility</h2>
                    <ul>
                        <li>You retain ownership of all data you upload</li>
                        <li>You must ensure proper authorization for personal data management</li>
                        <li>You must comply with applicable data protection laws</li>
                        <li>You are responsible for data accuracy and completeness</li>
                    </ul>
                </section>

                <section>
                    <h2>Service Availability</h2>
                    <ul>
                        <li>We strive for high service availability but cannot guarantee 100% uptime</li>
                        <li>Planned maintenance will be communicated in advance</li>
                        <li>We provide reasonable support during normal business hours</li>
                        <li>Critical security issues receive priority attention</li>
                    </ul>
                </section>

                <section>
                    <h2>Limitation of Liability</h2>
                    <p>The Service is provided "as is" without warranties. Our liability is limited to the amount paid for the Service in the past 12 months. We are not liable for indirect, incidental, or consequential damages.</p>
                </section>

                <section>
                    <h2>Contact Information</h2>
                    <p>For questions about these Terms, please contact us at:</p>
                    <p><strong>Email:</strong> legal@paragrutarally.org<br/>
                    <strong>Phone:</strong> (555) 123-4567</p>
                </section>

                <div className="back-to-app">
                    <a href="/">← Back to ParaGrutaRally</a>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;