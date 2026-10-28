import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

export const CancellationPolicy: React.FC = () => {
  return (
    <div className="min-h-[85vh] bg-gradient-dashboard py-12 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#DFE6DF] p-8 sm:p-12 shadow-card space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#18231D] tracking-tight">
              TurfBook Cancellation & Refund Policy
            </h1>
            <p className="text-sm text-[#526158] mt-2 max-w-2xl leading-relaxed font-normal">
              Designed to balance flexible match rescheduling for players with reliable operational predictability for venue operators and groundskeepers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#F0F6EE] border border-[#C5E1BF] space-y-3">
              <div className="flex items-center gap-2 text-[#123B2A] font-black text-base">
                <CheckCircle2 className="w-5 h-5 text-[#27864F] shrink-0" />
                <span>Full Refund Window (2+ Hours)</span>
              </div>
              <p className="text-xs text-[#18231D] leading-relaxed font-normal">
                Players can cancel any confirmed match booking up to <strong className="text-[#123B2A] font-black">2 hours before</strong> the scheduled kickoff time. The payment status transitions immediately to <span className="font-extrabold text-[#176443] bg-[#E2F0DF] px-2 py-0.5 rounded-md">REFUNDED</span> and the time slot is automatically released back to public availability.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-black text-base">
                <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Late Cancellation Window (&lt;2 Hours)</span>
              </div>
              <p className="text-xs text-[#18231D] leading-relaxed font-normal">
                Cancellations attempted less than 2 hours before the scheduled kickoff are non-refundable. This protects venue owners from unfillable late vacancies and compensates for reserved floodlight preparations and staff.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-[#18231D] leading-relaxed border-t border-[#DFE6DF] pt-6">
            <h3 className="font-black text-[#18231D] text-base">Venue Maintenance & Force Majeure</h3>
            <p className="text-[#526158] font-normal">
              If an arena operator cancels a session due to unplayable weather conditions, sudden turf repairs, or emergency electrical maintenance, a 100% full refund is credited immediately, and players receive in-app notifications.
            </p>

            <h3 className="font-black text-[#18231D] text-base pt-2">Automated Settlement Ledger</h3>
            <p className="text-[#526158] font-normal">
              All booking transactions, cancellations, and refund records are stored with cryptographic precision in our PostgreSQL database. Refunds appear with corresponding transaction reference numbers in your customer dashboard.
            </p>
          </div>

          <div className="pt-6 border-t border-[#DFE6DF] flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-xs font-black text-[#123B2A] hover:text-[#176443] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Explore Turfs</span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#526158]">
              <ShieldCheck className="w-4 h-4 text-[#27864F]" />
              <span>TurfBook Terms & Player Standards</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
