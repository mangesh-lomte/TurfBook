import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Booking } from '../types';
import { formatCurrency, formatDate, formatTime } from '../lib/utils';
import { SportIcon } from '../components/SportIcon';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Compass,
  Copy,
  Check,
  Download,
  Share2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const getMatchCountdown = (startTime: string) => {
  const diff = new Date(startTime).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 1) return `Kickoff in ${days} days`;
  if (days === 1) return 'Kickoff tomorrow';
  if (hours >= 1) return `Kickoff in ${hours} hr${hours > 1 ? 's' : ''}`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `Kickoff in ${minutes} mins`;
};

export const BookingConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.get<Booking>(`/bookings/${id}`),
    enabled: !!id,
  });

  const handleCopyReference = () => {
    if (!booking) return;
    navigator.clipboard.writeText(`#${booking.bookingNumber}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCalendar = () => {
    if (!booking) return;
    const title = `Match at ${booking.ground?.venue?.name} (${booking.ground?.name})`;
    const location = `${booking.ground?.venue?.address}, ${booking.ground?.venue?.city}`;
    const startIso = new Date(booking.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = new Date(booking.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(
      `TurfBook Reservation #${booking.bookingNumber} for ${booking.ground?.sport?.name}.`
    )}&location=${encodeURIComponent(location)}`;
    window.open(gCalUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-gradient-dashboard px-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-[#DFE6DF] shadow-card">
          <div className="w-12 h-12 border-4 border-[#176443] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-[#18231D]">Retrieving Authoritative Booking Receipt...</p>
          <p className="text-xs text-[#526158] mt-1">Verifying ledger transaction and assigned slot</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-gradient-dashboard px-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-[#DFE6DF] shadow-card">
          <div className="w-14 h-14 bg-[#F0F6EE] text-[#123B2A] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#C5E1BF]">
            <Calendar className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-[#18231D]">Booking Record Not Found</h2>
          <p className="text-xs text-[#526158] mt-1 mb-6">
            We could not retrieve this reservation record. Please check your reservation reference or contact support.
          </p>
          <Link
            to="/explore"
            className="px-6 py-3 bg-[#123B2A] hover:bg-[#176443] text-white text-xs font-black rounded-xl inline-flex items-center gap-2 shadow-brand transition-all"
          >
            <Compass className="w-4 h-4 text-[#B9F65A]" />
            <span>Return to Explore Turfs</span>
          </Link>
        </div>
      </div>
    );
  }

  const countdown = getMatchCountdown(booking.startTime);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${booking.ground?.venue?.name} ${booking.ground?.venue?.address} ${booking.ground?.venue?.city}`
  )}`;

  return (
    <div className="min-h-[85vh] bg-gradient-dashboard py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Main Ticket Container */}
        <div className="bg-white rounded-3xl border border-[#DFE6DF] shadow-elevated overflow-hidden">
          {/* Header Bar */}
          <div className="bg-gradient-brand p-6 sm:p-8 text-white relative">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#B9F65A] shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    You're Ready to Play!
                  </h1>
                  <p className="text-xs text-[#D5E2D8] mt-0.5 font-normal">
                    Slot confirmed with zero double-booking protection.
                  </p>
                </div>
              </div>

              {countdown && (
                <div className="hidden sm:block text-right">
                  <span className="text-[10px] uppercase font-bold text-[#D5E2D8] tracking-wider block">
                    Countdown
                  </span>
                  <span className="inline-block bg-[#07150F]/60 text-[#B9F65A] font-bold text-xs px-2.5 py-1 rounded-full border border-[#B9F65A]/30">
                    {countdown}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Body with Match Details */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Booking Reference Pill Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DFE6DF]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#526158] tracking-wider block">
                  Match Booking Reference
                </span>
                <span className="text-base font-mono tabular-nums font-black text-[#123B2A]">
                  #{booking.bookingNumber}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReference}
                  className="px-3 py-1.5 text-xs font-bold text-[#18231D] bg-[#F0F6EE] hover:bg-[#E2F0DF] border border-[#C5E1BF] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy reference code"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#27864F]" />
                      <span className="text-[#27864F]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#526158]" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleAddToCalendar}
                  className="px-3 py-1.5 text-xs font-bold text-[#18231D] bg-[#F8FAF7] hover:bg-[#F0F6EE] border border-[#DFE6DF] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Add match event to Google Calendar"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#27864F]" />
                  <span>Add to Calendar</span>
                </button>
              </div>
            </div>

            {/* Arena & Ground Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#526158] font-bold uppercase tracking-wider block">
                    Venue & Pitch
                  </span>
                  <h2 className="text-xl font-black text-[#18231D] mt-0.5">
                    {booking.ground?.venue?.name}
                  </h2>
                </div>
                <div className="p-2.5 bg-[#F0F6EE] rounded-2xl border border-[#C5E1BF] text-[#123B2A]">
                  <SportIcon sport={booking.ground?.sport?.name || ''} className="w-6 h-6 text-[#27864F]" />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#123B2A] bg-[#E2F0DF] px-3 py-1 rounded-full border border-[#C5E1BF]">
                <span>{booking.ground?.name}</span>
                <span>•</span>
                <span>{booking.ground?.sport?.name}</span>
                <span>({booking.ground?.surfaceType})</span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#526158] pt-1">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-[#27864F] shrink-0 mt-0.5" />
                  <span>
                    {booking.ground?.venue?.address}, {booking.ground?.venue?.city}
                  </span>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#176443] hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Open Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Perforated Divider Styling */}
            <div className="relative py-2">
              <div className="border-t-2 border-dashed border-[#DFE6DF]" />
              <div className="absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-dashboard border-r border-[#DFE6DF]" />
              <div className="absolute -right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-dashboard border-l border-[#DFE6DF]" />
            </div>

            {/* Time & Date Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-[#F8FAF7] p-4 rounded-2xl border border-[#DFE6DF]">
              <div>
                <span className="text-[#526158] font-bold uppercase text-[10px] tracking-wider block mb-1">
                  Match Date
                </span>
                <div className="flex items-center gap-1.5 font-black text-[#18231D] text-sm">
                  <Calendar className="w-4 h-4 text-[#27864F] shrink-0" />
                  <span className="font-mono tabular-nums">{formatDate(booking.startTime)}</span>
                </div>
              </div>

              <div>
                <span className="text-[#526158] font-bold uppercase text-[10px] tracking-wider block mb-1">
                  Kickoff & Duration
                </span>
                <div className="flex items-center gap-1.5 font-black text-[#18231D] text-sm">
                  <Clock className="w-4 h-4 text-[#27864F] shrink-0" />
                  <span className="font-mono tabular-nums">
                    {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
                  </span>
                  <span className="text-xs font-normal text-[#526158]">({booking.totalHours} hr)</span>
                </div>
              </div>
            </div>

            {/* Settlement Ledger */}
            <div className="flex justify-between items-center pt-2">
              <div>
                <span className="text-xs font-bold uppercase text-[#526158] block tracking-wider">
                  Total Paid (Settled)
                </span>
                <span className="text-[11px] text-[#27864F] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PostgreSQL GiST Lock Verified</span>
                </span>
              </div>
              <span className="text-2xl font-black text-[#123B2A] font-mono tabular-nums">
                {formatCurrency(booking.totalPrice)}
              </span>
            </div>

            {/* Ground Rules & Arrival Guidelines */}
            <div className="p-4 rounded-2xl bg-[#F0F6EE] border border-[#C5E1BF] text-xs space-y-1.5">
              <span className="font-bold text-[#123B2A] block uppercase tracking-wider text-[11px]">
                Ground Rules & Arrival Guidelines
              </span>
              <ul className="text-[#526158] space-y-1 list-disc list-inside font-normal">
                <li>Arrive 15 minutes before kickoff for pitch assignment and kit preparation.</li>
                <li>Molded studs, turf shoes, or non-marking court shoes required based on surface.</li>
                <li>Free cancellation available until 2 hours before scheduled kickoff time.</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="p-6 bg-[#F8FAF7] border-t border-[#DFE6DF] flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/customer/bookings"
              className="w-full sm:flex-1 py-3.5 bg-[#123B2A] hover:bg-[#176443] text-white font-black text-xs rounded-xl transition-all shadow-brand flex items-center justify-center gap-2"
            >
              <span>View All My Bookings</span>
              <ArrowRight className="w-4 h-4 text-[#B9F65A]" />
            </Link>

            <Link
              to="/explore"
              className="w-full sm:w-auto px-6 py-3.5 border border-[#123B2A] hover:bg-white bg-transparent text-[#123B2A] font-black text-xs rounded-xl transition-all shadow-xs text-center"
            >
              Explore More Turfs
            </Link>
          </div>
        </div>

        {/* 100% Refund Reminder Card */}
        <div className="text-center text-xs text-[#526158] flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-[#27864F] shrink-0" />
          <span>Eligible for 100% full refund if cancelled 2+ hours before kickoff in My Bookings</span>
        </div>
      </div>
    </div>
  );
};
