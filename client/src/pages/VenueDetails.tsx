import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Venue, Ground, AvailabilityResponse, TimeSlot } from '../types';
import { formatCurrency, formatDate, formatTime } from '../lib/utils';
import { RatingStars } from '../components/RatingStars';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { SportIcon } from '../components/SportIcon';
import { getVenuePhotoGallery, detectVenueSportKey } from '../lib/sportsImages';
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
  Zap,
  Car,
  Droplets,
  Coffee,
  Wifi,
  Lock,
  Star,
  Info,
  Check,
} from 'lucide-react';

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getAmenityIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('floodlight') || lower.includes('light')) return <Zap className="w-4 h-4 text-[#27864F]" />;
  if (lower.includes('park')) return <Car className="w-4 h-4 text-[#176443]" />;
  if (lower.includes('shower') || lower.includes('water')) return <Droplets className="w-4 h-4 text-[#176443]" />;
  if (lower.includes('cafe') || lower.includes('food')) return <Coffee className="w-4 h-4 text-amber-700" />;
  if (lower.includes('wifi')) return <Wifi className="w-4 h-4 text-[#176443]" />;
  if (lower.includes('locker') || lower.includes('room')) return <Lock className="w-4 h-4 text-purple-700" />;
  return <CheckCircle2 className="w-4 h-4 text-[#27864F]" />;
};

