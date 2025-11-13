// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

// Auth pages
import Login from "./Login/login";
import Register from "./Login/register";
import ForgotPassword from "./Login/ForgotPassword";
import ResetPassword from "./Login/ResetPassword";

// Sidebar + Layout
import Sidebar from "./components/Sidebar";
import Loader from "./components/loader";

// Pages
import Dashboard from "./Pages/dashboard";
import HotelManagementSystem from "./Hotel/HotelManagementSystem";
import AgencyManagement from "./Agent/AgencyManagement";
import SupplierManagement from "./Supplier/SupplierManagement";
import BookingManagement from "./Booking/BookingManagement";
import CommercialForm from "./Booking/CommercialForm";
import TransportationForm from "./Transportation/TransportationForm";
import SettingsPage from "./Pages/SettingsPage";
import ReportsPage from "./Pages/ReportsPage";
import RecentActivitiesPage from "./Pages/RecentActivityPage";
import MultiRoot from "./Multi/MultiRoot";
import HotelSalesList from "./Hotel/HotelSalesList";

import "./App.css";


// ---------------------------
// Protected Route Component
// ---------------------------
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// ---------------------------
// Layout Wrapper
// ---------------------------
function Layout({ children }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="app-container">
      <Sidebar userName={user?.name} onLogout={logout} />
      <div className="page-content">{children}</div>
    </div>
  );
}

// ---------------------------
// MAIN APP COMPONENT
// ---------------------------
function App() {
  const { isLoading, isAuthenticated, user } = useContext(AuthContext);

  if (isLoading) return <Loader />;

  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard userName={user?.name} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard userName={user?.name} />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/multi"
          element={
            <ProtectedRoute>
              <Layout>
                <MultiRoot />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/recent-activities"
          element={
            <ProtectedRoute>
              <Layout>
                <RecentActivitiesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/hotel"
          element={
            <ProtectedRoute>
              <Layout>
                <HotelManagementSystem />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/agency"
          element={
            <ProtectedRoute>
              <Layout>
                <AgencyManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/list"
          element={
            <ProtectedRoute>
              <Layout>
                <HotelSalesList />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/supplier"
          element={
            <ProtectedRoute>
              <Layout>
                <SupplierManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/booking"
          element={
            <ProtectedRoute>
              <Layout>
                <BookingManagement />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/transportation"
          element={
            <ProtectedRoute>
              <Layout>
                <TransportationForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/backend/product/booking/commercial"
          element={
            <ProtectedRoute>
              <Layout>
                <CommercialForm />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
