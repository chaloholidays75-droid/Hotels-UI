import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ onLogout }) => {
  const { user } = useContext(AuthContext); // ✅ get name & role
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [hoveredItem, setHoveredItem] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, name: 'Dashboard', icon: <fml-icon name="analytics-outline"></fml-icon>, path: '/backend/product/dashboard' },
    { id: 2, name: 'Hotel', icon: <fml-icon name="pricetag-outline"></fml-icon>, path: '/backend/product/hotel' },
    { id: 3, name: 'Agency', icon: <fml-icon name="people-outline"></fml-icon>, path: '/backend/product/agency' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', newState);
      return newState;
    });
  };

  useEffect(() => {
    document.body.classList.toggle('sb-collapsed', isCollapsed);
  }, [isCollapsed]);

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/backend/login', { replace: true });
  };

  return (
    <div className={`sb-sidebar ${isCollapsed ? 'sb-collapsed' : ''}`}>
      {/* Header */}
      <div className="sb-sidebar-header">
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <button className="sb-toggle-btn" onClick={toggleSidebar}>
              <fml-icon name="earth-outline"></fml-icon>
            </button>
          </div>
          {!isCollapsed && <span className="sb-logo-text">Registration</span>}
        </div>
      </div>

      {/* Menu */}
      <div className="sb-sidebar-content">
        <nav className="sb-sidebar-nav">
          <ul>
            {menuItems.map(item => (
              <li
                key={item.id}
                className={location.pathname === item.path ? 'sb-active' : ''}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link to={item.path}>
                  <div className="sb-menu-item-content">
                    <span className="sb-menu-icon">{item.icon}</span>
                    {!isCollapsed && <span className="sb-menu-text">{item.name}</span>}
                  </div>
                  {isCollapsed && hoveredItem === item.id && (
                    <div className="sb-tooltip">{item.name}</div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Footer */}
      <div className="sb-sidebar-footer">
        <div className="sb-user-profile">
          <div className="sb-avatar">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7269ef&color=fff`}
              alt={user.name}
            />
          </div>
          {!isCollapsed && (
            <div className="sb-user-info">
              <h4>{user.name}</h4>
              <p>{user.role}</p> {/* 👈 live updates now */}
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="sb-logout-btn">
          <span className="sb-menu-icon"><fml-icon name="log-out-outline"></fml-icon></span>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
