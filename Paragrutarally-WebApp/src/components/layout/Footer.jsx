import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-logo">
                        <h3>Charity Race Events</h3>
                        <p>Creating joy through customized racing experiences for children with disabilities.</p>
                    </div>

                    <div className="footer-links">
                        <div className="footer-links-column">
                            <h4>Navigation</h4>
                            <ul>
                                <li><Link to="/">Home</Link></li>
                                <li><Link to="/about">About</Link></li>
                                <li><Link to="/events">Events</Link></li>
                                <li><Link to="/gallery">Gallery</Link></li>
                            </ul>
                        </div>

                        <div className="footer-links-column">
                            <h4>Contact</h4>
                            <ul>
                                <li><a href="mailto:info@example.org">info@example.org</a></li>
                                <li><a href="tel:+1234567890">(123) 456-7890</a></li>
                                <li>123 Main Street, City, State</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} Charity Race Events. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;