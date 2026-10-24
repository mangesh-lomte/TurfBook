import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-forest-950 text-slate-300 pt-16 pb-12 border-t border-forest-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-forest-900/60">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-forest-800 flex items-center justify-center text-turf shadow">
                <span className="text-lg font-black">T</span>
                <span className="text-lg font-bold text-turf-bright">B</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">TurfBook</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              India's premier sports turf discovery and reservation platform. Book pristine football
              pitches, box cricket arenas, and indoor badminton courts in seconds.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PostgreSQL Concurrency Protection</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Explore & Book
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/explore" className="hover:text-emerald-400 transition-colors">
                  All Sports Turfs
                </Link>
              </li>
              <li>
                <Link to="/explore?sport=football" className="hover:text-emerald-400 transition-colors">
                  Football Pitches
                </Link>
              </li>
              <li>
                <Link to="/explore?sport=box-cricket" className="hover:text-emerald-400 transition-colors">
                  Box Cricket Arenas
                </Link>
              </li>
              <li>
                <Link to="/explore?sport=badminton" className="hover:text-emerald-400 transition-colors">
                  Badminton Courts
                </Link>
              </li>
              <li>
                <Link to="/cancellation-policy" className="hover:text-emerald-400 transition-colors">
                  Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Owner & Admin Portals */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              For Turf Owners
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/owner/dashboard" className="hover:text-emerald-400 transition-colors">
                  Owner Dashboard
                </Link>
              </li>
              <li>
                <Link to="/owner/venues/create" className="hover:text-emerald-400 transition-colors">
                  List Your Turf
                </Link>
              </li>
              <li>
                <Link to="/owner/reservations" className="hover:text-emerald-400 transition-colors">
                  Manage Reservations
                </Link>
              </li>
              <li>
                <Link to="/admin/overview" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>Admin Portal</span>
                  <span className="text-[10px] bg-forest-800 text-emerald-300 px-1.5 py-0.5 rounded">Demo</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Architecture */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">
              Architecture & Stack
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built with React, TypeScript, Vite, Node.js, Express, Prisma ORM, and PostgreSQL with
              GiST exclusion constraints for atomic slot reservation.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] bg-forest-900 border border-forest-800 px-2 py-0.5 rounded text-emerald-300">
                PostgreSQL 16
              </span>
              <span className="text-[11px] bg-forest-900 border border-forest-800 px-2 py-0.5 rounded text-emerald-300">
                Prisma ORM
              </span>
              <span className="text-[11px] bg-forest-900 border border-forest-800 px-2 py-0.5 rounded text-emerald-300">
                React 18 + TS
              </span>
              <span className="text-[11px] bg-forest-900 border border-forest-800 px-2 py-0.5 rounded text-emerald-300">
                Tailwind CSS
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} TurfBook. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for sports communities
          </p>
        </div>
      </div>
    </footer>
  );
};
