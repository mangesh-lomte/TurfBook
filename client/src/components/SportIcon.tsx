import React from 'react';

interface SportIconProps {
  sport?: string;
  className?: string;
}

export const FootballIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m12 7-3 2.5v3.5l3 2.5 3-2.5V9.5L12 7z" />
    <path d="M12 7V2" />
    <path d="m9 9.5-4.5-2" />
    <path d="M9 13l-4 3" />
    <path d="M12 15.5V22" />
    <path d="m15 13 4 3" />
    <path d="m15 9.5 4.5-2" />
  </svg>
);

export const CricketIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Stumps / Wicket and ball */}
    <path d="M6 3v18" />
    <path d="M10 3v18" />
    <path d="M14 3v18" />
    <path d="M4 3h12" />
    <circle cx="19" cy="12" r="3" />
    <path d="M17 10.5c1 1 1 2 0 3" />
  </svg>
);

export const BasketballIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2v20" />
    <path d="M4.93 4.93c4 4 4 10.14 0 14.14" />
    <path d="M19.07 4.93c-4 4-4 10.14 0 14.14" />
  </svg>
);

export const TennisIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M5.5 3.5a10 10 0 0 1 0 17" />
    <path d="M18.5 3.5a10 10 0 0 0 0 17" />
  </svg>
);

export const ArenaIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <ellipse cx="12" cy="12" rx="10" ry="7" />
    <ellipse cx="12" cy="12" rx="6" ry="4" />
    <path d="M12 5v14" />
    <path d="M2 12h20" />
  </svg>
);

export const SportIcon: React.FC<SportIconProps> = ({ sport = '', className = 'w-4 h-4' }) => {
  const s = sport.toLowerCase();
  if (s.includes('foot') || s.includes('socc') || s.includes('fifa')) {
    return <FootballIcon className={className} />;
  }
  if (s.includes('crick')) {
    return <CricketIcon className={className} />;
  }
  if (s.includes('basket') || s.includes('hoop')) {
    return <BasketballIcon className={className} />;
  }
  if (s.includes('tenn') || s.includes('padel') || s.includes('badm')) {
    return <TennisIcon className={className} />;
  }
  return <ArenaIcon className={className} />;
};

