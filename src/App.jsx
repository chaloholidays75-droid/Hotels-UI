import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './Login/login';
import Register from './Login/register';
import ForgotPassword from './Login/ForgotPassword';
import ResetPassword from './Login/ResetPassword';
import HotelManagementSystem from './Hotel/HotelManagementSystem';
import AgencyManagement from './Agent/AgencyManagement';
import Dashboard from './Pages/dashboard';
import { checkAuth, autoLogin, refreshTokens, logoutApi } from './api/authApi';
import Loader from './components/loader';
import HotelSalesList from './Hotel/HotelSalesList';
import Sidebar from './components/Sidebar';
import SupplierManagement from './Supplier/SupplierManagement';
import RecentActivitiesPage from './Pages/RecentActivityPage';
import BookingManagement from './Booking/BookingManagement';
import CommercialForm from './Booking/CommercialForm';
import TransportationForm from './Transportation/TransportationForm';
import SettingsPage from './Pages/SettingsPage';
import ReportsPage from './Pages/ReportsPage';
import MultiRoot from './Multi/MultiRoot';
import './App.css';

// Layout for authenticated pages
function Layout({ children, userName, onLogout }) {
  return (
    <div className="app-container">
      <Sidebar userName={userName} onLogout={onLogout} />
      <div className="page-content">{children}</div>
    </div>
  );
}

function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/backend/login" replace />;
}

function App() {
  const [userName, setUserName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔒 Initial auth check + silent auto-login
  useEffect(() => {
    async function verifyAuth() {
      try {
        const { isAuthenticated, userFullName } = await checkAuth();
        if (isAuthenticated) {
          setUserName(userFullName);
          setIsAuthenticated(true);
        } else {
          // fallback to cookie auto-login
          const auto = await autoLogin();
          if (auto) {
            setUserName(auto.userFullName);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.warn("Auth check failed", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    verifyAuth();
  }, []);

  // 🔁 Periodically refresh tokens (every 10 min)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (isAuthenticated) await refreshTokens();
      } catch (e) {
        console.warn("Token refresh failed", e);
      }
    }, 10 * 6 * 100);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      setUserName(null);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login setUserName={setUserName} setIsAuthenticated={setIsAuthenticated} />
            )
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <Dashboard userName={userName} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/multi"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <MultiRoot />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <Dashboard userName={userName} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/settings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/recent-activities"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <RecentActivitiesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/reports"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/hotel"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <HotelManagementSystem />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/agency"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <AgencyManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/list"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <HotelSalesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/supplier"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <SupplierManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/booking"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <BookingManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/transportation"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <TransportationForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/backend/product/booking/commercial"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <CommercialForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/backend/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
