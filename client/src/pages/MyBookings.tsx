import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { Booking } from '../types';
import { formatCurrency, formatDate, formatTime, getStatusColor } from '../lib/utils';
import { RatingStars } from '../components/RatingStars';
import { SportIcon } from '../components/SportIcon';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  X,
  Star,
  CheckCircle2,
  Trash2,
  Compass,
  ShieldCheck,
  Ticket,
  ChevronRight,
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

export const MyBookings: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Cancel Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review Modal State
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Keyboard accessibility: Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cancelModalBooking) setCancelModalBooking(null);
        if (reviewModalBooking) setReviewModalBooking(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelModalBooking, reviewModalBooking]);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => api.get<Booking[]>('/bookings/my'),
  });

  const bookings = bookingsData || [];

  // Filter bookings based on tab
  const filteredBookings = bookings.filter((b) => {
    const isPast = new Date(b.endTime).getTime() <= Date.now();
    if (activeTab === 'UPCOMING') return b.status === 'CONFIRMED' && !isPast;
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && isPast);
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancelModalBooking) return;
      return api.post(`/bookings/${cancelModalBooking.id}/cancel`, {
        reason: cancelReason || 'Player schedule conflict',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['customer-overview'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setCancelModalBooking(null);
      setCancelReason('');
      setCancelError(null);
    },
    onError: (err: ApiError) => {
      setCancelError(err.message || 'Failed to cancel booking. It may be within 2 hours of start time.');
    },
  });

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewModalBooking) return;
      return api.post(`/reviews/booking/${reviewModalBooking.id}`, {
        rating,
        comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setReviewModalBooking(null);
      setComment('');
      setReviewError(null);
    },
    onError: (err: ApiError) => {
      setReviewError(err.message || 'Failed to submit review.');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-[#18231D] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - No eyebrow per Impeccable Craft Floor */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#18231D] tracking-tight">
              My Turf Reservations
            </h1>
            <p className="text-sm text-[#526158] mt-1.5 max-w-xl font-normal leading-relaxed">
              Review your upcoming match slots, cancellation deadlines, and submit verified feedback for completed games.
            </p>
          </div>

          <Link
            to="/explore"
            className="px-5 py-2.5 bg-[#123B2A] hover:bg-[#176443] text-white font-bold text-xs rounded-xl shadow-brand hover:shadow-card-hover transition-all duration-200 flex items-center gap-2 self-start sm:self-auto"
          >
            <Compass className="w-4 h-4 text-[#B9F65A]" />
            <span>Book New Slot</span>
          </Link>
        </div>

        {/* Filter Tabs with Live Counts */}
        <div className="flex items-center gap-2 border-b border-[#DFE6DF] pb-3 mb-8 overflow-x-auto scrollbar-none">
          {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => {
            const count = bookings.filter((b) => {
              const isPast = new Date(b.endTime).getTime() <= Date.now();
              if (tab === 'UPCOMING') return b.status === 'CONFIRMED' && !isPast;
              if (tab === 'COMPLETED') return b.status === 'COMPLETED' || (b.status === 'CONFIRMED' && isPast);
              if (tab === 'CANCELLED') return b.status === 'CANCELLED';
              return true;
            }).length;

            const isCurrent = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-[#123B2A] text-white font-black shadow-brand'
                    : 'text-[#526158] hover:text-[#18231D] hover:bg-[#E2F0DF]/60'
                }`}
              >
                <span>
                  {tab === 'ALL'
                    ? 'All Reservations'
                    : tab === 'UPCOMING'
                    ? 'Upcoming Matches'
                    : tab === 'COMPLETED'
                    ? 'Completed'
                    : 'Cancelled'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums font-bold ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : 'bg-[#DFE6DF] text-[#18231D]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl h-44 animate-pulse border border-[#DFE6DF] shadow-card"
              />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#DFE6DF] shadow-card p-8">
            <div className="w-16 h-16 rounded-2xl bg-[#F0F6EE] border border-[#C5E1BF] flex items-center justify-center mx-auto mb-4 text-[#123B2A]">
              <Ticket className="w-8 h-8 text-[#27864F]" />
            </div>
            <h3 className="text-lg font-bold text-[#18231D] mb-1">
              {activeTab === 'UPCOMING'
                ? 'No upcoming matches scheduled'
                : activeTab === 'COMPLETED'
                ? 'No completed matches yet'
                : activeTab === 'CANCELLED'
                ? 'No cancelled reservations'
                : 'No reservations found'}
            </h3>
            <p className="text-xs text-[#526158] max-w-sm mx-auto mb-6 leading-relaxed">
              Explore premier football turfs, box cricket cages, and basketball courts in your city and book your next game with instant slot locking.
            </p>
            <Link
              to="/explore"
              className="px-6 py-2.5 bg-[#123B2A] hover:bg-[#176443] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-brand transition-all"
            >
              <Compass className="w-4 h-4 text-[#B9F65A]" />
              <span>Discover Turfs</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const isPast = new Date(b.endTime).getTime() <= Date.now();
              const canCancel = b.status === 'CONFIRMED' && !isPast;
              const canReview = (b.status === 'COMPLETED' || isPast) && b.status !== 'CANCELLED' && !b.review;
              const countdown = b.status === 'CONFIRMED' && !isPast ? getMatchCountdown(b.startTime) : null;

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl border border-[#DFE6DF] p-6 sm:p-7 shadow-card hover:shadow-card-hover hover:border-[#27864F]/40 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Ground & Match Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono tabular-nums text-xs font-bold text-[#123B2A] bg-[#F0F6EE] px-2.5 py-1 rounded-lg border border-[#C5E1BF]">
                        #{b.bookingNumber}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>

                      {countdown && (
                        <span className="text-[11px] font-bold text-[#18231D] bg-gradient-booking px-2.5 py-0.5 rounded-full shadow-lime-sm flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#18231D]" />
                          <span>{countdown}</span>
                        </span>
                      )}

                      {canCancel && (
                        <span className="text-[11px] text-[#123B2A] bg-[#E2F0DF] px-2.5 py-0.5 rounded-full font-bold border border-[#C5E1BF] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#27864F]" />
                          <span>100% Refund Window Active</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/venues/${b.ground?.venueId || ''}`}
                          className="font-black text-[#18231D] text-xl hover:text-[#176443] transition-colors flex items-center gap-1.5 group"
                        >
                          <span>{b.ground?.venue?.name}</span>
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#27864F]" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#526158] font-semibold mt-1">
                        <SportIcon sport={b.ground?.sport?.name || ''} className="w-3.5 h-3.5 text-[#27864F]" />
                        <span>
                          {b.ground?.name} • {b.ground?.sport?.name} ({b.ground?.surfaceType})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#526158] pt-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-4 h-4 text-[#27864F] shrink-0" />
                        <span className="font-mono tabular-nums">{formatDate(b.startTime)}</span>
                      </span>

                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-[#27864F] shrink-0" />
                        <span className="font-mono tabular-nums font-bold text-[#18231D]">
                          {formatTime(b.startTime)} — {formatTime(b.endTime)}
                        </span>
                        <span className="text-[11px] text-[#526158]">({b.totalHours} hr)</span>
                      </span>

                      <span className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-4 h-4 text-[#27864F] shrink-0" />
                        <span>
                          {b.ground?.venue?.address}, {b.ground?.venue?.city}
                        </span>
                      </span>
                    </div>

                    {b.cancellationReason && (
                      <div className="text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 inline-block font-medium">
                        Cancellation reason: {b.cancellationReason}
                      </div>
                    )}

                    {b.review && (
                      <div className="flex items-center gap-2 pt-1 text-xs bg-[#F8FAF7] p-2.5 rounded-xl border border-[#DFE6DF]">
                        <span className="text-[#526158] font-semibold">Your rating:</span>
                        <RatingStars rating={b.review.rating} size={14} />
                        <span className="text-[#18231D] italic">"{b.review.comment}"</span>
                      </div>
                    )}
                  </div>

                  {/* Right side Price & Actions */}
                  <div className="flex sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-[#DFE6DF] shrink-0 gap-4">
                    <div className="text-left lg:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#526158] tracking-wider block">
                        Amount Paid
                      </span>
                      <span className="text-2xl font-black text-[#123B2A] font-mono tabular-nums">
                        {formatCurrency(b.totalPrice)}
                      </span>
                      <span className="text-[10px] text-[#27864F] font-bold block">
                        {b.status === 'CANCELLED' ? 'Refund Processed' : 'Payment Settled • Instant Lock'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelModalBooking(b);
                            setCancelReason('');
                            setCancelError(null);
                          }}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel Booking</span>
                        </button>
                      )}

                      {canReview && (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewModalBooking(b);
                            setRating(5);
                            setComment('');
                            setReviewError(null);
                          }}
                          className="px-4 py-2 bg-gradient-booking hover:brightness-105 text-[#18231D] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lime-sm cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-[#18231D] fill-[#18231D]" />
                          <span>Rate & Review</span>
                        </button>
                      )}

                      <Link
                        to={`/booking/confirmed/${b.id}`}
                        className="p-2 text-[#526158] hover:text-[#123B2A] hover:bg-[#F0F6EE] rounded-xl transition-colors border border-transparent hover:border-[#DFE6DF]"
                        title="View Full Ticket Voucher"
                      >
                        <Ticket className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Accessible Cancel Booking Modal */}
        {cancelModalBooking && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-elevated border border-[#DFE6DF]">
              <div className="flex items-center justify-between pb-3 border-b border-[#DFE6DF]">
                <h3 id="cancel-modal-title" className="font-bold text-[#18231D] text-lg">
                  Cancel Match Reservation
                </h3>
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  aria-label="Close dialog"
                  className="text-[#526158] hover:text-[#18231D] p-1.5 rounded-xl hover:bg-[#F0F6EE] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 leading-relaxed space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Cancellation & Refund Notice</span>
                </div>
                <p>
                  Are you sure you want to cancel booking{' '}
                  <strong className="font-mono font-bold text-rose-950">
                    #{cancelModalBooking.bookingNumber}
                  </strong>
                  ? The reserved slot will be atomically released and your payment of{' '}
                  <strong className="font-mono font-bold text-rose-950">
                    {formatCurrency(cancelModalBooking.totalPrice)}
                  </strong>{' '}
                  will be refunded.
                </p>
              </div>

              {cancelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div>
                <label htmlFor="cancel-reason" className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-1.5">
                  Reason for Cancellation
                </label>
                <textarea
                  id="cancel-reason"
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Heavy rain forecast, teammate schedule conflict..."
                  className="w-full text-xs p-3 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-[#18231D] placeholder:text-[#526158]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-[#526158] hover:bg-[#F0F6EE] rounded-xl transition-colors border border-[#DFE6DF] cursor-pointer"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="flex-1 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {cancelMutation.isPending ? 'Processing...' : 'Confirm & Refund'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accessible Review Submission Modal */}
        {reviewModalBooking && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-elevated border border-[#DFE6DF]">
              <div className="flex items-center justify-between pb-3 border-b border-[#DFE6DF]">
                <h3 id="review-modal-title" className="font-bold text-[#18231D] text-lg">
                  Submit Verified Match Review
                </h3>
                <button
                  type="button"
                  onClick={() => setReviewModalBooking(null)}
                  aria-label="Close dialog"
                  className="text-[#526158] hover:text-[#18231D] p-1.5 rounded-xl hover:bg-[#F0F6EE] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-[#526158] font-medium bg-[#F8FAF7] p-3 rounded-xl border border-[#DFE6DF]">
                Reviewing <strong className="text-[#18231D]">{reviewModalBooking.ground?.venue?.name}</strong>{' '}
                ({reviewModalBooking.ground?.name} • {reviewModalBooking.ground?.sport?.name})
              </div>

              {reviewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{reviewError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-2">
                  Your Overall Rating (1 to 5 Stars)
                </label>
                <RatingStars
                  rating={rating}
                  interactive={true}
                  size={28}
                  onRatingChange={(newVal) => setRating(newVal)}
                />
              </div>

              <div>
                <label htmlFor="review-comment" className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-1.5">
                  Your Match Feedback
                </label>
                <textarea
                  id="review-comment"
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the turf grass quality, night floodlight Lux, changing rooms, and staff hospitality?"
                  className="w-full text-xs p-3 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176443] font-medium text-[#18231D] placeholder:text-[#526158]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalBooking(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-[#526158] hover:bg-[#F0F6EE] rounded-xl transition-colors border border-[#DFE6DF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending || !comment.trim()}
                  className="flex-1 py-2.5 text-xs font-bold bg-[#123B2A] hover:bg-[#176443] text-white rounded-xl transition-all shadow-brand disabled:opacity-50 cursor-pointer"
                >
                  {reviewMutation.isPending ? 'Publishing...' : 'Post Verified Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
