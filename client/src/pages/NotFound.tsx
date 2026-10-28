import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight, ShieldAlert } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center text-center px-4 bg-gradient-dashboard relative overflow-hidden py-16">
      <div className="max-w-md w-full space-y-6 bg-white p-10 rounded-3xl border border-turfborder shadow-elevated relative z-10">
        <div className="w-20 h-20 rounded-3xl bg-gradient-booking text-charcoal flex items-center justify-center font-black text-3xl mx-auto shadow-lime-sm border border-emerald-300">
          404
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-forest-800 bg-forest-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-3">
            Out of Bounds
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Pitch or Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed mt-2">
            The sports arena, pitch, or system page you are looking for doesn't exist or has been relocated to another sector.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-brand text-white rounded-xl text-xs font-black shadow-brand hover:opacity-95 transition-all active:scale-95"
          >
            <Compass className="w-4 h-4" />
            <span>Return to Arena Hub</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
