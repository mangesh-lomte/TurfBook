import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Venue, Sport } from '../types';
import { formatCurrency } from '../lib/utils';
import { Search, MapPin, Filter, ArrowUpDown, Sparkles } from 'lucide-react';

export const ExploreVenues: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch sports
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get<Sport[]>('/sports'),
  });

  // Fetch venues with filters
  const { data: venuesData, isLoading } = useQuery({
    queryKey: ['venues', searchInput, selectedCity, selectedSport, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchInput) params.append('search', searchInput);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedSport) params.append('sport', selectedSport);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '20');

      return api.get<Venue[]>(`/venues?${params.toString()}`);
    },
  });

  const venues = venuesData || [];

  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    if (searchInput) params.append('search', searchInput);
    if (selectedCity) params.append('city', selectedCity);
    if (selectedSport) params.append('sport', selectedSport);
    params.append('sortBy', sortBy);
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedCity('');
    setSelectedSport('');
    setSortBy('createdAt');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Sports Turfs & Arenas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Discover verified playable grounds, check live hourly availability, and reserve your game.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by turf name or area..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="w-full bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <MapPin className="w-4 h-4 text-turf shrink-0" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 focus:outline-none font-medium"
            >
              <option value="">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Gurugram">Gurugram / NCR</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-800 focus:outline-none font-medium"
            >
              <option value="createdAt">Newest First</option>
              <option value="name">Venue Name</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyFilter}
              className="flex-1 py-2 bg-forest-900 hover:bg-forest-800 text-turf-bright text-sm font-bold rounded-xl shadow-sm transition-colors"
            >
              Apply Filter
            </button>
            {(searchInput || selectedCity || selectedSport) && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-sm text-slate-500 hover:text-rose-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Sports Quick Filter Chips */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Sport:
          </span>
          <button
            onClick={() => setSelectedSport('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              selectedSport === ''
                ? 'bg-forest-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sports
          </button>
          {sports?.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.slug)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors ${
                selectedSport === sport.slug
                  ? 'bg-forest-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{sport.icon || '⚽'}</span>
              <span>{sport.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Venues Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Arenas Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            We couldn't find any approved venues matching your current search criteria. Try clearing
            some filters or exploring other sports.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-5 py-2.5 bg-forest-900 text-white text-sm font-semibold rounded-xl hover:bg-forest-800 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              onClick={() => navigate(`/venues/${venue.id}`)}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative h-52 bg-slate-200 overflow-hidden">
                <img
                  src={
                    venue.images?.[0] ||
                    'https://images.unsplash.com/photo-1529900248061-5652ab58877f?w=600'
                  }
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                  <span className="text-amber-500">★</span>
                  <span>{venue.averageRating ? venue.averageRating.toFixed(1) : '5.0'}</span>
                  <span className="text-[10px] text-slate-400">({venue.totalReviews || 1})</span>
                </div>

                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                  {venue.sports?.map((s) => (
                    <span
                      key={s.id}
                      className="bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-emerald-700 transition-colors line-clamp-1 mb-1">
                    {venue.name}
                  </h3>

                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{venue.address}, {venue.city}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {venue.description}
                  </p>

                  {/* Facilities Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {venue.facilities?.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded"
                      >
                        {f}
                      </span>
                    ))}
                    {venue.facilities && venue.facilities.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{venue.facilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Starting Price
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {venue.startingPrice ? formatCurrency(venue.startingPrice) : '₹800'}{' '}
                      <span className="text-xs font-normal text-slate-500">/ hr</span>
                    </span>
                  </div>

                  <button className="px-4 py-2 bg-forest-900 text-turf-bright text-xs font-bold rounded-xl group-hover:bg-forest-800 transition-colors shadow-sm">
                    View & Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
