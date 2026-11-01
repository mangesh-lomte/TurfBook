import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Venue, Sport } from '../types';
import { VenueCard } from '../components/VenueCard';
import { StadiumScrollSequence } from '../components/StadiumScrollSequence';
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
  ChevronDown,
  Eye,
  Star,
  Check,
  Activity,
  Flame,
  SlidersHorizontal,
  RotateCcw,
  ArrowDown,
} from 'lucide-react';

interface FacilitySpec {
  id: 'football' | 'cricket' | 'basketball';
  name: string;
  badge: string;
  title: string;
  description: string;
  specs: string;
  lighting: string;
  capacity: string;
  exploreParam: string;
  progressMilestone: number;
}

const FACILITY_SPECS: Record<string, FacilitySpec> = {
  football: {
    id: 'football',
    name: 'Football Astroturf',
    badge: 'FIFA Quality Pro 50mm',
    title: 'Championship Football Turf',
    description:
      'Monofilament 50mm artificial turf with resilient cryogenic rubber infill, anti-skid shock pads, and regulation steel goalposts.',
    specs: '38m × 26m • 7v7 / 5v5 Match Play',
    lighting: '800 Lux Night Match Floodlighting',
    capacity: '10–14 Players',
    exploreParam: 'football',
    progressMilestone: 0.28,
  },
  cricket: {
    id: 'cricket',
    name: 'Box Cricket Cage',
    badge: 'High-Tensile UV Netting',
    title: 'Enclosed Box Cricket Arena',
    description:
      'Dual-tone AstroTurf batting strip with regulation crease markings, 14m steel frame enclosure, and spring-return stumps.',
    specs: '26m × 14m Steel Cage Enclosure',
    lighting: '650 Lux High-Uniformity Canopy Lights',
    capacity: '8–12 Players',
    exploreParam: 'box-cricket',
    progressMilestone: 0.54,
  },
  basketball: {
    id: 'basketball',
    name: 'Basketball Court',
    badge: 'FIBA Standard Regulation',
    title: 'FIBA Acrylic Basketball Court',
    description:
      '8-layer cushioned acrylic court with anti-glare polyurethane finish, tempered safety glass backboards, and breakaway spring rings.',
    specs: '24m × 15m Regulation Court',
    lighting: '750 Lux Glare-Free Court Illuminance',
    capacity: '10 Players (5v5 Full Court)',
    exploreParam: 'basketball',
    progressMilestone: 0.78,
  },
};

