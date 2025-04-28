import React from 'react';
import { Link } from 'react-router-dom';

// CHANGE THIS TO ME RELEVANT!!!!!!!!!!!!!!!!!!!!!!!
// This is a placeholder for the actual organization name and mission

const AboutPage = () => {
    return (
        <div className="about-page">
            <div className="page-header">
                <h1>About Our Organization</h1>
            </div>

            <div className="card">
                <div className="about-section">
                    <h2>Our Mission</h2>
                    <p>
                        Our organization is dedicated to providing children with disabilities the opportunity
                        to experience the joy and thrill of racing. We believe that every child deserves
                        the chance to participate in fun, engaging activities regardless of their physical
                        abilities.
                    </p>
                    <p>
                        Through our custom-built vehicles and specialized racing events, we create
                        unforgettable experiences that bring smiles, build confidence, and foster inclusion.
                    </p>
                </div>
            </div>

            <div className="card">
                <div className="about-section">
                    <h2>What We Do</h2>
                    <div className="about-grid">
                        <div className="about-item">
                            <h3>Custom Vehicle Building</h3>
                            <p>
                                We design and build vehicles that are adapted to accommodate various disabilities.
                                Our team of engineers and mechanics work tirelessly to ensure each vehicle is safe,
                                comfortable, and enjoyable for the children to operate.
                            </p>
                        </div>

                        <div className="about-item">
                            <h3>Race Events</h3>
                            <p>
                                We organize racing events throughout the year where children can drive their custom
                                vehicles on specially designed tracks. These events are supervised by trained
                                instructors who ensure safety while maximizing fun.
                            </p>
                        </div>

                        <div className="about-item">
                            <h3>Community Building</h3>
                            <p>
                                Our events bring together families with similar experiences, creating a community of
                                support and understanding. Parents and siblings are encouraged to participate, making
                                it a family experience.
                            </p>
                        </div>

                        <div className="about-item">
                            <h3>Raising Awareness</h3>
                            <p>
                                Through our activities, we aim to raise awareness about the capabilities of children
                                with disabilities and promote inclusion in recreational activities.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="about-section">
                    <h2>Our Team</h2>
                    <p>
                        Our organization is powered by a dedicated team of staff and volunteers who are passionate
                        about creating meaningful experiences for children with disabilities. The team includes:
                    </p>
                    <ul className="team-list">
                        <li><strong>Mechanics and Engineers:</strong> Who design and build the custom vehicles</li>
                        <li><strong>Event Coordinators:</strong> Who organize and manage our racing events</li>
                        <li><strong>Instructors:</strong> Who guide and support the children during events</li>
                        <li><strong>Medical Staff:</strong> Who ensure the safety and well-being of participants</li>
                        <li><strong>Administrative Team:</strong> Who handle registrations and communication</li>
                    </ul>
                </div>
            </div>

            <div className="card">
                <div className="about-section">
                    <h2>Get Involved</h2>
                    <p>
                        There are many ways to get involved with our organization:
                    </p>
                    <div className="involvement-options">
                        <div className="involvement-option">
                            <h3>Participate</h3>
                            <p>
                                If you have a child with a disability who would enjoy our racing events,
                                register for an account and sign up for an upcoming event.
                            </p>
                            <Link to="/login" className="button">Register Now</Link>
                        </div>

                        <div className="involvement-option">
                            <h3>Volunteer</h3>
                            <p>
                                We're always looking for volunteers to help with vehicle building, event
                                coordination, and more. No special skills required - just a willing heart!
                            </p>
                            <a href="mailto:volunteer@example.org" className="button">Contact Us to Volunteer</a>
                        </div>

                        <div className="involvement-option">
                            <h3>Donate</h3>
                            <p>
                                Your financial support helps us build more vehicles and organize more events.
                                Every contribution makes a difference in a child's life.
                            </p>
                            <a href="mailto:donate@example.org" className="button">Learn About Donating</a>
                        </div>

                        <div className="involvement-option">
                            <h3>Spread the Word</h3>
                            <p>
                                Help us reach more families by sharing information about our organization
                                with your network.
                            </p>
                            <a href="mailto:info@example.org" className="button">Contact for Information</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;