import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Sparkles, Box } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07150F] text-[#D5E2D8] pt-16 pb-12 border-t border-[#176443]/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#123B2A]">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-brand border border-[#B9F65A]/40 flex items-center justify-center shadow-brand">
                <span className="text-lg font-black text-white">T</span>
                <span className="text-lg font-black text-[#B9F65A]">B</span>
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Turf<span className="text-[#B9F65A]">Book</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#D5E2D8]/80 leading-relaxed font-normal">
              India's premier sports turf discovery and reservation platform. Experience realistic 3D arena previews, real-time slot locking, and zero double bookings.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#B9F65A] font-bold">
              <ShieldCheck className="w-4 h-4 text-[#B9F65A]" />
              <span>PostgreSQL GiST Concurrency Protection</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#B9F65A] mb-4">
              Explore & Book
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/explore" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors">
                  All Sports Turfs
                </Link>
              </li>
              <li>
                <Link to="/explore?sport=football" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors">
                  Football Pitches
                </Link>
              </li>
              <li>
                <Link to="/explore?sport=box-cricket" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors">
                  Box Cricket Arenas
                </Link>
              </li>
              <li>
                <Link to="/explore?sport=basketball" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors">
                  Basketball Courts
                </Link>
              </li>
              <li>
                <Link to="/cancellation-policy" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Owner & Admin Portals */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#B9F65A] mb-4">
              For Turf Owners
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link to="/owner/dashboard" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/owner/venues/create" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors">
                  List Your Turf
                </Link>
              </li>
              <li>
                <Link to="/owner/reservations" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors">
                  Manage Reservations
                </Link>
              </li>
              <li>
                <Link to="/admin/overview" className="text-[#D5E2D8] hover:text-[#B9F65A] transition-colors flex items-center gap-1.5">
                  <span>Admin Portal</span>
                  <span className="text-[10px] bg-[#0B241A] border border-[#176443] text-[#B9F65A] px-1.5 py-0.5 rounded-full font-bold">Demo</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Architecture */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#B9F65A] mb-4">
              Architecture & Stack
            </h4>
            <p className="text-xs text-[#D5E2D8]/80 leading-relaxed mb-3 font-normal">
              Polyglot architecture with Three.js 3D visualization, React 18 frontend, Node.js + Prisma backend, and FastAPI microservice.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] bg-[#0B241A] border border-[#176443]/40 px-2 py-0.5 rounded-lg text-[#D5E2D8] font-medium">
                Three.js WebGL
              </span>
              <span className="text-[11px] bg-[#0B241A] border border-[#176443]/40 px-2 py-0.5 rounded-lg text-[#D5E2D8] font-medium">
                PostgreSQL 16 GiST
              </span>
              <span className="text-[11px] bg-[#0B241A] border border-[#176443]/40 px-2 py-0.5 rounded-lg text-[#D5E2D8] font-medium">
                FastAPI Python
              </span>
              <span className="text-[11px] bg-[#0B241A] border border-[#176443]/40 px-2 py-0.5 rounded-lg text-[#D5E2D8] font-medium">
                React 18 + TS
              </span>
              <span className="text-[11px] bg-[#0B241A] border border-[#176443]/40 px-2 py-0.5 rounded-lg text-[#D5E2D8] font-medium">
                Prisma 5.22
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#D5E2D8]/70 gap-4">
          <p>© {new Date().getFullYear()} TurfBook. All rights reserved.</p>
          <p className="flex items-center gap-1.5 font-medium">
            <span>Engineered for sports communities with</span>
            <Heart className="w-3.5 h-3.5 text-[#B9F65A] fill-[#B9F65A]" />
          </p>
        </div>
      </div>
    </footer>
  );
};
