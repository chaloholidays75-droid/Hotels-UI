import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [hoveredItem, setHoveredItem] = useState(null);
  const location = useLocation();

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

  // useEffect(() => {
  //   document.body.classList.toggle('sb-collapsed', isCollapsed);
    
    // Adjust page content based on sidebar state
  //   const pageContent = document.querySelector('.page-content');
  //   if (pageContent) {
  //     if (isCollapsed) {
  //       pageContent.style.marginLeft = '80px';
  //       pageContent.style.width = 'calc(100% - 80px)';
  //     } else {
  //       pageContent.style.marginLeft = '250px';
  //       pageContent.style.width = 'calc(100% - 250px)';
  //     }
  //   }
  // }, [isCollapsed]);
  useEffect(() => {
  document.body.classList.toggle('sb-collapsed', isCollapsed);
}, [isCollapsed]);


  return (
    <>
      <div className={`sb-sidebar ${isCollapsed ? 'sb-collapsed' : ''}`}>
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

        <div className="sb-sidebar-footer">
          <div className="sb-user-profile">
            <div className="sb-avatar">
              <img src="https://ui-avatars.com/api/?name=User+Name&background=7269ef&color=fff" alt="User" />
            </div>
            {!isCollapsed && (
              <div className="sb-user-info">
                <h4>User Name</h4>
                <p>Admin</p>
              </div>
            )}
          </div>
          <a href="#!" className="sb-logout-btn">
            <span className="sb-menu-icon"><fml-icon name="log-out-outline"></fml-icon></span>
            {!isCollapsed && <span>Logout</span>}
          </a>
        </div>
      </div>
    </>
  );
};

export default Sidebar;