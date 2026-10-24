import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Venue, Ground, AvailabilityResponse, TimeSlot } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { RatingStars } from '../components/RatingStars';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const VenueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Selected ground and date for booking
  const [selectedGroundId, setSelectedGroundId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch venue profile
  const { data: venue, isLoading: isVenueLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => api.get<Venue>(`/venues/${id}`),
    enabled: !!id,
  });

  // Set default ground once venue data arrives
  React.useEffect(() => {
    if (venue?.grounds && venue.grounds.length > 0 && !selectedGroundId) {
      setSelectedGroundId(venue.grounds[0].id);
    }
  }, [venue, selectedGroundId]);

  // Fetch real-time availability for selected ground & date
  const { data: availability, isLoading: isSlotsLoading, refetch: refetchAvailability } = useQuery({
    queryKey: ['availability', selectedGroundId, selectedDate],
    queryFn: () =>
      api.get<AvailabilityResponse>(
        `/grounds/${selectedGroundId}/availability?date=${selectedDate}`
      ),
    enabled: !!selectedGroundId && !!selectedDate,
  });

  // Mutation to create booking
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot || !selectedGroundId) return;
      return api.post<{ id: string; bookingNumber: string }>('/bookings', {
        groundId: selectedGroundId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: bookingNotes || undefined,
      });
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['availability'] });
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        navigate(`/booking/confirmed/${data.id}`);
      }
    },
    onError: (err: ApiError) => {
      setErrorMessage(err.message || 'Failed to complete booking. Please try another slot.');
    },
  });

  const handleSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable) return;
    setErrorMessage(null);
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setErrorMessage(null);
    bookMutation.mutate();
  };

  if (isVenueLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-96 bg-slate-200 animate-pulse rounded-3xl mb-8" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Venue Not Found</h2>
      </div>
    );
  }

  const activeGround = venue.grounds?.find((g) => g.id === selectedGroundId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Venue Header & Photos */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                Verified Turf
              </span>
              <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                <span className="text-amber-500">★</span>
                <span>{venue.averageRating ? venue.averageRating.toFixed(1) : '5.0'}</span>
                <span className="text-slate-400 font-normal">
                  ({venue.reviews?.length || 1} reviews)
                </span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {venue.name}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
              <MapPin className="w-4 h-4 text-turf shrink-0" />
              <span>{venue.address}, {venue.city}, {venue.state} - {venue.postalCode}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{venue.contactPhone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{venue.contactEmail}</span>
            </div>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[380px] rounded-3xl overflow-hidden shadow-sm">
          <div className="md:col-span-2 h-full">
            <img
              src={venue.images?.[0] || 'https://images.unsplash.com/photo-1529900248061-5652ab58877f?w=1200'}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-rows-2 gap-4 h-full hidden md:grid">
            <img
              src={venue.images?.[1] || 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600'}
              alt="Turf angle"
              className="w-full h-full object-cover"
            />
            <img
              src={venue.images?.[2] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600'}
              alt="Turf facility"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details vs Right Booking Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Venue Info, Grounds, Facilities, Reviews */}
        <div className="lg:col-span-2 space-y-10">
          {/* About */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">About the Facility</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {venue.description}
            </p>
          </div>

          {/* Amenities & Facilities */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Amenities & Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {venue.facilities?.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Playable Grounds Selector */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Playable Grounds & Pitches</h2>
            <div className="space-y-3">
              {venue.grounds?.map((g) => {
                const isSelected = g.id === selectedGroundId;
                return (
                  <div
                    key={g.id}
                    onClick={() => {
                      setSelectedGroundId(g.id);
                      setSelectedSlot(null);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{g.name}</span>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {g.surfaceType}
                        </span>
                        {g.isIndoor && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            Indoor AC
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{g.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-slate-900">
                        {formatCurrency(g.hourlyRate)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">per hour</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operating Hours Table */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Operating Hours</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                (dayName, dayIndex) => {
                  const hour = venue.operatingHours?.find((h) => h.dayOfWeek === dayIndex);
                  return (
                    <div key={dayIndex} className="flex items-center justify-between px-4 py-2.5 text-xs">
                      <span className="font-medium text-slate-700">{dayName}</span>
                      <span className="font-semibold text-slate-900">
                        {hour?.isOpen ? `${hour.openTime} — ${hour.closeTime}` : 'Closed'}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Customer Reviews */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Player Reviews</h2>
            {venue.reviews && venue.reviews.length > 0 ? (
              <div className="space-y-4">
                {venue.reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-forest-900 text-turf flex items-center justify-center font-bold text-xs">
                          {r.customer?.fullName.charAt(0) || 'P'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {r.customer?.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(r.createdAt)}
                          </span>
                        </div>
                      </div>
                      <RatingStars rating={r.rating} size={14} />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No reviews yet for this venue.</p>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-3xl border border-slate-200 p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="text-xs uppercase font-bold text-turf tracking-wider mb-1">
                Authoritative Reservation
              </div>
              <h3 className="text-xl font-black text-slate-900">Select Date & Time</h3>
              <p className="text-xs text-slate-500 mt-1">
                Protected by PostgreSQL atomic exclusion constraint.
              </p>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Booking Date
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <Calendar className="w-4 h-4 text-turf shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Hourly Slot Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Available Slots
                </label>
                <span className="text-[11px] text-slate-400 font-medium">1 Hour Matches</span>
              </div>

              {isSlotsLoading ? (
                <div className="grid grid-cols-3 gap-2 animate-pulse">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 bg-slate-100 rounded-lg" />
                  ))}
                </div>
              ) : availability?.slots && availability.slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                  {availability.slots.map((slot) => {
                    const isSelected = selectedSlot?.slotId === slot.slotId;
                    const isAvailable = slot.isAvailable;

                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSlotSelect(slot)}
                        title={slot.reason || slot.status}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-forest-900 text-turf-bright ring-2 ring-emerald-500 shadow-md scale-95'
                            : isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : slot.status === 'BOOKED'
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through'
                            : slot.status === 'BLOCKED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                            : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {slot.startTimeFormatted}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  Venue is closed or no slots available on this date.
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            {selectedSlot && activeGround && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Selected Time</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSlot.startTimeFormatted} — {selectedSlot.endTimeFormatted}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hourly Ground Rate</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(activeGround.hourlyRate)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee & Tax</span>
                  <span className="font-semibold text-emerald-600">Included</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Due</span>
                  <span>{formatCurrency(activeGround.hourlyRate)}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirmBooking}
              disabled={!selectedSlot || bookMutation.isPending}
              className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                selectedSlot && !bookMutation.isPending
                  ? 'bg-forest-900 hover:bg-forest-800 text-turf-bright hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {bookMutation.isPending ? (
                <span>Securing Slot...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {user ? 'Instant Book & Confirm' : 'Sign in to Reserve Slot'}
                  </span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Free cancellation up to 2 hours before start</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
