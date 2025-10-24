import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { AuthContext } from '../context/AuthContext.jsx';

const Sidebar = ({ onLogout }) => {
  const { user, logout } = useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeIndicator, setActiveIndicator] = useState({ top: 0, height: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const menuItemsRef = useRef([]);

  const menuItems = [
    { id: 1, name: 'Dashboard', icon: <fml-icon name="analytics-outline"></fml-icon>, path: '/backend/product/dashboard' },
    { id: 2, name: 'Hotel', icon: <fml-icon name="pricetag-outline"></fml-icon>, path: '/backend/product/hotel' },
    { id: 3, name: 'Agency', icon: <fml-icon name="people-outline"></fml-icon>, path: '/backend/product/agency' },
    { id: 4, name: 'Supplier', icon: <fml-icon name="storefront-outline"></fml-icon>, path: '/backend/product/supplier' },
    { id: 5, name: 'Booking', icon: <fml-icon name="document-outline"></fml-icon>, path: '/backend/product/booking' },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', newState);
      return newState;
    });
  };

  // Update active indicator position
  useEffect(() => {
    const activeIndex = menuItems.findIndex(item => location.pathname === item.path);
    if (activeIndex !== -1 && menuItemsRef.current[activeIndex]) {
      const activeElement = menuItemsRef.current[activeIndex];
      const { offsetTop, offsetHeight } = activeElement;
      
      setActiveIndicator({
        top: offsetTop,
        height: offsetHeight,
        opacity: 1
      });
    }
  }, [location.pathname, isCollapsed]);

  useEffect(() => {
    document.body.classList.toggle('sb-collapsed', isCollapsed);
  }, [isCollapsed]);

  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) onLogout();
      navigate('/backend/login', { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      navigate('/backend/login', { replace: true });
    }
  };

  return (
    <div className={`sb-sidebar ${isCollapsed ? 'sb-collapsed' : ''}`}>
      {/* Header */}
      <div className="sb-sidebar-header">
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <button
              className="sb-toggle-btn"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!isCollapsed}
            >
              <fml-icon name="earth-outline"></fml-icon>
            </button>
          </div>
          {!isCollapsed && <span className="sb-logo-text">Registration</span>}
        </div>
      </div>

      {/* Menu */}
      <div className="sb-sidebar-content">
        <nav className="sb-sidebar-nav">
          {/* Active Indicator */}
          <div 
            className="sb-active-indicator"
            style={{
              top: `${activeIndicator.top}px`,
              height: `${activeIndicator.height}px`,
              opacity: activeIndicator.opacity || 0
            }}
          />
          
          <ul>
            {menuItems.map((item, index) => (
              <li
                key={item.id}
                ref={el => menuItemsRef.current[index] = el}
                className={`sb-menu-item ${location.pathname === item.path ? 'sb-active' : ''}`}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link 
                  to={item.path}
                  className="sb-menu-link"
                >
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
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=7269ef&color=fff`}
              alt={user?.name || "User"}
            />
          </div>
          {!isCollapsed && (
            <div className="sb-user-info">
              <h4>{user?.name || "User"}</h4>
              <p>{user?.role || "Guest"}</p>
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