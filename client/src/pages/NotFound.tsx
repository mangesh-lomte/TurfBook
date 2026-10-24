import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-forest-900 text-turf flex items-center justify-center font-black text-2xl mx-auto shadow-md">
          404
        </div>
        <h1 className="text-2xl font-black text-slate-900">Page Not Found</h1>
        <p className="text-xs text-slate-500">
          The sports arena, ground, or page you are looking for doesn't exist or has moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-900 text-turf-bright rounded-xl text-xs font-bold hover:bg-forest-800 transition-colors shadow-sm"
        >
          <Compass className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};
