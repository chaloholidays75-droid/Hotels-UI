import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './Login/login';
import Register from './Login/register';
import ForgotPassword from './Login/ForgotPassword';
import ResetPassword from './Login/ResetPassword';
import HotelManagementSystem from './Hotel/HotelManagementSystem';
import AgencyManagement from './Agent/AgencyManagement';
import HotelSalesList from './Hotelextra/HotelSalesList';
import { useState, useEffect } from 'react';
import { checkAuth } from './api';
import './App.css';
import Loader from './components/loader';
import Sidebar from './components/Sidebar'; // Import your Sidebar component

// Create a Layout component that includes the Sidebar
function Layout({ children, userName, onLogout }) {
  return (
    <div className="app-container">
      <Sidebar userName={userName} onLogout={onLogout} />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}

// Add the missing ProtectedRoute component
function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const [userName, setUserName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      const { isAuthenticated, userFullName } = await checkAuth();
      setIsAuthenticated(isAuthenticated);
      setUserName(userFullName);
      setIsLoading(false);
    }
    verifyAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUserName(null);
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/home"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <div className="container">
                  <h1>Welcome{userName ? `, ${userName}` : ''}!</h1>
                  <nav>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      <li>
                        <Link to="/" style={{ color: '#007bff', textDecoration: 'none', marginRight: '10px' }}>
                          Add Hotel Sale
                        </Link>
                      </li>
                      <li>
                        <Link to="/list" style={{ color: '#007bff', textDecoration: 'none', marginRight: '10px' }}>
                          View Hotel Sales
                        </Link>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <HotelManagementSystem userName={userName} onLogout={handleLogout} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <HotelManagementSystem userName={userName} onLogout={handleLogout} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agency"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <AgencyManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/list"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <HotelSalesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" />
            ) : (
              <Login setUserName={setUserName} setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;