export const Home: React.FC = () => {
  const navigate = useNavigate();

  // Venue discovery & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'price'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pricing calculator teaser state
  const [calcDuration, setCalcDuration] = useState(1);
  const [calcTimeSlot, setCalcTimeSlot] = useState<'offpeak' | 'standard' | 'peak'>('peak');

  // Fetch active sports list
  const { data: sports } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get<Sport[]>('/sports'),
  });

  // Fetch venues with real filters
  const { data: venuesData, isLoading: isVenuesLoading } = useQuery({
    queryKey: ['venues', searchQuery, selectedCity, selectedSportFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedCity) params.append('city', selectedCity);
      if (selectedSportFilter) params.append('sport', selectedSportFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '8');

      try {
        const res = await api.get<Venue[]>(`/venues?${params.toString()}`);
        if (Array.isArray(res)) return res;
      } catch {
        // Fallback to recommendations only if query network fails
        return api.get<Venue[]>('/venues/recommendations?limit=8').catch(() => []);
      }
      return [];
    },
  });

  const venues = venuesData || [];

  const scrollToVenues = useCallback(() => {
    const el = document.getElementById('venues-discovery');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/explore');
    }
  }, [navigate]);

  const scrollToHowItWorks = useCallback(() => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scrollToVenues();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedSportFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // Dynamic pricing calculation preview
  const pricingPreview = useMemo(() => {
    const baseRate = 1200;
    let multiplier = 1.0;
    let label = 'Standard Hourly Rate';
    if (calcTimeSlot === 'offpeak') {
      multiplier = 0.75;
      label = 'Off-Peak Weekday Discount (-25%)';
    } else if (calcTimeSlot === 'peak') {
      multiplier = 1.2;
      label = 'Prime-Time Floodlight Surcharge (+20%)';
    }
    const finalPerHour = Math.round(baseRate * multiplier);
    const total = finalPerHour * calcDuration;
    return { baseRate, multiplier, label, finalPerHour, total };
  }, [calcDuration, calcTimeSlot]);

  return (
    <div className="min-h-screen bg-[#07150F] text-[#F8FAF7] selection:bg-[#B9F65A] selection:text-[#07150F]">
      {/* ======================================================== */}
      {/* GOOGLE FLOW STADIUM DECONSTRUCTION SCROLL SEQUENCE       */}
      {/* ======================================================== */}
      <StadiumScrollSequence
        onExploreTurfs={scrollToVenues}
        onHowItWorks={scrollToHowItWorks}
      />

      {/* ======================================================== */}
      {/* SCENE 4: REAL VENUE DISCOVERY SECTION (#venues-discovery) */}
      {/* ======================================================== */}
      <section id="venues-discovery" className="relative z-30 pt-20 pb-24 bg-[#07150F] border-t border-[#176443]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123B2A] border border-[#B9F65A]/40 text-xs font-mono font-bold text-[#B9F65A] tracking-wider uppercase mb-3">
                <Compass className="w-3.5 h-3.5 text-[#B9F65A]" />
                <span>SCENE 04 // REAL-TIME DISCOVERY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
                DISCOVER REAL <span className="text-[#B9F65A]">VENUES NEAR YOU</span>
              </h2>
              <p className="text-sm text-[#D5E2D8] mt-2 font-normal max-w-2xl leading-relaxed">
                Browse verified sports grounds with certified floodlighting, player amenities, and instant hourly slot reservation.
              </p>
            </div>

            <Link
              to="/explore"
              className="px-5 py-2.5 rounded-xl bg-[#0B241A] hover:bg-[#123B2A] border border-[#176443] text-xs font-bold text-[#B9F65A] hover:border-[#B9F65A]/60 flex items-center gap-2 shadow-sm transition-all self-start md:self-auto cursor-pointer"
            >
              <span>View Full Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Search, City & Filter Toolbar */}
          <div className="bg-[#0B241A]/90 p-4 sm:p-5 rounded-2xl border border-[#176443]/70 backdrop-blur-md shadow-elevated-dark mb-8">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
              {/* Search text input */}
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-3 bg-[#07150F] border border-[#176443]/60 rounded-xl w-full focus-within:ring-2 focus-within:ring-[#B9F65A] focus-within:border-transparent transition-all">
                <Search className="w-4 h-4 text-[#D5E2D8]/60 shrink-0" aria-hidden="true" />
                <label htmlFor="scene4-search-input" className="sr-only">
                  Search venue name, area, or sport
                </label>
                <input
                  id="scene4-search-input"
                  type="text"
                  placeholder="Search turf name, area, or sport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-white text-sm focus:outline-none placeholder:text-[#D5E2D8]/50 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#D5E2D8]/50 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* City selector dropdown */}
              <div className="w-full md:w-52 flex items-center gap-2 px-3.5 py-3 bg-[#07150F] border border-[#176443]/60 rounded-xl focus-within:ring-2 focus-within:ring-[#B9F65A] focus-within:border-transparent transition-all">
                <MapPin className="w-4 h-4 text-[#B9F65A] shrink-0" aria-hidden="true" />
                <label htmlFor="scene4-city-select" className="sr-only">
                  Select city
                </label>
                <select
                  id="scene4-city-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-[#07150F] text-white text-sm focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Gurugram">Gurugram / NCR</option>
                </select>
              </div>

              {/* Sort selector */}
              <div className="w-full md:w-48 flex items-center gap-2 px-3.5 py-3 bg-[#07150F] border border-[#176443]/60 rounded-xl focus-within:ring-2 focus-within:ring-[#B9F65A] focus-within:border-transparent transition-all">
                <SlidersHorizontal className="w-4 h-4 text-[#D5E2D8]/60 shrink-0" aria-hidden="true" />
                <label htmlFor="scene4-sort-select" className="sr-only">
                  Sort venues
                </label>
                <select
                  id="scene4-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-[#07150F] text-white text-sm focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="name">Venue Name</option>
                  <option value="price">Best Value</option>
                </select>
              </div>

              {/* Search submit button */}
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 bg-gradient-booking hover:brightness-105 text-[#07150F] font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lime transition-all shrink-0 cursor-pointer"
              >
                <span>Find Venues</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Sport Filter Chips */}
            <div className="mt-4 pt-4 border-t border-[#176443]/40 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#D5E2D8] mr-2">Filter by Sport:</span>
              <button
                type="button"
                onClick={() => setSelectedSportFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedSportFilter === ''
                    ? 'bg-[#B9F65A] text-[#07150F]'
                    : 'bg-[#07150F] text-[#D5E2D8] border border-[#176443]/60 hover:border-[#B9F65A]'
                }`}
              >
                All Sports
              </button>
              <button
                type="button"
                onClick={() => setSelectedSportFilter('football')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedSportFilter === 'football'
                    ? 'bg-[#B9F65A] text-[#07150F]'
                    : 'bg-[#07150F] text-[#D5E2D8] border border-[#176443]/60 hover:border-[#B9F65A]'
                }`}
              >
                <FootballIcon className="w-3.5 h-3.5" />
                <span>Football</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSportFilter('cricket')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedSportFilter === 'cricket'
                    ? 'bg-[#B9F65A] text-[#07150F]'
                    : 'bg-[#07150F] text-[#D5E2D8] border border-[#176443]/60 hover:border-[#B9F65A]'
                }`}
              >
                <CricketIcon className="w-3.5 h-3.5" />
                <span>Box Cricket</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSportFilter('basketball')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedSportFilter === 'basketball'
                    ? 'bg-[#B9F65A] text-[#07150F]'
                    : 'bg-[#07150F] text-[#D5E2D8] border border-[#176443]/60 hover:border-[#B9F65A]'
                }`}
              >
                <BasketballIcon className="w-3.5 h-3.5" />
                <span>Basketball</span>
              </button>

              {(searchQuery || selectedCity || selectedSportFilter) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="ml-auto text-xs text-[#B9F65A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Venue Cards Grid */}
          {isVenuesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="bg-[#0B241A]/50 rounded-2xl h-80 animate-pulse border border-[#176443]/40"
                />
              ))}
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-16 bg-[#0B241A]/50 rounded-3xl border border-[#176443]/50 shadow-elevated-dark max-w-xl mx-auto">
              <Trophy className="w-12 h-12 text-[#176443] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Venues Found Matching Criteria</h3>
              <p className="text-xs text-[#D5E2D8] mt-1 max-w-sm mx-auto">
                Try widening your search radius, selecting all cities, or choosing all sports categories.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-booking text-[#07150F] text-xs font-black shadow-lime-sm cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} featured />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* SCENE 5: THE BOOKING MOMENT (CONCURRENCY & PRICING ENGINE)*/}
      {/* ======================================================== */}
      <section id="how-it-works" className="py-24 bg-[#0B241A] border-y border-[#176443]/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123B2A] border border-[#B9F65A]/40 text-xs font-mono font-bold text-[#B9F65A] tracking-wider uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B9F65A]" />
              <span>SCENE 05 // ARCHITECTURAL PRECISION</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
              THE BOOKING MOMENT:{' '}
              <span className="text-[#B9F65A]">ZERO DOUBLE BOOKINGS</span>
            </h2>
            <p className="text-sm text-[#D5E2D8] mt-3 font-normal leading-relaxed">
              Engineered with PostgreSQL GiST exclusion constraints, sub-200ms slot verification, and automated dynamic pricing for peak and off-peak match slots.
            </p>
          </div>

          {/* 3 Step Concurrency Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-[#07150F]/80 p-8 rounded-3xl border border-[#176443]/50 shadow-elevated-dark flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-brand border border-[#B9F65A]/40 flex items-center justify-center font-mono font-black text-xl text-[#B9F65A] mb-6 shadow-brand">
                  01
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sub-200ms Slot Engine</h3>
                <p className="text-xs sm:text-sm text-[#D5E2D8] leading-relaxed font-normal">
                  Real-time query scanning across all courts and operating hours with optimized PostgreSQL indexing. Zero loading delay when picking match slots.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#176443]/40 flex items-center gap-2 text-xs text-[#B9F65A] font-mono">
                <Activity className="w-3.5 h-3.5" />
                <span>Ultra-Low Latency Booking</span>
              </div>
            </div>

            <div className="bg-[#07150F]/80 p-8 rounded-3xl border border-[#176443]/50 shadow-elevated-dark flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-brand border border-[#B9F65A]/40 flex items-center justify-center font-mono font-black text-xl text-[#B9F65A] mb-6 shadow-brand">
                  02
                </div>
                <h3 className="text-xl font-bold text-white mb-2">PostgreSQL GiST Lock</h3>
                <p className="text-xs sm:text-sm text-[#D5E2D8] leading-relaxed font-normal">
                  Database-enforced tsrange mathematical exclusion constraints. Two simultaneous booking attempts for the same court and slot will never collide.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#176443]/40 flex items-center gap-2 text-xs text-[#B9F65A] font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Concurrency Guarantee</span>
              </div>
            </div>

            <div className="bg-[#07150F]/80 p-8 rounded-3xl border border-[#176443]/50 shadow-elevated-dark flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-brand border border-[#B9F65A]/40 flex items-center justify-center font-mono font-black text-xl text-[#B9F65A] mb-6 shadow-brand">
                  03
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Dynamic Pricing Engine</h3>
                <p className="text-xs sm:text-sm text-[#D5E2D8] leading-relaxed font-normal">
                  FastAPI Python analytical engine computing real-time rate adjustments: -25% weekday off-peak discounts, +20% peak night floodlight surcharges.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#176443]/40 flex items-center gap-2 text-xs text-[#B9F65A] font-mono">
                <Flame className="w-3.5 h-3.5" />
                <span>Transparent Hourly Rates</span>
              </div>
            </div>
          </div>

          {/* Interactive Pricing Teaser & Simulator Card */}
          <div className="bg-[#07150F] p-8 rounded-3xl border border-[#176443]/60 shadow-elevated-dark max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <div className="text-xs font-mono font-bold text-[#B9F65A] uppercase tracking-wider mb-2">
                  Live Pricing Quote Calculator
                </div>
                <h3 className="text-2xl font-black text-white">Dynamic Rate Transparency</h3>
                <p className="text-xs text-[#D5E2D8] mt-1 leading-relaxed">
                  Adjust slot duration and match timing to see instant quote adjustments.
                </p>

                {/* Slot Selector Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setCalcTimeSlot('offpeak')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      calcTimeSlot === 'offpeak'
                        ? 'bg-[#B9F65A] text-[#07150F]'
                        : 'bg-[#123B2A] text-[#D5E2D8] hover:text-white'
                    }`}
                  >
                    Off-Peak (11 AM–4 PM: -25%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTimeSlot('standard')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      calcTimeSlot === 'standard'
                        ? 'bg-[#B9F65A] text-[#07150F]'
                        : 'bg-[#123B2A] text-[#D5E2D8] hover:text-white'
                    }`}
                  >
                    Regular Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcTimeSlot('peak')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      calcTimeSlot === 'peak'
                        ? 'bg-[#B9F65A] text-[#07150F]'
                        : 'bg-[#123B2A] text-[#D5E2D8] hover:text-white'
                    }`}
                  >
                    Peak Night (6 PM–10 PM: +20%)
                  </button>
                </div>
              </div>

              {/* Price Display */}
              <div className="bg-[#0B241A] p-6 rounded-2xl border border-[#176443] text-center w-full md:w-72 shrink-0">
                <div className="text-xs font-mono text-[#D5E2D8]">{pricingPreview.label}</div>
                <div className="text-3xl font-black text-[#B9F65A] font-mono mt-1">
                  ₹{pricingPreview.total.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#D5E2D8]/70 mt-1">
                  ₹{pricingPreview.finalPerHour}/hr • Guaranteed GiST Lock
                </div>
                <button
                  type="button"
                  onClick={scrollToVenues}
                  className="w-full mt-4 py-2.5 rounded-xl bg-gradient-booking hover:brightness-105 text-[#07150F] text-xs font-black shadow-lime-sm transition-all cursor-pointer"
                >
                  Book Slot Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SCENE 6: STRONG CTA, ARCHITECTURAL TRUST BAR & OWNER HERO */}
      {/* ======================================================== */}
      <section className="py-24 bg-[#07150F] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Architectural Trust Proof Bar */}
          <div className="bg-[#0B241A]/90 p-8 rounded-3xl border border-[#176443]/60 backdrop-blur-md shadow-elevated-dark mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="border-r border-[#176443]/40 last:border-none">
                <div className="text-3xl sm:text-4xl font-black text-[#B9F65A] font-mono tabular-nums">
                  100%
                </div>
                <div className="text-xs text-[#D5E2D8] font-medium mt-1">
                  PostgreSQL GiST Concurrency
                </div>
              </div>
              <div className="border-r border-[#176443]/40 last:border-none">
                <div className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums">
                  0
                </div>
                <div className="text-xs text-[#D5E2D8] font-medium mt-1">
                  Double Bookings Guaranteed
                </div>
              </div>
              <div className="border-r border-[#176443]/40 last:border-none">
                <div className="text-3xl sm:text-4xl font-black text-[#B9F65A] font-mono tabular-nums">
                  &lt; 200ms
                </div>
                <div className="text-xs text-[#D5E2D8] font-medium mt-1">
                  Real-Time Slot Engine
                </div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  Instant
                </div>
                <div className="text-xs text-[#D5E2D8] font-medium mt-1">
                  Match Play Confirmation
                </div>
              </div>
            </div>
          </div>

          {/* High-Impact Closing CTA Banner */}
          <div className="bg-gradient-brand p-10 sm:p-14 rounded-3xl border border-[#B9F65A]/40 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07150F]/60 border border-[#B9F65A]/40 text-xs font-mono font-bold text-[#B9F65A] tracking-wider uppercase mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ready to Play?</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
                YOUR NEXT GAME <span className="text-[#B9F65A]">STARTS HERE.</span>
              </h2>
              <p className="text-sm sm:text-base text-[#D5E2D8] max-w-xl mx-auto mt-4 leading-relaxed font-normal">
                Lock your ground slot in under 60 seconds with zero risk of collision. Join thousands of squads playing on certified turfs across India.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={scrollToVenues}
                  className="px-8 py-4 rounded-xl bg-gradient-booking hover:brightness-105 text-[#07150F] font-black text-sm tracking-wide flex items-center gap-2 shadow-lime transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>FIND YOUR TURF</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  to="/owner/venues/create"
                  className="px-8 py-4 rounded-xl bg-[#07150F]/80 hover:bg-[#07150F] border border-[#B9F65A]/50 text-white font-bold text-sm tracking-wide transition-all shadow-elevated-dark flex items-center gap-2 cursor-pointer hover:border-[#B9F65A]"
                >
                  <span>LIST YOUR FACILITY</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
