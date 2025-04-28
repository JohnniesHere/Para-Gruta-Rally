import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <h3>Administration</h3>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <NavLink to="/admin" end className={({isActive}) => isActive ? 'active' : ''}>
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/users" className={({isActive}) => isActive ? 'active' : ''}>
                            Users
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/events" className={({isActive}) => isActive ? 'active' : ''}>
                            Events
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/vehicles" className={({isActive}) => isActive ? 'active' : ''}>
                            Vehicles
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/admin/instructors" className={({isActive}) => isActive ? 'active' : ''}>
                            Instructors
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default AdminSidebar;