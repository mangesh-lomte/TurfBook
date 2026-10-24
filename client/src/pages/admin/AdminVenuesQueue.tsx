import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { Venue } from '../../types';
import { formatDate } from '../../lib/utils';
import { CheckCircle2, XCircle, Building2, MapPin, Phone, Mail, AlertCircle, X } from 'lucide-react';

export const AdminVenuesQueue: React.FC = () => {
  const queryClient = useQueryClient();

  const [rejectVenueModal, setRejectVenueModal] = useState<Venue | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
      setActionMessage('Venue approved successfully! It is now live on public search.');
      setTimeout(() => setActionMessage(null), 4000);
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
      setActionMessage('Venue submission rejected.');
      setTimeout(() => setActionMessage(null), 4000);
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Venue Approval Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review new venue submissions from owners. Verified venues appear instantly on public search.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-white rounded-3xl animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : pendingVenues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">All Venues Processed!</h3>
          <p className="text-xs text-slate-400 mt-1">
            There are currently no pending turf submissions waiting for review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingVenues.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between"
            >
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-48 h-36 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={v.images?.[0] || 'https://images.unsplash.com/photo-1529900248061-5652ab58877f?w=600'}
                    alt={v.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                      Pending Verification
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Submitted on {formatDate(v.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">{v.name}</h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-turf shrink-0" />
                    <span>{v.address}, {v.city}, {v.state} - {v.postalCode}</span>
                  </div>

                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">{v.description}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Owner: {v.owner?.fullName}</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {v.contactPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {v.contactEmail}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {v.grounds?.map((g) => (
                      <span
                        key={g.id}
                        className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded"
                      >
                        {g.name} ({g.surfaceType})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col items-center justify-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => approveMutation.mutate(v.id)}
                  disabled={approveMutation.isPending}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Venue</span>
                </button>

                <button
                  onClick={() => {
                    setRejectVenueModal(v);
                    setRejectReason('');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectVenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg">Reject Venue Submission</h3>
              <button
                onClick={() => setRejectVenueModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide a reason for rejecting <strong className="text-slate-900">{rejectVenueModal.name}</strong>.
              This feedback will be delivered directly to the owner.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Unclear photos, invalid contact phone number, incomplete amenities..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectVenueModal(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending}
                className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
