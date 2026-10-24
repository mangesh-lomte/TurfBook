import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

// Layout components
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// Public Pages
import { Home } from '../pages/Home';
import { ExploreVenues } from '../pages/ExploreVenues';
import { VenueDetails } from '../pages/VenueDetails';
import { BookingConfirmation } from '../pages/BookingConfirmation';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { CancellationPolicy } from '../pages/CancellationPolicy';
import { NotFound } from '../pages/NotFound';

// Customer Pages
import { CustomerDashboard } from '../pages/CustomerDashboard';
import { MyBookings } from '../pages/MyBookings';

// Owner Pages
import { OwnerDashboard } from '../pages/owner/OwnerDashboard';
import { OwnerVenues } from '../pages/owner/OwnerVenues';
import { OwnerVenueForm } from '../pages/owner/OwnerVenueForm';
import { OwnerGrounds } from '../pages/owner/OwnerGrounds';
import { OwnerReservations } from '../pages/owner/OwnerReservations';

// Admin Pages
import { AdminOverview } from '../pages/admin/AdminOverview';
import { AdminVenuesQueue } from '../pages/admin/AdminVenuesQueue';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminAuditLogs } from '../pages/admin/AdminAuditLogs';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

// Role-based Route Guard
const RoleRoute: React.FC<{ allowedRoles: Role[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<ExploreVenues />} />
          <Route path="/venues/:id" element={<VenueDetails />} />
          <Route path="/booking/confirmed/:id" element={<BookingConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cancellation-policy" element={<CancellationPolicy />} />

          {/* Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Owner Routes */}
          <Route
            path="/owner/dashboard"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/owner/venues"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerVenues />
              </RoleRoute>
            }
          />
          <Route
            path="/owner/venues/create"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerVenueForm />
              </RoleRoute>
            }
          />
          <Route
            path="/owner/venues/:venueId/grounds"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerGrounds />
              </RoleRoute>
            }
          />
          <Route
            path="/owner/reservations"
            element={
              <RoleRoute allowedRoles={['OWNER', 'ADMIN']}>
                <OwnerReservations />
              </RoleRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/overview"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminOverview />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/venues/pending"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminVenuesQueue />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminUsers />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RoleRoute allowedRoles={['ADMIN']}>
                <AdminAuditLogs />
              </RoleRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};
