import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <nav className="sidebar">
      <ul className="sidebar-nav">
        <li>
          <NavLink to="/" end>
            📊 Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/workflows">
            🔄 Workflows
          </NavLink>
        </li>
        <li>
          <NavLink to="/alerts">
            🔔 Alerts
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;

