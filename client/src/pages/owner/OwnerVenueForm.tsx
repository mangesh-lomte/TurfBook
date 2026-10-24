import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { Sport } from '../../types';
import { Building2, MapPin, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

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
    'https://images.unsplash.com/photo-1529900248061-5652ab58877f?w=800'
  );
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([
    'Floodlights',
    'Changing Rooms',
    'Ample Parking',
  ]);
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch available sports
  const { data: sports } = useQuery({
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
      setError(err.message || 'Failed to register venue');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <span className="text-xs uppercase font-bold text-emerald-600 tracking-wider">
            Step 1 of 2
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Register Sports Venue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fill in facility details. Next, you'll configure playable grounds and hourly rates.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Venue Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Greenfield Sports Arena"
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Description & Highlights
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe surface quality, turf grass specs, parking capacity..."
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot 42, Link Road, Andheri West"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                City
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Maharashtra"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="400053"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 9820011223"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="arena@greenfield.com"
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Sports Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Sports Catered (Select at least one)
            </label>
            <div className="flex flex-wrap gap-2">
              {sports?.map((s) => {
                const isSelected = selectedSportIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSport(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-forest-900 text-turf-bright border-forest-900 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s.icon} {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Facilities Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Available Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_FACILITIES.map((f) => {
                const isSelected = selectedFacilities.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFacility(f)}
                    className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{f}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/owner/venues')}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-3 bg-forest-900 hover:bg-forest-800 text-turf-bright font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              {createMutation.isPending ? 'Registering...' : 'Save & Configure Grounds →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
