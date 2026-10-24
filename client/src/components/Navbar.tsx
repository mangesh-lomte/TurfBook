import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  Compass,
  User as UserIcon,
  LogOut,
  Shield,
  Briefcase,
  Menu,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-forest-900 flex items-center justify-center text-turf shadow-md group-hover:scale-105 transition-transform">
                <span className="text-xl font-black tracking-tight">T</span>
                <span className="text-xl font-bold text-turf-bright">B</span>
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-forest-950">Turf</span>
                <span className="text-xl font-extrabold tracking-tight text-turf">Book</span>
                <span className="block -mt-1 text-[10px] tracking-widest font-semibold uppercase text-slate-400">
                  Sports Arena
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/explore"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/explore')
                    ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                    : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                }`}
              >
                <Compass className="w-4 h-4 text-turf" />
                Explore Turfs
              </Link>

              {user?.role === 'CUSTOMER' && (
                <>
                  <Link
                    to="/customer/bookings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/customer/bookings')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-turf" />
                    My Bookings
                  </Link>
                  <Link
                    to="/customer/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/customer/dashboard')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                </>
              )}

              {user?.role === 'OWNER' && (
                <>
                  <Link
                    to="/owner/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/owner/dashboard')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    Owner Dashboard
                  </Link>
                  <Link
                    to="/owner/venues"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/owner/venues')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    My Venues
                  </Link>
                  <Link
                    to="/owner/reservations"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/owner/reservations')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    Reservations
                  </Link>
                </>
              )}

              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/overview"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/admin/overview')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-rose-600" />
                    Admin Overview
                  </Link>
                  <Link
                    to="/admin/venues/pending"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/venues/pending')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    Venue Approvals
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/users')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/audit-logs')
                        ? 'text-forest-900 bg-emerald-50/80 font-semibold'
                        : 'text-slate-600 hover:text-forest-900 hover:bg-slate-50'
                    }`}
                  >
                    Audit Logs
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* 1-Click Demo Login Switcher */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-sm"
                title="Quick demo account login"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Demo Logins
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase text-slate-400">
                    Switch Persona in 1-Click
                  </div>
                  <button
                    onClick={() => {
                      demoLogin('CUSTOMER');
                      setDemoMenuOpen(false);
                      navigate('/explore');
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-700">⚽ Customer</span>
                    <span className="text-[10px] text-slate-400">Rohan G.</span>
                  </button>
                  <button
                    onClick={() => {
                      demoLogin('OWNER');
                      setDemoMenuOpen(false);
                      navigate('/owner/dashboard');
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-700">🏟️ Turf Owner</span>
                    <span className="text-[10px] text-slate-400">Rajesh S.</span>
                  </button>
                  <button
                    onClick={() => {
                      demoLogin('ADMIN');
                      setDemoMenuOpen(false);
                      navigate('/admin/overview');
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-700">🛡️ Platform Admin</span>
                    <span className="text-[10px] text-slate-400">Vikram M.</span>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">{user.fullName}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600">
                    {user.role}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-forest-900 text-turf flex items-center justify-center font-bold text-sm border-2 border-emerald-400">
                  {user.fullName.charAt(0)}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-forest-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-forest-900 hover:bg-forest-800 rounded-xl shadow-sm transition-all hover:shadow"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Explore Turfs
          </Link>

          {user?.role === 'CUSTOMER' && (
            <>
              <Link
                to="/customer/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                My Bookings
              </Link>
              <Link
                to="/customer/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>
            </>
          )}

          {user?.role === 'OWNER' && (
            <>
              <Link
                to="/owner/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Owner Dashboard
              </Link>
              <Link
                to="/owner/venues"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                My Venues
              </Link>
              <Link
                to="/owner/reservations"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Reservations
              </Link>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <Link
                to="/admin/overview"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Admin Overview
              </Link>
              <Link
                to="/admin/venues/pending"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Venue Approvals
              </Link>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-rose-600 font-semibold text-sm hover:bg-rose-50 rounded-lg"
              >
                Logout ({user.fullName})
              </button>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold border border-slate-200 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold bg-forest-900 text-white rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
