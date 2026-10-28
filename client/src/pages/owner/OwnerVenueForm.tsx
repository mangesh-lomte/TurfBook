import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { Sport } from '../../types';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

const COMMON_FACILITIES = [
  'Floodlights',
  'Changing Rooms',
  'Showers',
  'Cafeteria',
  'Ample Parking',
  'First Aid',
  'Drinking Water',
  'Locker Rooms',
  'WiFi',
  'Pro Equipment Rental',
  'Spectator Seating',
];

export const OwnerVenueForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('400053');
  const [contactPhone, setContactPhone] = useState('+91 ');
  const [contactEmail, setContactEmail] = useState('');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80'
  );
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    'Floodlights',
    'Changing Rooms',
    'Ample Parking',
  ]);
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch available sports
  const { data: sports, isLoading: isSportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get<Sport[]>('/sports'),
  });

  // Pre-select first sport once loaded
  React.useEffect(() => {
    if (sports && sports.length > 0 && selectedSportIds.length === 0) {
      setSelectedSportIds([sports[0].id]);
    }
  }, [sports, selectedSportIds]);

  const toggleFacility = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(selectedFacilities.filter((f) => f !== facility));
    } else {
      setSelectedFacilities([...selectedFacilities, facility]);
    }
  };

  const toggleSport = (sportId: string) => {
    if (selectedSportIds.includes(sportId)) {
      if (selectedSportIds.length > 1) {
        setSelectedSportIds(selectedSportIds.filter((id) => id !== sportId));
      }
    } else {
      setSelectedSportIds([...selectedSportIds, sportId]);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/venues', {
        name,
        description,
        address,
        city,
        state,
        postalCode,
        contactPhone,
        contactEmail,
        images: [imageUrl],
        facilities: selectedFacilities,
        sportIds: selectedSportIds,
      });
    },
    onSuccess: (venue: any) => {
      queryClient.invalidateQueries({ queryKey: ['owner-venues'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      navigate(`/owner/venues/${venue.id}/grounds`);
    },
    onError: (err: ApiError) => {
      setError(err.message || 'Failed to register venue. Please check required fields.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-dashboard text-charcoal py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/owner/venues"
            className="text-xs font-black text-forest-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-700" />
            <span>Back to My Venues</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-turfborder p-6 sm:p-10 shadow-elevated">
          <div className="mb-8 pb-5 border-b border-turfborder">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
                Register Sports Arena
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-black text-forest-900 tracking-wider bg-forest-50 px-3 py-1 rounded-full border border-emerald-200">
                  Step 1 of 2
                </span>
                <span className="text-xs text-charcoal-muted font-bold">• Next: Pitches & Rates</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-charcoal-muted mt-2">
              Fill in facility details, supported sports, and amenities. Once submitted, configure your individual turf pitches.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="venue-name" className="block text-xs font-black uppercase tracking-wider text-charcoal mb-1.5">
                Arena Name <span className="text-emerald-700">*</span>
              </label>
              <input
                id="venue-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Greenfield Sports Arena"
                className="w-full text-sm p-3.5 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="venue-desc" className="block text-xs font-black uppercase tracking-wider text-charcoal mb-1.5">
                Description & Highlights <span className="text-emerald-700">*</span>
              </label>
              <textarea
                id="venue-desc"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe turf surface grass type, night lighting specs, parking capacity, tournament hosting..."
                className="w-full text-sm p-3.5 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
              />
            </div>

            {/* Location fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="venue-address" className="block text-xs font-black uppercase tracking-wider text-charcoal mb-1.5">
                  Street Address <span className="text-emerald-700">*</span>
                </label>
                <input
                  id="venue-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot 42, Link Road, Andheri West"
                  className="w-full text-sm p-3.5 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="venue-city" className="block text-xs font-black uppercase tracking-wider text-charcoal mb-1.5">
                  City <span className="text-emerald-700">*</span>
                </label>
                <select
                  id="venue-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-sm p-3.5 bg-[#F8FAF7] border border-turfborder rounded-xl font-bold text-charcoal cursor-pointer focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Gurugram">Gurugram / Delhi NCR</option>
                </select>
              </div>

              <div>
                <label htmlFor="venue-postal" className="block text-xs font-black uppercase tracking-wider text-charcoal mb-1.5">
                  Postal Code <span className="text-emerald-700">*</span>
                </label>
                <input
                  id="venue-postal"
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="400053"
                  className="w-full text-sm p-3.5 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="venue-phone" className="block text-xs font-black uppercase tracking-wider text-charcoal mb-1.5">
                  Contact Phone <span className="text-emerald-700">*</span>
                </label>
                <input
                  id="venue-phone"
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 9820011223"
                  className="w-full text-sm p-3.5 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>

              <div>
                <label htmlFor="venue-email" className="block text-xs font-black uppercase tracking-wider text-charcoal mb-1.5">
                  Contact Email <span className="text-emerald-700">*</span>
                </label>
                <input
                  id="venue-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@arenasports.in"
                  className="w-full text-sm p-3.5 bg-[#F8FAF7] border border-turfborder rounded-xl font-medium text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>
            </div>

            {/* Supported Sports Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-charcoal mb-2">
                Supported Sports Categories <span className="text-emerald-700">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {sports?.map((s) => {
                  const isSelected = selectedSportIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSport(s.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-gradient-brand text-white border-forest-900 shadow-brand font-black'
                          : 'bg-white text-charcoal-muted border-turfborder hover:bg-forest-50/50'
                      }`}
                    >
                      <span>{s.icon || '⚽'}</span>
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo URL with Live Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="venue-image" className="block text-xs font-black uppercase tracking-wider text-charcoal">
                  Primary Venue Photo URL
                </label>
                <span className="text-[11px] text-[#27864F] font-bold">1-Click Sport Presets</span>
              </div>

              {/* Quick Sport Photo Presets */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setImageUrl('https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F0F6EE] border border-[#C5E1BF] text-[#123B2A] hover:bg-[#E2F0DF] transition-colors cursor-pointer"
                >
                  Football Turf
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F0F6EE] border border-[#C5E1BF] text-[#123B2A] hover:bg-[#E2F0DF] transition-colors cursor-pointer"
                >
                  Box Cricket
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl('https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F0F6EE] border border-[#C5E1BF] text-[#123B2A] hover:bg-[#E2F0DF] transition-colors cursor-pointer"
                >
                  Basketball Court
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F0F6EE] border border-[#C5E1BF] text-[#123B2A] hover:bg-[#E2F0DF] transition-colors cursor-pointer"
                >
                  Badminton
                </button>
                <button
                  type="button"
                  onClick={() => setImageUrl('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F0F6EE] border border-[#C5E1BF] text-[#123B2A] hover:bg-[#E2F0DF] transition-colors cursor-pointer"
                >
                  Tennis
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <input
                  id="venue-image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 w-full text-xs p-3.5 bg-[#F8FAF7] border border-turfborder rounded-xl font-mono text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-[#07150F] shrink-0 border border-turfborder shadow-xs">
                  <ImageWithFallback
                    src={imageUrl}
                    alt="Live preview"
                    subtleGradient={true}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Amenities & Facilities Checkboxes */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-charcoal mb-2">
                Player Amenities & Facilities
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_FACILITIES.map((facility) => {
                  const isChecked = selectedFacilities.includes(facility);
                  return (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacility(facility)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border flex items-center gap-2 ${
                        isChecked
                          ? 'bg-forest-50 text-forest-900 border-emerald-300 shadow-xs'
                          : 'bg-[#F8FAF7] text-charcoal-muted border-turfborder hover:bg-forest-50/40'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${isChecked ? 'text-emerald-700' : 'text-charcoal-muted/40'}`}
                      />
                      <span className="truncate">{facility}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-turfborder flex items-center justify-end gap-3">
              <Link
                to="/owner/venues"
                className="px-5 py-3 text-xs font-black text-charcoal-muted hover:text-charcoal rounded-xl transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createMutation.isPending || !name.trim() || !address.trim()}
                className="px-7 py-3 bg-gradient-brand hover:opacity-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-brand transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span>{createMutation.isPending ? 'Registering Venue...' : 'Proceed to Add Grounds'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