export const VenueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Selected ground and date for booking
  const [selectedGroundId, setSelectedGroundId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(formatLocalDate(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Fetch venue profile
  const { data: venue, isLoading: isVenueLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => api.get<Venue>(`/venues/${id}`),
    enabled: !!id,
  });

  // Set default ground once venue data arrives
  useEffect(() => {
    if (venue?.grounds && venue.grounds.length > 0 && !selectedGroundId) {
      setSelectedGroundId(venue.grounds[0].id);
    }
  }, [venue, selectedGroundId]);

  // Fetch real-time availability for selected ground & date
  const { data: availability, isLoading: isSlotsLoading } = useQuery({
    queryKey: ['availability', selectedGroundId, selectedDate],
    queryFn: () =>
      api.get<AvailabilityResponse>(
        `/grounds/${selectedGroundId}/availability?date=${selectedDate}`
      ),
    enabled: !!selectedGroundId && !!selectedDate,
  });

  // Generate 7-day quick date picker items
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = formatLocalDate(d);
    const isToday = i === 0;
    const isTomorrow = i === 1;
    const label = isToday
      ? 'Today'
      : isTomorrow
      ? 'Tomorrow'
      : d.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return { dateStr, label, formatted };
  });

  // Mutation to create booking
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot || !selectedGroundId) return;
      return api.post<{ id: string; bookingNumber: string }>('/bookings', {
        groundId: selectedGroundId,
        slotId: selectedSlot.slotId,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: bookingNotes || undefined,
      });
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['availability'] });
        queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
        queryClient.invalidateQueries({ queryKey: ['customer-overview'] });
        navigate(`/booking/confirmed/${data.id}`);
      }
    },
    onError: (err: ApiError) => {
      setErrorMessage(err.message || 'Failed to complete booking. This slot may have just been taken.');
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
      <div className="min-h-screen bg-[#F8FAF7] text-[#18231D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-96 bg-white animate-pulse rounded-3xl mb-8 border border-[#DFE6DF]" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-64 bg-white animate-pulse rounded-2xl border border-[#DFE6DF]" />
            <div className="h-64 bg-white animate-pulse rounded-2xl border border-[#DFE6DF]" />
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#F8FAF7] text-[#18231D] py-20 text-center">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-[#DFE6DF] shadow-card">
          <div className="w-16 h-16 bg-[#F0F6EE] text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-[#18231D]">Venue Not Found</h2>
          <p className="text-xs text-[#526158] mt-2 mb-6">The arena you requested could not be located.</p>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2.5 bg-[#123B2A] hover:bg-[#176443] text-white text-xs font-bold rounded-xl shadow-brand transition-all cursor-pointer"
          >
            Return to Explore
          </button>
        </div>
      </div>
    );
  }

  const activeGround = venue.grounds?.find((g) => g.id === selectedGroundId) || venue.grounds?.[0];
  const images = getVenuePhotoGallery(venue);
  const venueSportKey = detectVenueSportKey(venue);

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#18231D] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Venue Header - Clean layout without kickers */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-[#E2F0DF] border border-[#C5E1BF] text-[#123B2A] text-xs font-bold uppercase tracking-wider shadow-xs">
                  Verified Sports Arena
                </span>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#18231D] bg-white px-3 py-1 rounded-full border border-[#DFE6DF] shadow-xs">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{venue.averageRating ? venue.averageRating.toFixed(1) : '5.0'}</span>
                  <span className="text-[#526158] font-normal">
                    ({venue.reviews?.length || 1} reviews)
                  </span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-[#18231D] tracking-tight">
                {venue.name}
              </h1>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#526158] mt-2">
                <MapPin className="w-4 h-4 text-[#27864F] shrink-0" />
                <span>
                  {venue.address}, {venue.city}, {venue.state} - {venue.postalCode}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-[#18231D] bg-white p-3.5 rounded-2xl border border-[#DFE6DF] shadow-xs self-start md:self-auto">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#27864F]" />
                <span>{venue.contactPhone}</span>
              </div>
              <div className="w-px h-4 bg-[#DFE6DF]" />
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#27864F]" />
                <span>{venue.contactEmail}</span>
              </div>
            </div>
          </div>

          {/* Interactive Photo Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[440px] w-full rounded-3xl overflow-hidden shadow-card bg-[#EDF2EC] border border-[#DFE6DF]">
              <ImageWithFallback
                src={images[activePhotoIndex]}
                alt={`${venue.name} main view`}
                sport={venueSportKey}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-[#18231D] text-xs font-bold px-3 py-1 rounded-full border border-[#DFE6DF] shadow-xs">
                Photo {activePhotoIndex + 1} of {images.length}
              </div>
            </div>

            {/* Thumbnails Row */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activePhotoIndex === idx
                        ? 'border-[#123B2A] ring-2 ring-[#123B2A]/30 scale-95 shadow-xs'
                        : 'border-[#DFE6DF] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <ImageWithFallback
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Grid: Details (Left 2 cols) vs Booking Engine (Right 1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Venue Info, Grounds, Facilities, Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Facility */}
            <section className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFE6DF] shadow-card">
              <h2 className="text-xl font-bold text-[#18231D] mb-3">About the Facility</h2>
              <p className="text-sm text-[#526158] leading-relaxed whitespace-pre-line font-normal">
                {venue.description}
              </p>
            </section>

            {/* Playable Grounds Selector */}
            <section className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFE6DF] shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#18231D]">Select Ground or Pitch</h2>
                  <p className="text-xs text-[#526158] mt-0.5">Pick which court or field to check live slots for</p>
                </div>
                <span className="text-xs font-bold text-[#123B2A] bg-[#E2F0DF] px-3 py-1 rounded-full border border-[#C5E1BF]">
                  {venue.grounds?.length || 0} Pitches Available
                </span>
              </div>

              <div className="space-y-3">
                {venue.grounds?.map((g) => {
                  const isSelected = g.id === (activeGround?.id || selectedGroundId);
                  return (
                    <div
                      key={g.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedGroundId(g.id);
                        setSelectedSlot(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedGroundId(g.id);
                          setSelectedSlot(null);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#123B2A] bg-[#F0F6EE] shadow-card ring-1 ring-[#123B2A]'
                          : 'border-[#DFE6DF] bg-white hover:border-[#27864F]/50 hover:bg-[#F8FAF7]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <SportIcon sport={g.sport?.name || ''} className="w-4 h-4 text-[#27864F]" />
                          <span className="font-bold text-[#18231D] text-base">{g.name}</span>
                          <span className="text-[11px] bg-[#E2F0DF] text-[#123B2A] px-2 py-0.5 rounded-full font-bold border border-[#C5E1BF]">
                            {g.surfaceType}
                          </span>
                          {g.isIndoor && (
                            <span className="text-[11px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded-full font-bold border border-sky-200">
                              Indoor AC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#526158] mt-1 leading-relaxed font-normal">{g.description}</p>
                      </div>

                      <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DFE6DF] flex sm:flex-col justify-between items-center sm:items-end">
                        <div className="text-lg font-black text-[#123B2A] font-mono tabular-nums">
                          {formatCurrency(g.hourlyRate)}
                        </div>
                        <div className="text-[10px] text-[#526158] font-bold uppercase tracking-wider">
                          per hour
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Amenities & Facilities Grid */}
            <section className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFE6DF] shadow-card">
              <h2 className="text-xl font-bold text-[#18231D] mb-4">Player Amenities & Equipment</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {venue.facilities?.map((facilityName, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8FAF7] border border-[#DFE6DF] text-xs font-semibold text-[#18231D]"
                  >
                    <div className="shrink-0">{getAmenityIcon(facilityName)}</div>
                    <span>{facilityName}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Operating Hours Table */}
            <section className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFE6DF] shadow-card">
              <h2 className="text-xl font-bold text-[#18231D] mb-3">Operating Schedule</h2>
              <div className="bg-[#F8FAF7] rounded-2xl border border-[#DFE6DF] overflow-hidden divide-y divide-[#DFE6DF]">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                  (dayName, dayIndex) => {
                    const hour = venue.operatingHours?.find((h) => h.dayOfWeek === dayIndex);
                    return (
                      <div key={dayIndex} className="flex items-center justify-between px-4 py-2.5 text-xs">
                        <span className="font-semibold text-[#526158]">{dayName}</span>
                        <span className="font-bold text-[#18231D] font-mono tabular-nums">
                          {hour?.isOpen ? `${hour.openTime} — ${hour.closeTime}` : 'Closed'}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* Player Reviews */}
            <section className="bg-white p-6 sm:p-7 rounded-3xl border border-[#DFE6DF] shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#18231D]">Verified Player Reviews</h2>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#18231D]">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{venue.averageRating ? venue.averageRating.toFixed(1) : '5.0'} / 5.0</span>
                </div>
              </div>

              {venue.reviews && venue.reviews.length > 0 ? (
                <div className="space-y-3">
                  {venue.reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-2xl bg-[#F8FAF7] border border-[#DFE6DF]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#E2F0DF] border border-[#C5E1BF] text-[#123B2A] flex items-center justify-center font-bold text-xs">
                            {r.customer?.fullName.charAt(0) || 'P'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#18231D] block">
                              {r.customer?.fullName}
                            </span>
                            <span className="text-[10px] text-[#526158] font-mono tabular-nums">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                        </div>
                        <RatingStars rating={r.rating} size={14} />
                      </div>
                      <p className="text-xs text-[#526158] leading-relaxed font-normal">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#526158] py-3">No reviews yet for this venue.</p>
              )}
            </section>
          </div>

          {/* Right Column: Authoritative Slot Engine & Reservation Drawer */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-3xl border border-[#DFE6DF] p-6 shadow-elevated space-y-6">
              <div className="border-b border-[#DFE6DF] pb-4">
                <h3 className="text-xl font-black text-[#18231D]">Pick Match Slot</h3>
                <p className="text-xs text-[#526158] mt-1 font-normal">
                  Live availability locked with PostgreSQL GiST exclusion constraints.
                </p>
              </div>

              {/* Quick 7-Day Date Selector Ribbon */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526158]">
                    Select Match Date
                  </label>
                  <span className="text-[11px] text-[#27864F] font-bold">Quick Dates</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {quickDates.slice(0, 4).map((q) => {
                    const isSelected = selectedDate === q.dateStr;
                    return (
                      <button
                        key={q.dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(q.dateStr);
                          setSelectedSlot(null);
                        }}
                        className={`p-2 rounded-xl text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#123B2A] text-white font-black shadow-brand'
                            : 'bg-[#F8FAF7] border border-[#DFE6DF] text-[#18231D] hover:bg-[#F0F6EE]'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-semibold">{q.label}</div>
                        <div className="text-xs font-bold font-mono tabular-nums">{q.formatted}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Native Date Input Picker */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443]">
                  <Calendar className="w-4 h-4 text-[#27864F] shrink-0" />
                  <input
                    type="date"
                    aria-label="Pick custom booking date"
                    value={selectedDate}
                    min={formatLocalDate(new Date())}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot(null);
                    }}
                    className="w-full bg-transparent text-xs font-bold text-[#18231D] focus:outline-none cursor-pointer font-mono"
                  />
                </div>
              </div>

              {/* Hourly Slot Selector with Visual States */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#526158]">
                    Available Slots
                  </label>
                  <span className="text-[11px] text-[#526158] font-medium">1-Hour Blocks</span>
                </div>

                {/* Slot State Legend */}
                <div className="flex items-center gap-3 text-[10px] text-[#526158] mb-3 pb-2 border-b border-[#DFE6DF]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B9F65A] border border-[#27864F]" />
                    <span>Available</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#123B2A]" />
                    <span>Selected</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <span>Booked</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span>Blocked</span>
                  </span>
                </div>

                {isSlotsLoading ? (
                  <div className="grid grid-cols-3 gap-2 animate-pulse py-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-10 bg-slate-100 rounded-xl" />
                    ))}
                  </div>
                ) : availability?.slots && availability.slots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 scrollbar-none">
                    {availability.slots.map((slot) => {
                      const isSelected = selectedSlot?.slotId === slot.slotId;
                      const isAvailable = slot.isAvailable;

                      return (
                        <button
                          key={slot.slotId}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSlotSelect(slot)}
                          title={
                            isAvailable
                              ? `Click to select ${formatTime(slot.startTime)} (${slot.startTimeFormatted})`
                              : slot.reason || slot.status
                          }
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-[#123B2A] text-white ring-2 ring-[#B9F65A] shadow-brand scale-95 font-black'
                              : isAvailable
                              ? 'bg-[#F0F6EE] text-[#123B2A] border border-[#C5E1BF] hover:bg-[#E2F0DF] hover:border-[#27864F] cursor-pointer'
                              : slot.status === 'BOOKED'
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed line-through opacity-60'
                              : slot.status === 'BLOCKED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span className="block font-bold font-mono tabular-nums">{slot.startTimeFormatted}</span>
                          <span className="block text-[10px] font-normal opacity-75 font-mono tabular-nums">
                            {formatTime(slot.startTime)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Venue has no active operating hours or slots on this date.</span>
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              {selectedSlot && activeGround && (
                <div className="bg-[#F8FAF7] p-4 rounded-2xl border border-[#DFE6DF] space-y-2 text-xs">
                  <div className="flex justify-between text-[#526158]">
                    <span>Selected Pitch</span>
                    <span className="font-bold text-[#18231D]">{activeGround.name}</span>
                  </div>
                  <div className="flex justify-between text-[#526158]">
                    <span>Match Time</span>
                    <span className="font-bold text-[#18231D] font-mono tabular-nums">
                      {formatTime(selectedSlot.startTime)} — {formatTime(selectedSlot.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#526158]">
                    <span>Hourly Pitch Rate</span>
                    <span className="font-bold text-[#18231D] font-mono tabular-nums">
                      {formatCurrency(activeGround.hourlyRate)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#526158]">
                    <span>Floodlights & Facilities</span>
                    <span className="font-bold text-[#27864F]">Included</span>
                  </div>
                  <div className="pt-2 border-t border-[#DFE6DF] flex justify-between text-sm font-black text-[#18231D]">
                    <span>Total Amount</span>
                    <span className="text-[#123B2A] font-mono tabular-nums">
                      {formatCurrency(activeGround.hourlyRate)}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleConfirmBooking}
                disabled={!selectedSlot || bookMutation.isPending}
                className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                  selectedSlot && !bookMutation.isPending
                    ? 'bg-gradient-booking hover:brightness-105 text-[#18231D] shadow-lime-sm cursor-pointer'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                {bookMutation.isPending ? (
                  <span>Securing Slot via PostgreSQL...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#18231D]" />
                    <span>
                      {user ? 'Instant Book & Confirm' : 'Sign In to Reserve Slot'}
                    </span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-[#526158] text-center flex items-center justify-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#27864F]" />
                <span>100% full refund if cancelled 2+ hours before kickoff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
