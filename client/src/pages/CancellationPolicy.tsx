import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const CancellationPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
        <div>
          <span className="text-xs uppercase font-bold text-turf tracking-wider block mb-1">
            Fair Play & Transparency
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            TurfBook Cancellation & Refund Policy
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last updated: October 2026. Designed to balance flexibility for players and predictability
            for turf owners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Full Refund Window</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Customers can cancel any confirmed booking up to <strong>2 hours</strong> before the
              scheduled match start time. The payment status is immediately updated to{' '}
              <span className="font-semibold text-emerald-800">REFUNDED</span> and the time slot is
              atomically released for other players.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Late Cancellation Policy</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Cancellations attempted less than 2 hours before the start time are non-refundable to
              compensate the venue for reserved lighting and groundskeeping preparations.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <h3 className="font-bold text-slate-900 text-base">Venue Maintenance & Force Majeure</h3>
          <p>
            If a venue owner cancels a reservation due to unplayable weather, turf repairs, or
            emergency electrical maintenance, a 100% full refund is issued automatically, and the
            player is notified via in-app alerts.
          </p>

          <h3 className="font-bold text-slate-900 text-base">Payment Simulation Notice</h3>
          <p>
            During portfolio demonstration mode, payment transactions use the simulated sandbox
            gateway. Refunds are recorded authoritatively in the PostgreSQL payments database table.
          </p>
        </div>

        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <Link to="/explore" className="text-xs font-bold text-emerald-700 hover:underline">
            ← Return to Explore Turfs
          </Link>
          <span className="text-xs text-slate-400">TurfBook Terms & Integrity</span>
        </div>
      </div>
    </div>
  );
};
