import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const HomePage = () => {
    const { currentUser, userRole } = useAuth();

    return (
        <div className="home-page">
            <div className="hero-section">
                <div className="hero-content">
                    <h1>Race Events for Children with Disabilities</h1>
                    <p className="hero-description">
                        We build custom cars to give children with disabilities the experience of a lifetime.
                        Our events create memories, connections, and joy through the power of racing.
                    </p>

                    {!currentUser ? (
                        <div className="hero-cta">
                            <Link to="/login" className="button cta-button">Login to Get Started</Link>
                            <span className="cta-divider">or</span>
                            <Link to="/about" className="button secondary-button">Learn More</Link>
                        </div>
                    ) : (
                        <div className="hero-cta">
                            <Link
                                to={userRole === 'admin' ? '/admin' : '/parent'}
                                className="button cta-button"
                            >
                                Go to Dashboard
                            </Link>
                            <Link to="/events" className="button secondary-button">View Events</Link>
                        </div>
                    )}
                </div>
            </div>

            <div className="features-section">
                <div className="container">
                    <h2 className="section-title">What We Offer</h2>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🏎️</div>
                            <h3>Custom Vehicles</h3>
                            <p>Specially designed and built vehicles adapted to each child's unique needs.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🏁</div>
                            <h3>Race Events</h3>
                            <p>Organized racing events where children can experience the thrill of driving.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">👨‍👩‍👧‍👦</div>
                            <h3>Community Support</h3>
                            <p>A supportive community of families, volunteers, and staff dedicated to creating joyful experiences.</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📸</div>
                            <h3>Memories</h3>
                            <p>Documentation and photos of each event for families to cherish forever.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="how-it-works-section">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>

                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h3>Register</h3>
                                <p>Parents register and provide information about their child's needs.</p>
                            </div>
                        </div>

                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h3>Event Signup</h3>
                                <p>Browse upcoming events and register your child to participate.</p>
                            </div>
                        </div>

                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h3>Vehicle Assignment</h3>
                                <p>Our team assigns appropriate vehicles based on each child's requirements.</p>
                            </div>
                        </div>

                        <div className="step">
                            <div className="step-number">4</div>
                            <div className="step-content">
                                <h3>Race Day</h3>
                                <p>Attend the event, meet our instructors, and enjoy the racing experience!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="cta-section">
                <div className="container">
                    <h2>Ready to Join an Event?</h2>
                    <p>Sign up to register your child for our upcoming race events.</p>
                    <Link to={currentUser ? '/events' : '/login'} className="button cta-button">
                        {currentUser ? 'View Events' : 'Get Started'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HomePage;