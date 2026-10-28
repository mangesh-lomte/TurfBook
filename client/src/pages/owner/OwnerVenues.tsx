import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Venue } from '../../types';
import { getStatusColor, formatCurrency } from '../../lib/utils';
import { ImageWithFallback } from '../../components/ImageWithFallback';
import { SportIcon } from '../../components/SportIcon';
import { getSportMatchedImage, detectVenueSportKey } from '../../lib/sportsImages';
import {
  PlusCircle,
  Building2,
  MapPin,
  Layers,
  ExternalLink,
  ShieldCheck,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Compass,
} from 'lucide-react';

export const OwnerVenues: React.FC = () => {
  const navigate = useNavigate();
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('');

  const { data: venuesData, isLoading } = useQuery({
    queryKey: ['owner-venues'],
    queryFn: () => api.get<Venue[]>('/venues?limit=50'),
  });

  const venues = venuesData || [];

  // Filter venues by search text and sport
  const filteredVenues = venues.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      v.city.toLowerCase().includes(filterQuery.toLowerCase()) ||
      v.address.toLowerCase().includes(filterQuery.toLowerCase());

    const sportKey = detectVenueSportKey(v);
    const matchesSport = selectedSportFilter ? sportKey === selectedSportFilter : true;

    return matchesSearch && matchesSport;
  });

  return (
    <div className="min-h-screen bg-gradient-dashboard text-[#18231D] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-[#18231D] tracking-tight">
                My Sports Venues
              </h1>
              <span className="text-xs text-[#123B2A] font-bold bg-[#E2F0DF] px-3 py-1 rounded-full border border-[#C5E1BF] font-mono tabular-nums">
                {venues.length} {venues.length === 1 ? 'Venue' : 'Venues'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#526158] mt-1.5 max-w-2xl font-normal leading-relaxed">
              Manage your sports facilities, inspect photo presentation, configure playable turf pitches, and monitor live booking availability.
            </p>
          </div>

          <Link
            to="/owner/venues/create"
            className="px-5 py-2.5 bg-gradient-booking hover:brightness-105 text-[#18231D] font-black text-xs rounded-xl shadow-lime-sm transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#18231D]" />
            <span>Register New Venue</span>
          </Link>
        </div>

        {/* Filter Bar (If multiple venues) */}
        {venues.length > 0 && (
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#DFE6DF] shadow-card mb-8 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-3.5 py-2 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl w-full focus-within:ring-2 focus-within:ring-[#176443]">
              <Search className="w-4 h-4 text-[#526158] shrink-0" />
              <input
                type="text"
                placeholder="Search venue by name, city, or locality..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#18231D] focus:outline-none placeholder:text-[#526158] font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(['', 'football', 'cricket', 'basketball', 'badminton', 'tennis'] as const).map((sportKey) => {
                const isSelected = selectedSportFilter === sportKey;
                const label =
                  sportKey === ''
                    ? 'All Sports'
                    : sportKey.charAt(0).toUpperCase() + sportKey.slice(1);

                return (
                  <button
                    key={sportKey}
                    type="button"
                    onClick={() => setSelectedSportFilter(sportKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#123B2A] text-white shadow-brand font-black'
                        : 'bg-[#F8FAF7] border border-[#DFE6DF] text-[#526158] hover:text-[#18231D] hover:bg-[#F0F6EE]'
                    }`}
                  >
                    {sportKey && <SportIcon sport={sportKey} className="w-3.5 h-3.5 text-current" />}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Venues Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl h-80 animate-pulse border border-[#DFE6DF] shadow-card"
              />
            ))}
          </div>
        ) : filteredVenues.length === 0 && venues.length > 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#DFE6DF] p-8 shadow-card max-w-md mx-auto">
            <Search className="w-10 h-10 text-[#526158] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#18231D]">No Venues Match Filter</h3>
            <p className="text-xs text-[#526158] mt-1 mb-4">
              Try resetting your search query or choosing another sport category.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterQuery('');
                setSelectedSportFilter('');
              }}
              className="px-4 py-2 bg-[#123B2A] hover:bg-[#176443] text-white text-xs font-bold rounded-xl shadow-brand transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#DFE6DF] p-8 shadow-card max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F0F6EE] text-[#123B2A] flex items-center justify-center mx-auto mb-3 border border-[#C5E1BF]">
              <Building2 className="w-8 h-8 text-[#27864F]" />
            </div>
            <h3 className="text-lg font-black text-[#18231D] mb-1">No Venues Registered Yet</h3>
            <p className="text-xs text-[#526158] max-w-sm mx-auto mb-6 leading-relaxed font-normal">
              Get started by registering your sports arena. Once approved by platform administrators,
              players can discover and book slots instantly.
            </p>
            <Link
              to="/owner/venues/create"
              className="px-6 py-2.5 bg-gradient-booking hover:brightness-105 text-[#18231D] text-xs font-black rounded-xl shadow-lime-sm inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#18231D]" />
              <span>Add Your First Venue</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((v) => {
              const matchedPhotoUrl = getSportMatchedImage(v);
              const sportKey = detectVenueSportKey(v);
              const primarySportName =
                v.sports?.[0]?.name ||
                v.grounds?.[0]?.sport?.name ||
                sportKey.charAt(0).toUpperCase() + sportKey.slice(1);

              return (
                <article
                  key={v.id}
                  className="venue-card-surface rounded-3xl border border-[#DFE6DF] overflow-hidden shadow-card hover:shadow-card-hover hover:border-[#27864F]/50 transition-all duration-300 ease-out-expo flex flex-col justify-between group"
                >
                  <div>
                    {/* Consistent Aspect Ratio Media Header with Subtle Gradient */}
                    <div className="relative aspect-[16/10] w-full bg-[#07150F] overflow-hidden">
                      <ImageWithFallback
                        src={matchedPhotoUrl}
                        alt={`${v.name} sports facility`}
                        sport={sportKey}
                        subtleGradient={true}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out-expo"
                      />

                      {/* Top Overlay Badges */}
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
                        <span className="inline-flex items-center gap-1 bg-[#0B241A]/85 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-xs">
                          <MapPin className="w-3 h-3 text-[#B9F65A]" />
                          <span>{v.city}</span>
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black border shadow-xs backdrop-blur-md ${
                            v.status === 'APPROVED'
                              ? 'bg-emerald-950/85 text-[#B9F65A] border-emerald-500/40'
                              : v.status === 'PENDING'
                              ? 'bg-amber-950/85 text-amber-300 border-amber-500/40'
                              : 'bg-rose-950/85 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {v.status === 'APPROVED' ? 'Approved & Live' : v.status}
                        </span>
                      </div>

                      {/* Bottom Overlay Badges */}
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
                        <span className="bg-[#0B241A]/90 backdrop-blur-md text-[#B9F65A] border border-[#B9F65A]/30 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
                          <SportIcon sport={primarySportName} className="w-3.5 h-3.5 text-[#B9F65A]" />
                          <span>{primarySportName}</span>
                        </span>

                        {v.startingPrice ? (
                          <span className="bg-[#0B241A]/90 backdrop-blur-md text-white border border-white/20 text-xs font-bold px-2.5 py-1 rounded-xl shadow-sm font-mono tabular-nums">
                            {formatCurrency(v.startingPrice)}
                            <span className="text-[10px] text-[#D5E2D8] font-normal font-sans">/hr</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Venue Body Details */}
                    <div className="p-5 sm:p-6 space-y-3">
                      <div>
                        <h3 className="font-black text-[#18231D] text-lg group-hover:text-[#123B2A] transition-colors line-clamp-1 mb-1">
                          {v.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-[#526158]">
                          <MapPin className="w-3.5 h-3.5 text-[#27864F] shrink-0" />
                          <span className="truncate font-medium">{v.address}, {v.city}</span>
                        </div>
                      </div>

                      {/* Pitches Metric Box */}
                      <div className="flex items-center justify-between text-xs bg-[#F0F6EE] p-3 rounded-2xl border border-[#C5E1BF]">
                        <div className="flex items-center gap-2 text-[#123B2A]">
                          <Layers className="w-4 h-4 text-[#27864F] shrink-0" />
                          <span className="font-bold">
                            {v.grounds?.length || 0} {v.grounds?.length === 1 ? 'Pitch' : 'Pitches'} Configured
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#27864F] bg-white px-2 py-0.5 rounded-lg border border-[#C5E1BF] font-mono tabular-nums">
                          {v.grounds && v.grounds.length > 0 ? `${v.grounds.length} Active` : 'Setup Needed'}
                        </span>
                      </div>

                      {/* Contact row */}
                      <div className="flex items-center gap-4 text-[11px] text-[#526158] pt-1">
                        <div className="flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3 text-[#27864F] shrink-0" />
                          <span className="truncate">{v.contactPhone}</span>
                        </div>
                        <div className="w-px h-3 bg-[#DFE6DF]" />
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-[#27864F] shrink-0" />
                          <span className="truncate">{v.contactEmail}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 sm:p-6 pt-0 border-t border-[#DFE6DF] flex items-center justify-between gap-2 mt-auto">
                    <Link
                      to={`/owner/venues/${v.id}/grounds`}
                      className="flex-1 py-2.5 bg-[#123B2A] hover:bg-[#176443] text-white text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-2 shadow-brand hover:shadow-card-hover cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#B9F65A]" />
                      <span>Configure Grounds</span>
                    </Link>

                    <Link
                      to={`/venues/${v.id}`}
                      className="p-2.5 border border-[#DFE6DF] hover:bg-[#F0F6EE] hover:border-[#123B2A] bg-white text-[#18231D] rounded-xl transition-all shadow-xs cursor-pointer"
                      title="View Public Venue Page"
                      aria-label={`View public page for ${v.name}`}
                    >
                      <ExternalLink className="w-4 h-4 text-[#526158] group-hover:text-[#18231D]" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
