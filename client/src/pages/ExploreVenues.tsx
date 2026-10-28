import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Venue, Sport } from '../types';
import { VenueCard } from '../components/VenueCard';
import { SportIcon } from '../components/SportIcon';
import { Search, MapPin, ArrowUpDown, Filter, RotateCcw, Compass } from 'lucide-react';

export const ExploreVenues: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

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
      if (searchInput.trim()) params.append('search', searchInput.trim());
      if (selectedCity) params.append('city', selectedCity);
      if (selectedSport) params.append('sport', selectedSport);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '30');

      return api.get<Venue[]>(`/venues?${params.toString()}`);
    },
  });

  const venues = venuesData || [];

  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    if (searchInput.trim()) params.append('search', searchInput.trim());
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

  const hasActiveFilters = Boolean(searchInput || selectedCity || selectedSport || sortBy !== 'createdAt');

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#18231D] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - No eyebrow per Impeccable Craft Floor */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#18231D] tracking-tight">
              Sports Turfs & Playable Arenas
            </h1>
            <p className="text-xs sm:text-sm text-[#526158] mt-2 max-w-2xl leading-relaxed font-normal">
              Real-time hourly slot availability protected by PostgreSQL GiST exclusion locks. Choose your ground, inspect surfaces, and book instantly.
            </p>
          </div>

          <div className="text-xs text-[#123B2A] font-bold bg-[#E2F0DF] px-4 py-2 rounded-xl border border-[#C5E1BF] shadow-xs self-start md:self-auto font-mono tabular-nums">
            {isLoading ? 'Scanning venues...' : `${venues.length} Arenas Available`}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DFE6DF] shadow-card mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search box */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443] focus-within:border-transparent transition-all">
              <Search className="w-4 h-4 text-[#526158] shrink-0" aria-hidden="true" />
              <label htmlFor="explore-search" className="sr-only">
                Search by turf name or area
              </label>
              <input
                id="explore-search"
                type="text"
                placeholder="Search by turf name or area..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                className="w-full bg-transparent text-xs sm:text-sm text-[#18231D] focus:outline-none placeholder:text-[#526158] font-medium"
              />
            </div>

            {/* City Selector */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443] focus-within:border-transparent transition-all">
              <MapPin className="w-4 h-4 text-[#27864F] shrink-0" aria-hidden="true" />
              <label htmlFor="explore-city" className="sr-only">
                Filter by city
              </label>
              <select
                id="explore-city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#18231D] focus:outline-none font-semibold cursor-pointer"
              >
                <option value="">All Cities</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Gurugram">Gurugram / NCR</option>
              </select>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443] focus-within:border-transparent transition-all">
              <ArrowUpDown className="w-4 h-4 text-[#526158] shrink-0" aria-hidden="true" />
              <label htmlFor="explore-sort" className="sr-only">
                Sort venues
              </label>
              <select
                id="explore-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-transparent text-xs sm:text-sm text-[#18231D] focus:outline-none font-semibold cursor-pointer"
              >
                <option value="createdAt">Newest First</option>
                <option value="name">Venue Name</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApplyFilter}
                className="flex-1 py-2.5 px-4 bg-[#123B2A] hover:bg-[#176443] text-white text-xs sm:text-sm font-bold rounded-xl shadow-brand hover:opacity-95 transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176443] cursor-pointer"
              >
                <Filter className="w-4 h-4 text-[#B9F65A]" />
                <span>Filter Arenas</span>
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2.5 text-xs font-bold text-[#526158] hover:text-[#18231D] transition-colors flex items-center gap-1 border border-[#DFE6DF] hover:border-[#123B2A] rounded-xl bg-[#F8FAF7] cursor-pointer"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Sports Quick Filter Chips (Clean Vector Icons) */}
          <div className="flex items-center gap-2 pt-3 border-t border-[#DFE6DF] overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-black text-[#526158] uppercase tracking-wider shrink-0 mr-1">
              Sport:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSport('')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedSport === ''
                  ? 'bg-gradient-booking text-[#18231D] shadow-lime-sm font-black'
                  : 'bg-[#F0F6EE] text-[#18231D] hover:bg-[#E2F0DF] border border-[#DFE6DF]'
              }`}
            >
              All Sports
            </button>
            {sports?.map((sport) => (
              <button
                key={sport.id}
                type="button"
                onClick={() => setSelectedSport(sport.slug)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedSport === sport.slug
                    ? 'bg-gradient-booking text-[#18231D] shadow-lime-sm font-black'
                    : 'bg-[#F0F6EE] text-[#18231D] hover:bg-[#E2F0DF] border border-[#DFE6DF]'
                }`}
              >
                <SportIcon sport={sport.name} className="w-3.5 h-3.5 text-current" />
                <span>{sport.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Venues Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl h-80 animate-pulse border border-[#DFE6DF]"
              />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#DFE6DF] shadow-card max-w-xl mx-auto p-8">
            <div className="w-16 h-16 bg-[#F0F6EE] text-[#123B2A] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#DFE6DF] shadow-xs">
              <Search className="w-8 h-8 text-[#27864F]" />
            </div>
            <h3 className="text-xl font-black text-[#18231D] mb-2">No Arenas Found</h3>
            <p className="text-xs sm:text-sm text-[#526158] max-w-md mx-auto mb-6 leading-relaxed font-normal">
              We couldn't find any approved venues matching your current search criteria. Try adjusting your city or selecting another sport.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-[#123B2A] hover:bg-[#176443] text-white text-xs font-bold rounded-xl transition-all shadow-brand cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
