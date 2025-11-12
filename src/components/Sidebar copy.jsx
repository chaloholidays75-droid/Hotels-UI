import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './sidebar.css';
import { AuthContext } from '../context/AuthContext.jsx';

const Sidebar = ({ onLogout }) => {
  const { user, logout } = useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeIndicator, setActiveIndicator] = useState({ top: 0, height: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const menuItemsRef = useRef([]);
  const sidebarRef = useRef(null);

  // Enhanced menu items with categories and badges
  const menuItems = [
    { 
      id: 1, 
      name: 'Dashboard', 
      icon: <fml-icon name="analytics-outline"></fml-icon>, 
      path: '/backend/product/dashboard',
      badge: 3,
      category: 'Overview'
    },
    { 
      id: 2, 
      name: 'Hotel', 
      icon: <fml-icon name="pricetag-outline"></fml-icon>, 
      path: '/backend/product/hotel',
      category: 'Management'
    },
    { 
      id: 3, 
      name: 'Agency', 
      icon: <fml-icon name="people-outline"></fml-icon>, 
      path: '/backend/product/agency',
      category: 'Management'
    },
    { 
      id: 4, 
      name: 'Supplier', 
      icon: <fml-icon name="storefront-outline"></fml-icon>, 
      path: '/backend/product/supplier',
      category: 'Management'
    },
    { 
      id: 5, 
      name: 'Booking', 
      icon: <fml-icon name="document-outline"></fml-icon>, 
      path: '/backend/product/booking',
      badge: 5,
      category: 'Operations'
    },
    { 
      id: 6, 
      name: 'Transportation', 
      icon: <fml-icon name="car-sport-outline"></fml-icon>, 
      path: '/backend/product/transportation',
      category: 'Operations'
    },
    { 
      id: 7, 
      name: 'Reports', 
      icon: <fml-icon name="bar-chart-outline"></fml-icon>, 
      path: '/backend/product/reports',
      category: 'Analytics'
    },
    { 
      id: 8, 
      name: 'Settings', 
      icon: <fml-icon name="settings-outline"></fml-icon>, 
      path: '/backend/product/settings',
      category: 'System'
    },
  ];

  // Group items by category
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Filter menu items based on search
  const filteredMenuItems = searchQuery 
    ? menuItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : menuItems;

  // Quick actions for the footer
  const quickActionsList = [
    { id: 1, name: 'New Booking', icon: 'add-circle-outline', action: () => navigate('/backend/product/booking/new') },
    { id: 2, name: 'Quick Report', icon: 'download-outline', action: () => navigate('/backend/product/reports/quick') },
    { id: 3, name: 'Support', icon: 'help-circle-outline', action: () => window.open('/support', '_blank') },
  ];

  // Mock notifications
  useEffect(() => {
    setNotifications([
      { id: 1, message: 'New booking received', type: 'info', time: '2 min ago' },
      { id: 2, message: 'Payment processed', type: 'success', time: '5 min ago' },
      { id: 3, message: 'System update available', type: 'warning', time: '1 hour ago' },
    ]);
  }, []);

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

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  return (
    <div className={`sb-sidebar ${isCollapsed ? 'sb-collapsed' : ''}`} ref={sidebarRef}>
      {/* Header with Search */}
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
          {!isCollapsed && (
            <div className="sb-logo-content">
              <span className="sb-logo-text">Registration</span>
              <span className="sb-version">v2.1</span>
            </div>
          )}
        </div>

        {/* Search Bar - Only visible when expanded */}
        {!isCollapsed && (
          <div className="sb-search-container">
            <div className="sb-search-wrapper">
              <fml-icon name="search-outline" className="sb-search-icon"></fml-icon>
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sb-search-input"
              />
              {searchQuery && (
                <button 
                  className="sb-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <fml-icon name="close-outline"></fml-icon>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu with Categories */}
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
          
          {/* Search Results Info */}
          {searchQuery && !isCollapsed && (
            <div className="sb-search-results-info">
              Found {filteredMenuItems.length} results for "{searchQuery}"
            </div>
          )}

          <ul>
            {Object.entries(groupedMenuItems).map(([category, items]) => (
              <React.Fragment key={category}>
                {/* Category Header - Only show when not collapsed and no search active */}
                {!isCollapsed && !searchQuery && (
                  <li className="sb-category-header">
                    <span>{category}</span>
                  </li>
                )}
                
                {/* Menu Items */}
                {items
                  .filter(item => filteredMenuItems.includes(item))
                  .map((item, index) => (
                  <li
                    key={item.id}
                    ref={el => menuItemsRef.current[index] = el}
                    className={`sb-menu-item ${location.pathname === item.path ? 'sb-active' : ''} ${
                      searchQuery ? 'sb-search-match' : ''
                    }`}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link 
                      to={item.path}
                      className="sb-menu-link"
                    >
                      <div className="sb-menu-item-content">
                        <span className="sb-menu-icon">{item.icon}</span>
                        {!isCollapsed && (
                          <div className="sb-menu-text-wrapper">
                            <span className="sb-menu-text">{item.name}</span>
                            {item.badge && (
                              <span className="sb-menu-badge">{item.badge}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {isCollapsed && hoveredItem === item.id && (
                        <div className="sb-tooltip">
                          {item.name}
                          {item.badge && <span className="sb-tooltip-badge">{item.badge}</span>}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </React.Fragment>
            ))}
          </ul>
        </nav>
      </div>

      {/* Notifications Panel */}
      {showNotifications && !isCollapsed && (
        <div className="sb-notifications-panel">
          <div className="sb-notifications-header">
            <h4>Notifications</h4>
            <div className="sb-notifications-actions">
              <button onClick={clearNotifications}>Clear All</button>
              <button onClick={() => setShowNotifications(false)}>
                <fml-icon name="close-outline"></fml-icon>
              </button>
            </div>
          </div>
          <div className="sb-notifications-list">
            {notifications.map(notification => (
              <div key={notification.id} className={`sb-notification-item sb-notification-${notification.type}`}>
                <div className="sb-notification-content">
                  <p>{notification.message}</p>
                  <span className="sb-notification-time">{notification.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with Enhanced Features */}
      <div className="sb-sidebar-footer">
        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="sb-quick-actions">
            <div className="sb-quick-actions-header">
              <span>Quick Actions</span>
            </div>
            <div className="sb-quick-actions-grid">
              {quickActionsList.map(action => (
                <button
                  key={action.id}
                  className="sb-quick-action-btn"
                  onClick={action.action}
                  title={action.name}
                >
                  <fml-icon name={action.icon}></fml-icon>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="sb-notifications-container">
          <button 
            className="sb-notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <fml-icon name="notifications-outline"></fml-icon>
            {notifications.length > 0 && (
              <span className="sb-notifications-badge">{notifications.length}</span>
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="sb-user-profile">
          <div className="sb-avatar">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=7269ef&color=fff&bold=true`}
              alt={user?.name || "User"}
            />
            <div className="sb-user-status"></div>
          </div>
          {!isCollapsed && (
            <div className="sb-user-info">
              <h4>{user?.name || "User"}</h4>
              <p>{user?.role || "Guest"}</p>
              <span className="sb-user-email">{user?.email || "user@example.com"}</span>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button onClick={handleLogout} className="sb-logout-btn" title="Logout">
          <span className="sb-menu-icon">
            <fml-icon name="log-out-outline"></fml-icon>
          </span>
          {!isCollapsed && <span>Logout</span>}
        </button>

        {/* Theme Toggle */}
        <button className="sb-theme-toggle" title="Toggle Theme">
          <fml-icon name="contrast-outline"></fml-icon>
          {!isCollapsed && <span>Theme</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;