import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { Venue } from '../../types';
import { formatDate } from '../../lib/utils';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { getSportMatchedImage, detectVenueSportKey } from '../../lib/sportsImages';
import {
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  X,
  Layers,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';

export const AdminVenuesQueue: React.FC = () => {
  const queryClient = useQueryClient();

  const [rejectVenueModal, setRejectVenueModal] = useState<Venue | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && rejectVenueModal) {
        setRejectVenueModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rejectVenueModal]);

  const { data: pendingVenuesData, isLoading } = useQuery({
    queryKey: ['admin-pending-venues'],
    queryFn: () => api.get<Venue[]>('/admin/venues/pending'),
  });

  const pendingVenues = pendingVenuesData || [];

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async (venueId: string) => {
      return api.post(`/admin/venues/${venueId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-venues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setActionMessage('Venue approved successfully! It is now published to public search.');
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!rejectVenueModal) return;
      return api.post(`/admin/venues/${rejectVenueModal.id}/reject`, {
        reason: rejectReason || 'Incomplete details or documentation',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-venues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setRejectVenueModal(null);
      setRejectReason('');
      setRejectError(null);
      setActionMessage('Venue submission rejected with feedback sent to owner.');
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: ApiError) => {
      setRejectError(err.message || 'Failed to reject venue');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-charcoal py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-charcoal tracking-tight">
            Venue Approval Queue
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Review new turf venue submissions from owners. Approved venues appear immediately on public discovery and slot search.
          </p>
        </div>

        {actionMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-forest-900 font-bold mb-6 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-forest-900 hover:text-emerald-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-forest-50/60 rounded-3xl animate-pulse border border-turfborder" />
            ))}
          </div>
        ) : pendingVenues.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-turfborder p-8 shadow-card max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-forest-50 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-charcoal mb-1">All Venues Processed!</h2>
            <p className="text-xs text-charcoal-muted leading-relaxed font-medium">
              There are currently zero pending turf submissions awaiting administrator verification.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingVenues.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-3xl border border-turfborder p-6 shadow-card flex flex-col md:flex-row gap-6 justify-between hover:border-emerald-500/40 hover:shadow-elevated transition-all"
              >
                <div className="flex flex-col sm:flex-row gap-5 flex-1">
                  <div className="w-full sm:w-52 h-40 rounded-2xl overflow-hidden bg-[#07150F] shrink-0 border border-turfborder">
                    <ImageWithFallback
                      src={getSportMatchedImage(v)}
                      alt={v.name}
                      sport={detectVenueSportKey(v)}
                      subtleGradient={true}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200">
                        Pending Verification
                      </span>
                      <span className="text-[11px] text-charcoal-muted font-semibold">
                        Submitted on {formatDate(v.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-charcoal">{v.name}</h3>

                    <div className="flex items-center gap-1.5 text-xs text-charcoal-muted">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{v.address}, {v.city}, {v.state} - {v.postalCode}</span>
                    </div>

                    <p className="text-xs text-charcoal-muted max-w-xl leading-relaxed font-normal">
                      {v.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-charcoal-muted">
                      <span className="font-bold text-charcoal">
                        Owner: {v.owner?.fullName}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-charcoal-muted">
                        <Phone className="w-3 h-3 text-emerald-700" />
                        {v.contactPhone}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-charcoal-muted">
                        <Mail className="w-3 h-3 text-emerald-700" />
                        {v.contactEmail}
                      </span>
                    </div>

                    {v.grounds && v.grounds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {v.grounds.map((g) => (
                          <span
                            key={g.id}
                            className="bg-forest-50 text-forest-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100"
                          >
                            {g.name} ({g.surfaceType})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex md:flex-col items-center justify-center gap-2.5 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-turfborder">
                  <button
                    type="button"
                    onClick={() => approveMutation.mutate(v.id)}
                    disabled={approveMutation.isPending}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-brand hover:opacity-95 text-white font-black text-xs rounded-xl shadow-brand transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{approveMutation.isPending ? 'Verifying...' : 'Approve & Publish'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectVenueModal(v);
                      setRejectReason('');
                      setRejectError(null);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-black text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Submission</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Accessible Reject Modal */}
        {rejectVenueModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-elevated border border-turfborder">
              <div className="flex items-center justify-between pb-3 border-b border-turfborder">
                <h3 id="reject-modal-title" className="font-black text-charcoal text-lg">
                  Reject Venue Submission
                </h3>
                <button
                  type="button"
                  onClick={() => setRejectVenueModal(null)}
                  aria-label="Close dialog"
                  className="text-charcoal-muted hover:text-charcoal p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-charcoal-muted leading-relaxed font-normal">
                Provide feedback for <strong className="text-charcoal font-black">{rejectVenueModal.name}</strong>. The owner will be notified to revise their details.
              </p>

              {rejectError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold">
                  {rejectError}
                </div>
              )}

              <div>
                <label htmlFor="reject-reason" className="block text-xs font-black text-charcoal uppercase mb-1">
                  Rejection Reason / Guidance
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Please provide high resolution pitch photos and valid commercial sports address..."
                  className="w-full text-xs p-3 bg-[#F8FAF7] border border-turfborder rounded-xl focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-medium text-charcoal placeholder:text-charcoal-muted/60"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectVenueModal(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-charcoal-muted hover:bg-forest-50/60 rounded-xl transition-colors border border-turfborder"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending}
                  className="flex-1 py-2.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  {rejectMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
