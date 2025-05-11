// src/pages/admin/EventManagementPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Dashboard from '../../components/layout/Dashboard';
import './EventManagementPage.css';

const EventManagementPage = () => {
    return (
        <Dashboard requiredRole="admin">
            <div className="event-management">
                <div className="page-header">
                    <h1>Event Management</h1>
                    <Link to="/admin/events/create" className="create-button">
                        Create New Event
                    </Link>
                </div>

                <div className="event-actions">
                    <div className="event-search">
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="search-input"
                        />
                        <button className="search-button">Search</button>
                    </div>

                    <div className="event-filters">
                        <select className="filter-select">
                            <option value="all">All Events</option>
                            <option value="upcoming">Upcoming Events</option>
                            <option value="past">Past Events</option>
                        </select>

                        <select className="filter-select">
                            <option value="all">All Locations</option>
                            <option value="jerusalem">Jerusalem</option>
                            <option value="tel-aviv">Tel Aviv</option>
                            <option value="haifa">Haifa</option>
                        </select>
                    </div>
                </div>

                <div className="events-table-container">
                    <table className="events-table">
                        <thead>
                        <tr>
                            <th>Event Name</th>
                            <th>Date</th>
                            <th>Location</th>
                            <th>Participants</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Summer Race 2025</td>
                            <td>May 20, 2025</td>
                            <td>Jerusalem City Park</td>
                            <td>32</td>
                            <td><span className="status-badge upcoming">Upcoming</span></td>
                            <td className="action-buttons">
                                <button className="edit-button">Edit</button>
                                <button className="view-button">View</button>
                                <button className="delete-button">Delete</button>
                            </td>
                        </tr>
                        <tr>
                            <td>Beach Racing Day</td>
                            <td>June 15, 2025</td>
                            <td>Tel Aviv Beach</td>
                            <td>28</td>
                            <td><span className="status-badge upcoming">Upcoming</span></td>
                            <td className="action-buttons">
                                <button className="edit-button">Edit</button>
                                <button className="view-button">View</button>
                                <button className="delete-button">Delete</button>
                            </td>
                        </tr>
                        <tr>
                            <td>Spring Race 2025</td>
                            <td>April 10, 2025</td>
                            <td>Haifa Park</td>
                            <td>45</td>
                            <td><span className="status-badge completed">Completed</span></td>
                            <td className="action-buttons">
                                <button className="edit-button">Edit</button>
                                <button className="view-button">View</button>
                                <button className="delete-button">Delete</button>
                            </td>
                        </tr>
                        <tr>
                            <td>Winter Challenge</td>
                            <td>January 25, 2025</td>
                            <td>Eilat Beachfront</td>
                            <td>36</td>
                            <td><span className="status-badge completed">Completed</span></td>
                            <td className="action-buttons">
                                <button className="edit-button">Edit</button>
                                <button className="view-button">View</button>
                                <button className="delete-button">Delete</button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button className="pagination-button">&laquo; Previous</button>
                    <div className="pagination-numbers">
                        <button className="pagination-number active">1</button>
                        <button className="pagination-number">2</button>
                        <button className="pagination-number">3</button>
                    </div>
                    <button className="pagination-button">Next &raquo;</button>
                </div>
            </div>
        </Dashboard>
    );
};

export default EventManagementPage;