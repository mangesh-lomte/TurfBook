import React, { useState, useEffect } from 'react';
import { SportIcon } from './SportIcon';
import { VERIFIED_SPORTS_PHOTOS, isBrokenPhotoUrl } from '../lib/sportsImages';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
  sport?: string;
  subtleGradient?: boolean;
}

const DEFAULT_FALLBACK = VERIFIED_SPORTS_PHOTOS.football.primary;

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Sports arena view',
  className = '',
  containerClassName = '',
  fallbackSrc,
  sport = 'football',
  subtleGradient = false,
  ...props
}) => {
  // Determine sport-matched fallback if custom fallbackSrc not specified
  const normalizedSport = (sport || '').toLowerCase();
  const matchedFallback =
    fallbackSrc ||
    (normalizedSport.includes('crick')
      ? VERIFIED_SPORTS_PHOTOS.cricket.primary
      : normalizedSport.includes('basket')
      ? VERIFIED_SPORTS_PHOTOS.basketball.primary
      : normalizedSport.includes('badm')
      ? VERIFIED_SPORTS_PHOTOS.badminton.primary
      : normalizedSport.includes('tenn')
      ? VERIFIED_SPORTS_PHOTOS.tennis.primary
      : DEFAULT_FALLBACK);

  // If the initial src is known broken, immediately start with the matched fallback
  const initialSrc = isBrokenPhotoUrl(src) ? matchedFallback : (src || matchedFallback);

  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const valid = isBrokenPhotoUrl(src) ? matchedFallback : (src || matchedFallback);
    setCurrentSrc(valid);
    setHasError(false);
    setIsLoading(true);
  }, [src, matchedFallback]);

  const handleError = () => {
    if (!hasError && currentSrc !== matchedFallback) {
      setHasError(true);
      setCurrentSrc(matchedFallback);
      setIsLoading(false);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-[#07150F] ${containerClassName}`}>
      {/* Refined sports loading backdrop */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-[#0B241A] animate-pulse flex items-center justify-center z-0"
          aria-hidden="true"
        >
          <SportIcon sport={sport} className="w-8 h-8 text-[#176443]/40 animate-pulse" />
        </div>
      )}

      {hasError && currentSrc === matchedFallback ? (
        <div className="w-full h-full min-h-[140px] flex flex-col items-center justify-center bg-gradient-to-br from-[#07150F] to-[#123B2A] text-[#B9F65A] p-4 text-center">
          <div className="w-10 h-10 rounded-2xl bg-[#0B241A] border border-[#176443] flex items-center justify-center mb-2 shadow-xs">
            <SportIcon sport={sport} className="w-5 h-5 text-[#B9F65A]" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">{alt}</span>
          <span className="text-[10px] text-[#D5E2D8] mt-0.5 font-medium">TurfBook Verified Arena</span>
        </div>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{ objectFit: 'cover' }}
          onLoad={() => setIsLoading(false)}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}

      {/* Subtle cinematic gradient overlay */}
      {subtleGradient && (
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/75 via-black/20 to-black/30 z-10"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
