import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { Ground, Venue, Sport } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { SportIcon } from '../../components/SportIcon';
import {
  PlusCircle,
  Layers,
  ArrowLeft,
  AlertCircle,
  Wrench,
  CheckCircle2,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

export const OwnerGrounds: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const queryClient = useQueryClient();

  // Add ground state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [sportId, setSportId] = useState('');
  const [surfaceType, setSurfaceType] = useState('FIFA 2-Star Artificial Turf');
  const [hourlyRate, setHourlyRate] = useState<number>(1200);
  const [isIndoor, setIsIndoor] = useState(false);
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Maintenance block state
  const [blockModalGround, setBlockModalGround] = useState<Ground | null>(null);
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockStartTime, setBlockStartTime] = useState('08:00');
  const [blockEndTime, setBlockEndTime] = useState('11:00');
  const [blockReason, setBlockReason] = useState('Turf brushing & floodlight maintenance');
  const [blockError, setBlockError] = useState<string | null>(null);

  // In-app success toast message
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setBlockModalGround(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch venue
  const { data: venue, isLoading: isVenueLoading } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => api.get<Venue>(`/venues/${venueId}`),
    enabled: !!venueId,
  });

  // Fetch sports
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get<Sport[]>('/sports'),
  });

  useEffect(() => {
    if (sports && sports.length > 0 && !sportId) {
      setSportId(sports[0].id);
    }
  }, [sports, sportId]);

  // Create Ground Mutation
  const createGroundMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/venues/${venueId}/grounds`, {
        name,
        sportId,
        surfaceType,
        hourlyRate: Number(hourlyRate),
        isIndoor,
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
      queryClient.invalidateQueries({ queryKey: ['owner-venues'] });
      setShowAddModal(false);
      setName('');
      setDescription('');
      setModalError(null);
      setSuccessBanner(`Pitch "${name}" added successfully!`);
      setTimeout(() => setSuccessBanner(null), 4000);
    },
    onError: (err: ApiError) => {
      setModalError(err.message || 'Failed to create ground');
    },
  });

  // Create Block Period Mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!blockModalGround) return;
      const startIso = new Date(`${blockDate}T${blockStartTime}:00Z`).toISOString();
      const endIso = new Date(`${blockDate}T${blockEndTime}:00Z`).toISOString();

      return api.post(`/grounds/${blockModalGround.id}/blocked-periods`, {
        startTime: startIso,
        endTime: endIso,
        reason: blockReason,
      });
    },
    onSuccess: () => {
      const groundName = blockModalGround?.name;
      setBlockModalGround(null);
      setBlockError(null);
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      setSuccessBanner(`Maintenance block scheduled for ${groundName}. Slots will be blocked from customer booking.`);
      setTimeout(() => setSuccessBanner(null), 5000);
    },
    onError: (err: ApiError) => {
      setBlockError(err.message || 'Failed to schedule maintenance block');
    },
  });

  const applyPresetTime = (start: string, end: string, reason: string) => {
    setBlockStartTime(start);
    setBlockEndTime(end);
    setBlockReason(reason);
  };

  return (
    <div className="min-h-screen bg-gradient-dashboard text-charcoal py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/owner/venues"
            className="text-xs font-black text-forest-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-700" />
            <span>Back to My Venues</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-gradient-booking hover:opacity-95 text-charcoal font-black text-xs rounded-xl shadow-lime-sm transition-all flex items-center gap-1.5 self-start sm:self-auto border border-emerald-300"
          >
            <PlusCircle className="w-4 h-4 text-charcoal" />
            <span>Add Playable Ground</span>
          </button>
        </div>

        {/* Success Notification Banner */}
        {successBanner && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-forest-900 font-bold mb-6 flex items-center justify-between gap-2 shadow-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="text-forest-900 hover:text-emerald-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-turfborder p-6 sm:p-8 shadow-card mb-8">
          <div className="mb-6 pb-4 border-b border-turfborder">
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight mt-1">
              {venue?.name} — Playable Pitches & Courts
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
              Configure individual grounds, surface specs, hourly rates, and schedule maintenance downtime.
            </p>
          </div>

          {isVenueLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-44 bg-forest-50/60 rounded-2xl animate-pulse border border-turfborder" />
              <div className="h-44 bg-forest-50/60 rounded-2xl animate-pulse border border-turfborder" />
            </div>
          ) : venue?.grounds && venue.grounds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venue.grounds.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl venue-card-surface border border-turfborder flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-card transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <SportIcon sport={g.sport?.name || ''} className="w-4 h-4 text-[#27864F]" />
                        <span className="text-base font-black text-charcoal">{g.name}</span>
                      </div>
                      <span className="text-xs font-black text-forest-900 bg-white px-3 py-1 rounded-full border border-turfborder shadow-xs">
                        {formatCurrency(g.hourlyRate)}/hr
                      </span>
                    </div>

                    <div className="text-xs text-charcoal-muted mb-2 font-medium">
                      Surface: <strong className="text-charcoal font-black">{g.surfaceType}</strong>
                      {g.isIndoor && (
                        <span className="ml-2 text-sky-800 bg-sky-50 px-2 py-0.5 rounded font-black border border-sky-200">
                          Indoor
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-charcoal-muted line-clamp-2 mb-4 leading-relaxed font-normal">
                      {g.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-turfborder flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBlockModalGround(g);
                        setBlockError(null);
                      }}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-700" />
                      <span>Block Maintenance</span>
                    </button>
                    <span className="text-[11px] text-emerald-800 font-black flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Active & Bookable</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-charcoal-muted text-xs">
              <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-800 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                <Layers className="w-7 h-7" />
              </div>
              <p className="font-black text-charcoal text-base">No grounds added yet</p>
              <p className="text-charcoal-muted mt-1 mb-4">Click 'Add Playable Ground' above to configure your first turf pitch or court.</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 bg-gradient-booking hover:opacity-95 text-charcoal font-black rounded-xl shadow-lime-sm transition-all border border-emerald-300"
              >
                Add Ground Now
              </button>
            </div>
          )}
        </div>

        {/* Accessible Add Ground Modal */}
        {showAddModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-ground-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          >
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-elevated border border-turfborder">
              <div className="flex items-center justify-between pb-3 border-b border-turfborder">
                <h3 id="add-ground-title" className="font-black text-charcoal text-lg">
                  Add Playable Ground
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close dialog"
                  className="text-charcoal-muted hover:text-charcoal p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-bold">{modalError}</span>
                </div>
              )}

              <div className="space-y-3 text-left">
                <div>
                  <label htmlFor="ground-name" className="block text-xs font-black uppercase text-charcoal mb-1">
                    Ground / Pitch Name
                  </label>
                  <input
                    id="ground-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 7-a-side Football Turf (Pitch A)"
                    className="w-full text-xs p-3 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                <div>
                  <label htmlFor="ground-sport" className="block text-xs font-black uppercase text-charcoal mb-1">
                    Sport
                  </label>
                  <select
                    id="ground-sport"
                    value={sportId}
                    onChange={(e) => setSportId(e.target.value)}
                    className="w-full text-xs p-3 bg-[#F8FAF7] border border-turfborder rounded-xl font-bold text-charcoal cursor-pointer focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  >
                    {sports?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ground-surface" className="block text-xs font-black uppercase text-charcoal mb-1">
                      Surface Type
                    </label>
                    <input
                      id="ground-surface"
                      type="text"
                      required
                      value={surfaceType}
                      onChange={(e) => setSurfaceType(e.target.value)}
                      placeholder="e.g. Artificial Turf 50mm"
                      className="w-full text-xs p-3 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="ground-rate" className="block text-xs font-black uppercase text-charcoal mb-1">
                      Hourly Rate (₹)
                    </label>
                    <input
                      id="ground-rate"
                      type="number"
                      required
                      min={100}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full text-xs p-3 bg-[#F8FAF7] border border-turfborder rounded-xl font-black text-forest-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isIndoor"
                    checked={isIndoor}
                    onChange={(e) => setIsIndoor(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600 border-turfborder cursor-pointer"
                  />
                  <label htmlFor="isIndoor" className="text-xs font-bold text-charcoal cursor-pointer">
                    Indoor / Air-conditioned Court
                  </label>
                </div>

                <div>
                  <label htmlFor="ground-desc" className="block text-xs font-black uppercase text-charcoal mb-1">
                    Description & Specs
                  </label>
                  <textarea
                    id="ground-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Dimensions, lighting quality, goal posts or nets specifications..."
                    className="w-full text-xs p-3 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-charcoal-muted hover:bg-forest-50/60 rounded-xl transition-colors border border-turfborder"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => createGroundMutation.mutate()}
                  disabled={createGroundMutation.isPending || !name.trim()}
                  className="flex-1 py-2.5 text-xs font-black bg-gradient-brand hover:opacity-95 text-white rounded-xl shadow-brand transition-all disabled:opacity-50"
                >
                  {createGroundMutation.isPending ? 'Saving...' : 'Add Ground'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accessible Block Maintenance Modal */}
        {blockModalGround && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-maintenance-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          >
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-elevated border border-turfborder">
              <div className="flex items-center justify-between pb-3 border-b border-turfborder">
                <h3 id="block-maintenance-title" className="font-black text-charcoal text-lg">
                  Schedule Maintenance Block
                </h3>
                <button
                  type="button"
                  onClick={() => setBlockModalGround(null)}
                  aria-label="Close dialog"
                  className="text-charcoal-muted hover:text-charcoal p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-charcoal-muted leading-relaxed font-normal">
                Prevent customer bookings on <strong className="text-forest-900 font-black">{blockModalGround.name}</strong> during routine groundskeeping or repairs.
              </p>

              {blockError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="font-bold">{blockError}</span>
                </div>
              )}

              {/* Quick Presets */}
              <div>
                <span className="block text-[11px] font-black text-charcoal-muted uppercase mb-2">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPresetTime('06:00', '09:00', 'Early morning turf lawn brushing & watering')}
                    className="px-2.5 py-1 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-900 text-[11px] font-bold border border-emerald-200 transition-colors"
                  >
                    Morning (6am - 9am)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTime('12:00', '15:00', 'Afternoon floodlight & net maintenance')}
                    className="px-2.5 py-1 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-900 text-[11px] font-bold border border-emerald-200 transition-colors"
                  >
                    Afternoon (12pm - 3pm)
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <label htmlFor="block-date" className="block text-xs font-black text-charcoal uppercase mb-1">
                    Date
                  </label>
                  <input
                    id="block-date"
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#F8FAF7] border border-turfborder rounded-xl text-charcoal font-bold focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="block-start" className="block text-xs font-black text-charcoal uppercase mb-1">
                      Start Time
                    </label>
                    <input
                      id="block-start"
                      type="time"
                      value={blockStartTime}
                      onChange={(e) => setBlockStartTime(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#F8FAF7] border border-turfborder rounded-xl text-charcoal font-bold focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="block-end" className="block text-xs font-black text-charcoal uppercase mb-1">
                      End Time
                    </label>
                    <input
                      id="block-end"
                      type="time"
                      value={blockEndTime}
                      onChange={(e) => setBlockEndTime(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#F8FAF7] border border-turfborder rounded-xl text-charcoal font-bold focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="block-reason" className="block text-xs font-black text-charcoal uppercase mb-1">
                    Reason
                  </label>
                  <input
                    id="block-reason"
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full text-xs p-2.5 bg-[#F8FAF7] border border-turfborder rounded-xl text-charcoal font-medium focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockModalGround(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-charcoal-muted hover:bg-forest-50/60 rounded-xl transition-colors border border-turfborder"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => blockMutation.mutate()}
                  disabled={blockMutation.isPending}
                  className="flex-1 py-2.5 text-xs font-black bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors shadow-xs"
                >
                  {blockMutation.isPending ? 'Scheduling...' : 'Confirm Block'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
