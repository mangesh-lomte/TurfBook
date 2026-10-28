import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FootballIcon, ArenaIcon } from './SportIcon';
import {
  Calendar,
  Compass,
  User as UserIcon,
  LogOut,
  Shield,
  Briefcase,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDemoMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const activeNavLinkClass =
    'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 bg-gradient-brand text-white shadow-brand border border-[#27864F]/50';
  const inactiveNavLinkClass =
    'px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60';

  return (
    <nav className="sticky top-0 z-50 bg-[#0B241A]/95 backdrop-blur-xl border-b border-[#176443]/30 transition-all shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand border border-[#B9F65A]/40 flex items-center justify-center shadow-brand group-hover:scale-105 transition-transform duration-200">
                <span className="text-xl font-black text-white">T</span>
                <span className="text-xl font-black text-[#B9F65A]">B</span>
              </div>
              <div>
                <div className="flex items-center">
                  <span className="text-xl font-black tracking-tight text-white">Turf</span>
                  <span className="text-xl font-black tracking-tight text-[#B9F65A]">Book</span>
                </div>
                <span className="block -mt-1 text-[9px] tracking-widest font-extrabold uppercase text-[#D5E2D8]/70">
                  Sports Arena
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1.5">
              <Link
                to="/explore"
                className={isActive('/explore') ? activeNavLinkClass : inactiveNavLinkClass}
              >
                <Compass className={`w-4 h-4 ${isActive('/explore') ? 'text-[#B9F65A]' : 'text-[#D5E2D8]'}`} />
                <span>Explore Turfs</span>
              </Link>

              {user?.role === 'CUSTOMER' && (
                <>
                  <Link
                    to="/customer/bookings"
                    className={isActive('/customer/bookings') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    <Calendar className={`w-4 h-4 ${isActive('/customer/bookings') ? 'text-[#B9F65A]' : 'text-[#D5E2D8]'}`} />
                    <span>My Bookings</span>
                  </Link>
                  <Link
                    to="/customer/dashboard"
                    className={isActive('/customer/dashboard') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    Dashboard
                  </Link>
                </>
              )}

              {user?.role === 'OWNER' && (
                <>
                  <Link
                    to="/owner/dashboard"
                    className={isActive('/owner/dashboard') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    <Briefcase className={`w-4 h-4 ${isActive('/owner/dashboard') ? 'text-[#B9F65A]' : 'text-[#D5E2D8]'}`} />
                    <span>Owner Portal</span>
                  </Link>
                  <Link
                    to="/owner/venues"
                    className={isActive('/owner/venues') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    My Venues
                  </Link>
                  <Link
                    to="/owner/reservations"
                    className={isActive('/owner/reservations') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    Reservations
                  </Link>
                </>
              )}

              {user?.role === 'ADMIN' && (
                <>
                  <Link
                    to="/admin/overview"
                    className={isActive('/admin/overview') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    <Shield className={`w-4 h-4 ${isActive('/admin/overview') ? 'text-[#B9F65A]' : 'text-rose-400'}`} />
                    <span>Admin Overview</span>
                  </Link>
                  <Link
                    to="/admin/venues/pending"
                    className={isActive('/admin/venues/pending') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    Approvals
                  </Link>
                  <Link
                    to="/admin/users"
                    className={isActive('/admin/users') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    Users
                  </Link>
                  <Link
                    to="/admin/audit-logs"
                    className={isActive('/admin/audit-logs') ? activeNavLinkClass : inactiveNavLinkClass}
                  >
                    Audit
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
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="px-3 py-1.5 rounded-xl border border-[#176443] bg-[#07150F] text-[#B9F65A] text-xs font-bold flex items-center gap-1.5 hover:bg-[#123B2A] transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9F65A] cursor-pointer"
                title="Quick demo account login"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B9F65A]" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-[#B9F65A]" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0B241A] rounded-2xl shadow-elevated-dark border border-[#176443]/50 py-2.5 z-50">
                  <div className="px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#B9F65A]">
                    1-Click Persona Switcher
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      demoLogin('CUSTOMER');
                      setDemoMenuOpen(false);
                      navigate('/explore');
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-[#123B2A] flex items-center justify-between transition-colors text-white cursor-pointer"
                  >
                    <span className="font-bold flex items-center gap-2">
                      <FootballIcon className="w-3.5 h-3.5 text-[#B9F65A]" />
                      <span>Customer</span>
                    </span>
                    <span className="text-[10px] text-[#D5E2D8]">Rohan G.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      demoLogin('OWNER');
                      setDemoMenuOpen(false);
                      navigate('/owner/dashboard');
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-[#123B2A] flex items-center justify-between transition-colors text-white cursor-pointer"
                  >
                    <span className="font-bold flex items-center gap-2">
                      <ArenaIcon className="w-3.5 h-3.5 text-[#B9F65A]" />
                      <span>Turf Owner</span>
                    </span>
                    <span className="text-[10px] text-[#D5E2D8]">Rajesh S.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      demoLogin('ADMIN');
                      setDemoMenuOpen(false);
                      navigate('/admin/overview');
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-[#123B2A] flex items-center justify-between transition-colors text-white cursor-pointer"
                  >
                    <span className="font-bold flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#B9F65A]" />
                      <span>Platform Admin</span>
                    </span>
                    <span className="text-[10px] text-[#D5E2D8]">Vikram M.</span>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{user.fullName}</div>
                  <div className="text-[9px] uppercase font-black tracking-wider text-[#B9F65A]">
                    {user.role}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-gradient-brand text-[#B9F65A] flex items-center justify-center font-black text-sm border-2 border-[#176443] shadow-xs">
                  {user.fullName.charAt(0)}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-[#D5E2D8] hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-[#D5E2D8] hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-black text-[#18231D] bg-gradient-booking hover:brightness-105 rounded-xl shadow-lime-sm transition-all cursor-pointer"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 text-slate-300 hover:text-white hover:bg-[#123B2A] rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#176443]/30 bg-[#0B241A]/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 shadow-2xl">
          {/* Quick Demo Switcher on Mobile */}
          <div className="bg-[#07150F] border border-[#176443]/40 rounded-2xl p-3">
            <span className="text-[10px] font-black text-[#B9F65A] uppercase tracking-wider block mb-2">
              1-Click Persona Switcher
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  demoLogin('CUSTOMER');
                  setMobileMenuOpen(false);
                  navigate('/explore');
                }}
                className="py-1.5 px-1 bg-[#0B241A] border border-[#176443]/50 rounded-xl text-xs font-bold text-white text-center hover:bg-[#123B2A] flex items-center justify-center gap-1 cursor-pointer"
              >
                <FootballIcon className="w-3 h-3 text-[#B9F65A]" />
                <span>Player</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  demoLogin('OWNER');
                  setMobileMenuOpen(false);
                  navigate('/owner/dashboard');
                }}
                className="py-1.5 px-1 bg-[#0B241A] border border-[#176443]/50 rounded-xl text-xs font-bold text-white text-center hover:bg-[#123B2A] flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArenaIcon className="w-3 h-3 text-[#B9F65A]" />
                <span>Owner</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  demoLogin('ADMIN');
                  setMobileMenuOpen(false);
                  navigate('/admin/overview');
                }}
                className="py-1.5 px-1 bg-[#0B241A] border border-[#176443]/50 rounded-xl text-xs font-bold text-white text-center hover:bg-[#123B2A] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Shield className="w-3 h-3 text-[#B9F65A]" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              to="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
            >
              Explore Turfs
            </Link>

            {user?.role === 'CUSTOMER' && (
              <>
                <Link
                  to="/customer/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
                >
                  My Bookings
                </Link>
                <Link
                  to="/customer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
                >
                  Player Dashboard
                </Link>
              </>
            )}

            {user?.role === 'OWNER' && (
              <>
                <Link
                  to="/owner/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
                >
                  Owner Dashboard
                </Link>
                <Link
                  to="/owner/venues"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
                >
                  My Venues
                </Link>
                <Link
                  to="/owner/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
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
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
                >
                  Admin Overview
                </Link>
                <Link
                  to="/admin/venues/pending"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
                >
                  Venue Approvals
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
                >
                  Users Directory
                </Link>
                <Link
                  to="/admin/audit-logs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-bold text-[#D5E2D8] hover:text-white hover:bg-[#123B2A]/60"
                >
                  Audit Logs
                </Link>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-[#176443]/30">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{user.fullName}</div>
                  <div className="text-[10px] uppercase font-bold text-[#B9F65A]">{user.role}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-rose-300 font-bold text-xs bg-rose-950/60 hover:bg-rose-900/60 rounded-xl border border-rose-800/40 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 text-xs font-bold border border-[#DFE6DF]/20 text-[#D5E2D8] rounded-xl bg-[#07150F]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 text-xs font-black bg-gradient-booking text-[#18231D] rounded-xl shadow-lime-sm"
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
