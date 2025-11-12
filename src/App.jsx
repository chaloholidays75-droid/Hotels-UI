import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './Login/login';
import Register from './Login/register';
import ForgotPassword from './Login/ForgotPassword';
import ResetPassword from './Login/ResetPassword';
import HotelManagementSystem from './Hotel/HotelManagementSystem';
import AgencyManagement from './Agent/AgencyManagement';
import Dashboard from './Pages/dashboard';
import { checkAuth } from './api/authApi';
import Loader from './components/loader';
import HotelSalesList from './Hotel/HotelSalesList';
import Sidebar from './components/Sidebar';
import SupplierManagement from './Supplier/SupplierManagement';
import RecentActivityPage from './Pages/RecentActivityPage';
import BookingManagement from './Booking/BookingManagement';
import CommercialForm from './Booking/CommercialForm';
import TransportationForm from './Transportation/TransportationForm';
import SettingsPage from './Pages/SettingsPage';
import ReportsPage from './Pages/ReportsPage';
import RecentActivitiesPage from './Pages/RecentActivityPage';
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

// Protect routes
function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/backend/login" replace />;
}

function App() {
  const [userName, setUserName] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const { isAuthenticated, userFullName } = await checkAuth();
        setIsAuthenticated(isAuthenticated);
        setUserName(userFullName || null);
      } catch {
        setIsAuthenticated(false);
        setUserName(null);
      } finally {
        setIsLoading(false);
      }
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
        {/* Protected pages with sidebar */}
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
          path="/backend/product/Reports"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Layout userName={userName} onLogout={handleLogout}>
                <ReportsPage/>
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

        {/* Auth routes WITHOUT sidebar */}
        <Route
          path="/backend/login"
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
        <Route path="/recent-activities" element={<RecentActivityPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/backend/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
