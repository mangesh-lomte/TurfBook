import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Venue, Sport } from '../types';
import { VenueCard } from '../components/VenueCard';
import { SportsComplexArena, SportFacilityType } from '../components/3d/SportsComplexArena';
import { FootballIcon, CricketIcon, BasketballIcon, SportIcon } from '../components/SportIcon';
import {
  Search,
  MapPin,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  Trophy,
  CheckCircle2,
  Users,
  Compass,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selected3DFacility, setSelected3DFacility] = useState<SportFacilityType>(null);

  // Fetch active sports
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get<Sport[]>('/sports'),
  });

  // Fetch featured approved venues
  const { data: venuesData, isLoading: isVenuesLoading } = useQuery({
    queryKey: ['venues', 'featured'],
    queryFn: () =>
      api.get<Venue[]>('/venues?limit=4&sortBy=rating&sortOrder=desc'),
  });

  const venues = venuesData || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedCity) params.append('city', selectedCity);
    navigate(`/explore?${params.toString()}`);
  };

  const handleExploreSport = (sport: string) => {
    navigate(`/explore?sport=${sport}`);
  };

  const handleFacilityFocus = (facility: SportFacilityType) => {
    setSelected3DFacility(facility);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#18231D] overflow-x-hidden selection:bg-[#B9F65A] selection:text-[#18231D]">
      {/* ======================================================== */}
      {/* CINEMATIC HERO SECTION WITH 3D SPORTS COMPLEX ARENA      */}
      {/* ======================================================== */}
      <section className="relative pt-10 pb-16 sm:pt-14 sm:pb-24 lg:pt-16 lg:pb-28 overflow-hidden bg-gradient-hero border-b border-[#DFE6DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* ---------------------------------------------------- */}
            {/* LEFT COLUMN: BRANDING, HEADLINE & SEARCH INTERFACE   */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-6 flex flex-col justify-center text-left">
              {/* Main Headline - No kickers per Impeccable Craft Floor */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-5 text-[#18231D] text-balance">
                Your Game.{' '}
                <span className="text-[#123B2A]">Your Ground.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#526158] max-w-xl mb-8 leading-relaxed font-normal text-pretty">
                Discover certified FIFA-grade football turfs, floodlit box cricket cages, and high-traction acrylic basketball courts with instant hourly slot locking.
              </p>

              {/* CTA Buttons Row */}
              <div className="flex flex-wrap items-center gap-3.5 mb-8">
                <Link
                  to="/explore"
                  className="px-6 py-3.5 rounded-xl bg-[#123B2A] hover:bg-[#176443] text-white font-bold text-sm tracking-wide flex items-center gap-2 shadow-brand hover:shadow-card-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#B9F65A]" />
                  <span>Explore Turfs</span>
                  <ArrowRight className="w-4 h-4 text-[#B9F65A]" />
                </Link>

                <Link
                  to="/owner/venues/create"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-[#F0F6EE] border border-[#123B2A] text-[#123B2A] font-bold text-sm tracking-wide transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>List Your Facility</span>
                </Link>
              </div>

              {/* Quick Search Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-card border border-[#DFE6DF] max-w-xl">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl w-full focus-within:ring-2 focus-within:ring-[#176443] focus-within:border-transparent transition-all">
                    <Search className="w-4 h-4 text-[#526158] shrink-0" aria-hidden="true" />
                    <label htmlFor="hero-search-input" className="sr-only">
                      Search turf name, area, or sport
                    </label>
                    <input
                      id="hero-search-input"
                      type="text"
                      placeholder="Search turf name, area, or sport..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-[#18231D] text-sm focus:outline-none placeholder:text-[#526158] font-medium"
                    />
                  </div>

                  <div className="w-full sm:w-44 flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443] focus-within:border-transparent transition-all">
                    <MapPin className="w-4 h-4 text-[#27864F] shrink-0" aria-hidden="true" />
                    <label htmlFor="hero-city-select" className="sr-only">
                      Select city
                    </label>
                    <select
                      id="hero-city-select"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-transparent text-[#18231D] text-sm focus:outline-none font-semibold cursor-pointer"
                    >
                      <option value="">All Cities</option>
                      <option value="Mumbai">Mumbai</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Gurugram">Gurugram / NCR</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-booking hover:brightness-105 text-[#18231D] font-black text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lime-sm transition-all shrink-0 cursor-pointer"
                  >
                    <span>Find Slots</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Direct Facility Focus (Vector Sports Icons) */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#526158] font-bold mr-1">Direct Facility Focus:</span>
                <button
                  type="button"
                  onClick={() => setSelected3DFacility('football')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    selected3DFacility === 'football'
                      ? 'bg-gradient-booking text-[#18231D] border-[#B9F65A] shadow-lime-sm font-black'
                      : 'bg-white text-[#123B2A] border-[#DFE6DF] hover:border-[#123B2A]'
                  }`}
                >
                  <FootballIcon className="w-3.5 h-3.5 text-current" />
                  <span>Football Turf</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelected3DFacility('cricket')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    selected3DFacility === 'cricket'
                      ? 'bg-gradient-booking text-[#18231D] border-[#B9F65A] shadow-lime-sm font-black'
                      : 'bg-white text-[#123B2A] border-[#DFE6DF] hover:border-[#123B2A]'
                  }`}
                >
                  <CricketIcon className="w-3.5 h-3.5 text-current" />
                  <span>Box Cricket</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelected3DFacility('basketball')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    selected3DFacility === 'basketball'
                      ? 'bg-gradient-booking text-[#18231D] border-[#B9F65A] shadow-lime-sm font-black'
                      : 'bg-white text-[#123B2A] border-[#DFE6DF] hover:border-[#123B2A]'
                  }`}
                >
                  <BasketballIcon className="w-3.5 h-3.5 text-current" />
                  <span>Basketball Court</span>
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: REAL-TIME 3D SPORTS COMPLEX ARENA      */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-6 h-[480px] sm:h-[560px] lg:h-[620px] relative">
              <SportsComplexArena
                selectedFacility={selected3DFacility}
                onFacilityClick={handleFacilityFocus}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* TRUST & ARCHITECTURAL STATS BAR                          */}
      {/* ======================================================== */}
      <section className="bg-[#0B241A] border-y border-[#176443]/30 py-8 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="border-r border-[#176443]/40 last:border-none">
              <div className="text-2xl sm:text-3xl font-black text-[#B9F65A] font-mono tabular-nums">100%</div>
              <div className="text-xs text-[#D5E2D8] font-medium mt-1">PostgreSQL GiST Concurrency</div>
            </div>
            <div className="border-r border-[#176443]/40 last:border-none">
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">0</div>
              <div className="text-xs text-[#D5E2D8] font-medium mt-1">Double Bookings Guaranteed</div>
            </div>
            <div className="border-r border-[#176443]/40 last:border-none">
              <div className="text-2xl sm:text-3xl font-black text-[#B9F65A] font-mono tabular-nums">&lt; 200ms</div>
              <div className="text-xs text-[#D5E2D8] font-medium mt-1">Real-Time Slot Engine</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">Instant</div>
              <div className="text-xs text-[#D5E2D8] font-medium mt-1">Match Play Confirmation</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3D ARENA FACILITY SPOTLIGHT                              */}
      {/* ======================================================== */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-[#18231D] tracking-tight text-balance">
            Explore Championship Sports Facilities
          </h2>
          <p className="text-sm text-[#526158] mt-2 font-normal leading-relaxed text-pretty">
            Each venue on TurfBook offers certified ground surfaces, night floodlight coverage, and dedicated locker facilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Football Arena Card */}
          <div
            onClick={() => handleExploreSport('football')}
            className="group cursor-pointer venue-card-surface p-6 rounded-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F6EE] border border-[#C5E1BF] flex items-center justify-center text-[#123B2A]">
                  <FootballIcon className="w-6 h-6 text-[#27864F]" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F0F6EE] border border-[#DFE6DF] text-[11px] font-bold text-[#123B2A]">
                  FIFA 7v7 / 5v5
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#18231D] group-hover:text-[#123B2A] transition-colors mb-2">
                Football Astroturf
              </h3>
              <p className="text-xs text-[#526158] leading-relaxed font-normal mb-4">
                Monofilament 50mm artificial turf with resilient rubber infill, anti-skid shock pads, and regulation steel goalposts.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#123B2A] group-hover:text-[#27864F] pt-4 border-t border-[#DFE6DF]">
              <span>View Available Turfs</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Cricket Box Card */}
          <div
            onClick={() => handleExploreSport('cricket')}
            className="group cursor-pointer venue-card-surface p-6 rounded-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F6EE] border border-[#C5E1BF] flex items-center justify-center text-[#123B2A]">
                  <CricketIcon className="w-6 h-6 text-[#27864F]" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F0F6EE] border border-[#DFE6DF] text-[11px] font-bold text-[#123B2A]">
                  Box Cricket Cage
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#18231D] group-hover:text-[#123B2A] transition-colors mb-2">
                Enclosed Cricket Arena
              </h3>
              <p className="text-xs text-[#526158] leading-relaxed font-normal mb-4">
                High-tensile UV nylon safety netting with dual-tone AstroTurf batting strips, regulation crease markings, and spring stumps.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#123B2A] group-hover:text-[#27864F] pt-4 border-t border-[#DFE6DF]">
              <span>View Box Cricket Cages</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Basketball Court Card */}
          <div
            onClick={() => handleExploreSport('basketball')}
            className="group cursor-pointer venue-card-surface p-6 rounded-2xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F0F6EE] border border-[#C5E1BF] flex items-center justify-center text-[#123B2A]">
                  <BasketballIcon className="w-6 h-6 text-[#27864F]" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#F0F6EE] border border-[#DFE6DF] text-[11px] font-bold text-[#123B2A]">
                  FIBA Standard
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#18231D] group-hover:text-[#123B2A] transition-colors mb-2">
                Acrylic Basketball Court
              </h3>
              <p className="text-xs text-[#526158] leading-relaxed font-normal mb-4">
                8-layer cushioned acrylic court with anti-glare polyurethane finish, tempered glass backboards, and breakaway rings.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-[#123B2A] group-hover:text-[#27864F] pt-4 border-t border-[#DFE6DF]">
              <span>View Basketball Courts</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* FEATURED VENUES SECTION                                  */}
      {/* ======================================================== */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18231D] tracking-tight">
              Featured Venues Open Today
            </h2>
            <p className="text-xs sm:text-sm text-[#526158] mt-1">
              Top rated sports arenas with real-time slot availability.
            </p>
          </div>
          <Link
            to="/explore"
            className="text-sm font-bold text-[#123B2A] hover:text-[#176443] flex items-center gap-1.5 group self-start sm:self-auto cursor-pointer"
          >
            <span>View All Arenas</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#27864F]" />
          </Link>
        </div>

        {isVenuesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl h-80 animate-pulse border border-[#DFE6DF]"
              />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#DFE6DF] shadow-card">
            <Trophy className="w-12 h-12 text-[#526158] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#18231D]">No Featured Venues Found</h3>
            <p className="text-xs text-[#526158] mt-1">Check back soon for new arena listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} featured />
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* HOW TURFBOOK WORKS (3 SIMPLE STEPS)                      */}
      {/* ======================================================== */}
      <section className="py-20 bg-gradient-dark-content text-white border-t border-[#176443]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-12 tracking-tight text-white text-balance">
            How TurfBook Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#07150F]/70 backdrop-blur-md p-8 rounded-2xl text-left border border-[#176443]/40 shadow-elevated-dark">
              <div className="w-12 h-12 bg-gradient-booking text-[#18231D] rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-lime-sm font-mono">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Discover Verified Arena</h3>
              <p className="text-xs sm:text-sm text-[#D5E2D8] leading-relaxed font-normal">
                Filter by sport, city, surface specs, or player amenities. View arena photos, floodlight Lux levels, and verified player ratings.
              </p>
            </div>

            <div className="bg-[#07150F]/70 backdrop-blur-md p-8 rounded-2xl text-left border border-[#176443]/40 shadow-elevated-dark">
              <div className="w-12 h-12 bg-gradient-booking text-[#18231D] rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-lime-sm font-mono">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Pick Real-Time Slot</h3>
              <p className="text-xs sm:text-sm text-[#D5E2D8] leading-relaxed font-normal">
                Choose your match day. Our real-time engine verifies ground availability and locks your slot with PostgreSQL GiST exclusion protection.
              </p>
            </div>

            <div className="bg-[#07150F]/70 backdrop-blur-md p-8 rounded-2xl text-left border border-[#176443]/40 shadow-elevated-dark">
              <div className="w-12 h-12 bg-gradient-booking text-[#18231D] rounded-2xl flex items-center justify-center font-black text-xl mb-6 shadow-lime-sm font-mono">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Play Voucher</h3>
              <p className="text-xs sm:text-sm text-[#D5E2D8] leading-relaxed font-normal">
                Receive authoritative confirmation with your unique booking reference. Show up with your squad, take the field, and play!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* OWNER CTA BANNER                                         */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden py-16 bg-gradient-dark-content border-t border-[#176443]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white text-balance">
              List Your Facility & Fill Off-Peak Capacity
            </h2>
            <p className="text-xs sm:text-sm text-[#D5E2D8] max-w-xl mt-2 leading-relaxed font-normal">
              Join leading turf venues in Mumbai, Bengaluru, and Hyderabad. Automate scheduling, prevent double bookings, and track match revenue in real-time.
            </p>
          </div>
          <Link
            to="/owner/venues/create"
            className="px-7 py-4 bg-gradient-booking hover:brightness-105 text-[#18231D] font-black text-sm rounded-xl shadow-lime transition-all flex items-center gap-2 shrink-0 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Register Your Turf</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
