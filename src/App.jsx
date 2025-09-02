import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import HotelSalesForm from './Hotel/HotelSalesForm';
import HotelSalesList from './Hotel/HotelSalesList';
import { useState, useEffect } from 'react';
import { checkAuth } from './services/api';
import './App.css';

function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function Home({ userName, onLogout }) {
  return (
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
          <li>
            <button
              onClick={onLogout}
              style={{
                padding: '10px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
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
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home userName={userName} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/form"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <HotelSalesForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/list"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <HotelSalesList />
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