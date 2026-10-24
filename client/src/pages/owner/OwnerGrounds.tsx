import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { Ground, Venue, Sport } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { PlusCircle, Layers, ArrowLeft, AlertCircle, Wrench, Trash2 } from 'lucide-react';

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

  // Fetch venue
  const { data: venue } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => api.get<Venue>(`/venues/${venueId}`),
    enabled: !!venueId,
  });

  // Fetch sports
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get<Sport[]>('/sports'),
  });

  React.useEffect(() => {
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
      setShowAddModal(false);
      setName('');
      setDescription('');
      setModalError(null);
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
      setBlockModalGround(null);
      setBlockError(null);
      alert('Maintenance block period scheduled successfully!');
    },
    onError: (err: ApiError) => {
      setBlockError(err.message || 'Failed to schedule maintenance block');
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/owner/venues"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Venues</span>
        </Link>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-turf-bright font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Playable Ground</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <span className="text-xs uppercase font-bold text-emerald-600 tracking-wider">
            Venue Grounds
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {venue?.name} — Playable Pitches & Courts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure individual grounds, surface specs, hourly rates, and schedule maintenance downtime.
          </p>
        </div>

        {venue?.grounds && venue.grounds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venue.grounds.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900">{g.name}</span>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {formatCurrency(g.hourlyRate)}/hr
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mb-2">
                    Surface: <strong className="text-slate-700">{g.surfaceType}</strong>
                    {g.isIndoor && <span className="ml-2 text-blue-600 font-bold">• Indoor</span>}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4">{g.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setBlockModalGround(g);
                      setBlockError(null);
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Block for Maintenance</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-medium">Active & Bookable</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No grounds added yet. Click 'Add Playable Ground' above to create your first pitch!
          </div>
        )}
      </div>

      {/* Add Ground Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-lg">Add Playable Ground</h3>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Ground / Pitch Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 7-a-side Turf (Pitch A)"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Sport
                </label>
                <select
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-medium"
                >
                  {sports?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Surface Type
                  </label>
                  <input
                    type="text"
                    required
                    value={surfaceType}
                    onChange={(e) => setSurfaceType(e.target.value)}
                    placeholder="e.g. Artificial Turf 50mm"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Hourly Rate (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isIndoor"
                  checked={isIndoor}
                  onChange={(e) => setIsIndoor(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <label htmlFor="isIndoor" className="text-xs font-semibold text-slate-700">
                  Indoor / Air-conditioned Court
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dimensions, lighting, goals/nets details..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createGroundMutation.mutate()}
                disabled={createGroundMutation.isPending || !name.trim()}
                className="flex-1 py-2 text-xs font-bold bg-forest-900 hover:bg-forest-800 text-turf-bright rounded-xl shadow-sm"
              >
                {createGroundMutation.isPending ? 'Saving...' : 'Add Ground'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Maintenance Modal */}
      {blockModalGround && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-lg">Schedule Maintenance Block</h3>
            <p className="text-xs text-slate-500">
              Prevent customer bookings on {blockModalGround.name} during routine pitch maintenance.
            </p>

            {blockError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                {blockError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={blockDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Reason for Block
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Net repair, lawn brushing, private club match"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockModalGround(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => blockMutation.mutate()}
                disabled={blockMutation.isPending}
                className="flex-1 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm"
              >
                {blockMutation.isPending ? 'Blocking...' : 'Block Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
