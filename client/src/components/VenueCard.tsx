import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Venue } from '../types';
import { formatCurrency } from '../lib/utils';
import { ImageWithFallback } from './ImageWithFallback';
import { SportIcon } from './SportIcon';
import { getSportMatchedImage, detectVenueSportKey } from '../lib/sportsImages';
import { MapPin, ArrowRight, ShieldCheck, Star } from 'lucide-react';

interface VenueCardProps {
  venue: Venue;
  featured?: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, featured = false }) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/venues/${venue.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate();
    }
  };

  const primaryImage = getSportMatchedImage(venue);
  const sportKey = detectVenueSportKey(venue);
  const rating = venue.averageRating ? venue.averageRating.toFixed(1) : '5.0';
  const startingPrice = venue.startingPrice ? formatCurrency(venue.startingPrice) : '₹800';

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`View venue details for ${venue.name} in ${venue.city}`}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      className="group venue-card-surface rounded-2xl overflow-hidden cursor-pointer flex flex-col h-full shadow-card hover:shadow-card-hover hover:border-[#27864F]/50 transition-all duration-300 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176443] focus-visible:ring-offset-2"
    >
      {/* Venue Media Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#07150F]">
        <ImageWithFallback
          src={primaryImage}
          alt={venue.name}
          sport={sportKey}
          subtleGradient={true}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out-expo"
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          {featured || venue.isFeatured ? (
            <span className="inline-flex items-center gap-1 bg-[#0B241A]/90 backdrop-blur-md text-[#B9F65A] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#B9F65A]/30 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B9F65A]" />
              <span>Verified Arena</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-md text-[#18231D] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#DFE6DF] shadow-xs">
              {venue.city}
            </span>
          )}

          {/* Rating Pill */}
          <div className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-[#18231D] shadow-xs border border-[#DFE6DF]">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-mono tabular-nums">{rating}</span>
            <span className="text-[10px] text-[#526158] font-normal font-mono tabular-nums">
              ({venue.totalReviews || venue.reviews?.length || 1})
            </span>
          </div>
        </div>

        {/* Bottom Sports Overlay Chips (Clean Vector Icons) */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 pointer-events-none">
          {venue.sports?.slice(0, 3).map((sport) => (
            <span
              key={sport.id}
              className="bg-[#0B241A]/90 backdrop-blur-md text-[#B9F65A] border border-[#B9F65A]/25 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs"
            >
              <SportIcon sport={sport.name} className="w-3 h-3 text-[#B9F65A]" />
              <span>{sport.name}</span>
            </span>
          ))}
          {venue.sports && venue.sports.length > 3 && (
            <span className="bg-[#0B241A]/90 backdrop-blur-md text-[#D5E2D8] text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-white/10 font-mono tabular-nums">
              +{venue.sports.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Venue Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#526158] mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#27864F] shrink-0" />
            <span className="truncate font-medium">{venue.address}, {venue.city}</span>
          </div>

          <h3 className="font-bold text-[#18231D] text-lg group-hover:text-[#123B2A] transition-colors line-clamp-1 mb-2">
            {venue.name}
          </h3>

          <p className="text-xs text-[#526158] line-clamp-2 leading-relaxed font-normal mb-4">
            {venue.description || 'Premier multi-sport arena equipped with floodlights, player amenities, and instant slot reservations.'}
          </p>
        </div>

        {/* Pricing & Booking CTA Footer */}
        <div className="pt-3 border-t border-[#DFE6DF] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#526158] block uppercase tracking-wider">Starting from</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-[#123B2A] font-mono tabular-nums">{startingPrice}</span>
              <span className="text-xs text-[#526158] font-medium">/ hr</span>
            </div>
          </div>

          <div className="w-9 h-9 rounded-xl bg-[#F0F6EE] group-hover:bg-[#123B2A] group-hover:text-white text-[#123B2A] border border-[#DFE6DF] group-hover:border-[#123B2A] flex items-center justify-center transition-all duration-200 shadow-xs">
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </article>
  );
};
