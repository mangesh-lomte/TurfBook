import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Venue, Sport } from '../types';
import { formatCurrency } from '../lib/utils';
import { RatingStars } from '../components/RatingStars';
import {
  Search,
  MapPin,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Fetch active sports
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get<Sport[]>('/sports'),
  });

  // Fetch featured approved venues
  const { data: venuesData } = useQuery({
    queryKey: ['venues', 'featured'],
    queryFn: () =>
      api.get<Venue[]>('/venues?limit=4&sortBy=rating&sortOrder=desc'),
  });

  const venues = venuesData || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (selectedCity) params.append('city', selectedCity);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-forest-950 via-forest-900 to-charcoal-900 text-white overflow-hidden pt-20 pb-28">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Slot Confirmation • Zero Double Booking</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none mb-6">
            Book Premier Sports Turfs & Courts in Your City
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Discover FIFA-grade football pitches, floodlit box cricket arenas, and BWF synthetic
            badminton courts with real-time slot availability.
          </p>

          {/* Quick Search Card */}
          <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-lg p-3 sm:p-4 rounded-2xl shadow-2xl border border-white/20">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl w-full">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search turf name, area, or sport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="w-full sm:w-48 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <MapPin className="w-5 h-5 text-turf shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-transparent text-slate-800 text-sm focus:outline-none font-medium"
                >
                  <option value="">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Delhi">Delhi NCR</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-forest-900 hover:bg-forest-800 text-turf-bright font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg"
              >
                <span>Find Slots</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Popular Sports Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            <span className="text-xs text-slate-400 font-semibold mr-2">Popular:</span>
            {sports?.map((sport) => (
              <button
                key={sport.id}
                onClick={() => navigate(`/explore?sport=${sport.slug}`)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span>{sport.icon || '⚽'}</span>
                <span>{sport.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition Highlights */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Instant Slot Reservation</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Real-time hourly slots backed by PostgreSQL atomic transactions to completely prevent double booking.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">100% Verified Venues</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every ground is inspected for surface quality, night floodlights, and player amenities before approval.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Flexible Cancellations</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Cancel eligible bookings up to 2 hours prior to match time with instant refund tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-turf mb-1">
              Top Rated Arenas
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Venues Open Today
            </h2>
          </div>
          <Link
            to="/explore"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group"
          >
            <span>View All Arenas</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              onClick={() => navigate(`/venues/${venue.id}`)}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              {/* Venue Image */}
              <div className="relative h-48 bg-slate-200 overflow-hidden">
                <img
                  src={
                    venue.images?.[0] ||
                    'https://images.unsplash.com/photo-1529900248061-5652ab58877f?w=600'
                  }
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                  <span className="text-amber-500">★</span>
                  <span>{venue.averageRating ? venue.averageRating.toFixed(1) : '5.0'}</span>
                </div>
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                  {venue.sports?.slice(0, 2).map((s) => (
                    <span
                      key={s.id}
                      className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Venue Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1">
                    {venue.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{venue.address}, {venue.city}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {venue.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Starting From
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                      {venue.startingPrice ? formatCurrency(venue.startingPrice) : '₹800'}{' '}
                      <span className="text-xs font-normal text-slate-500">/ hr</span>
                    </span>
                  </div>

                  <button className="px-3 py-1.5 bg-forest-900 text-turf-bright text-xs font-bold rounded-lg group-hover:bg-forest-800 transition-colors">
                    Check Slots
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works steps */}
      <section className="py-16 bg-forest-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-turf mb-2">
            Simple 3-Step Process
          </div>
          <h2 className="text-3xl font-extrabold mb-12">How TurfBook Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-forest-900/60 border border-forest-800 p-8 rounded-2xl relative">
              <div className="w-12 h-12 bg-turf/20 text-turf rounded-2xl flex items-center justify-center font-extrabold text-xl mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">Discover Turf</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Filter by sport, city, surface type, or amenities. View photos, facilities, and genuine player reviews.
              </p>
            </div>

            <div className="bg-forest-900/60 border border-forest-800 p-8 rounded-2xl relative">
              <div className="w-12 h-12 bg-turf/20 text-turf rounded-2xl flex items-center justify-center font-extrabold text-xl mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">Pick Available Slot</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Select your preferred date. Our live slot calendar shows real-time availability with atomic locking.
              </p>
            </div>

            <div className="bg-forest-900/60 border border-forest-800 p-8 rounded-2xl relative">
              <div className="w-12 h-12 bg-turf/20 text-turf rounded-2xl flex items-center justify-center font-extrabold text-xl mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">Instant Play Receipt</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Receive instant confirmation with a unique booking ID. Show up with your squad and play!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
