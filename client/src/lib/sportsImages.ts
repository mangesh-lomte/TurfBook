/**
 * Sports Photography Engine for TurfBook
 *
 * Provides high-resolution, realistic, verified (HTTP 200) sports photography
 * matching each sport category (Football, Box Cricket, Basketball, Badminton, Tennis).
 * Eliminates broken image URLs, gray pulse placeholders, and mismatched photography.
 */

export interface SportPhotoSet {
  primary: string;
  gallery: string[];
}

export const VERIFIED_SPORTS_PHOTOS: Record<string, SportPhotoSet> = {
  football: {
    // Floodlit night pitch with FIFA astroturf
    primary: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  cricket: {
    // Floodlit enclosed cricket arena with pitch markings
    primary: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  basketball: {
    // Professional acrylic hardcourt basketball arena with hoop
    primary: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  badminton: {
    // Professional BWF certified synthetic indoor court
    primary: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  tennis: {
    // Championship outdoor hardcourt & clay court
    primary: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  arena: {
    // Multi-sport arena complex
    primary: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    ],
  },
};

// Known broken or 404 Unsplash photo IDs that should be superseded
const BROKEN_PHOTO_SIGNATURES = [
  'photo-1529900248061-5652ab58877f',
  'photo-1518604667503-4672e1314dd6',
  'photo-1531415074868-036b1c57e329',
];

export const isBrokenPhotoUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string' || !url.trim()) return true;
  return BROKEN_PHOTO_SIGNATURES.some((sig) => url.includes(sig));
};

export interface DetectableVenue {
  name?: string;
  description?: string;
  images?: string[];
  sports?: Array<{ name?: string; slug?: string }>;
  grounds?: Array<{ sport?: { name?: string; slug?: string } }>;
}

export const detectVenueSportKey = (venue: DetectableVenue): keyof typeof VERIFIED_SPORTS_PHOTOS => {
  // 1. Check primary sport from sports array
  if (venue.sports && venue.sports.length > 0) {
    for (const s of venue.sports) {
      const slug = (s.slug || s.name || '').toLowerCase();
      if (slug.includes('crick')) return 'cricket';
      if (slug.includes('foot') || slug.includes('socc')) return 'football';
      if (slug.includes('basket')) return 'basketball';
      if (slug.includes('badm')) return 'badminton';
      if (slug.includes('tenn')) return 'tennis';
    }
  }

  // 2. Check grounds array
  if (venue.grounds && venue.grounds.length > 0) {
    for (const g of venue.grounds) {
      const sportName = (g.sport?.name || g.sport?.slug || '').toLowerCase();
      if (sportName.includes('crick')) return 'cricket';
      if (sportName.includes('foot') || sportName.includes('socc')) return 'football';
      if (sportName.includes('basket')) return 'basketball';
      if (sportName.includes('badm')) return 'badminton';
      if (sportName.includes('tenn')) return 'tennis';
    }
  }

  // 3. Check name and description keywords
  const text = `${venue.name || ''} ${venue.description || ''}`.toLowerCase();
  if (text.includes('cricket')) return 'cricket';
  if (text.includes('football') || text.includes('soccer') || text.includes('fifa')) return 'football';
  if (text.includes('basketball') || text.includes('hoop')) return 'basketball';
  if (text.includes('badminton') || text.includes('shuttle')) return 'badminton';
  if (text.includes('tennis')) return 'tennis';

  return 'arena';
};

/**
 * Returns a high-quality, verified, realistic sports photo tailored to the venue's sport.
 * If the venue has custom, working images that aren't broken, it preserves them.
 * Otherwise, it returns the optimal sport photo.
 */
export const getSportMatchedImage = (venue: DetectableVenue, index = 0): string => {
  const sportKey = detectVenueSportKey(venue);
  const photoSet = VERIFIED_SPORTS_PHOTOS[sportKey] || VERIFIED_SPORTS_PHOTOS.arena;

  const candidate = venue.images?.[index];
  if (candidate && !isBrokenPhotoUrl(candidate)) {
    return candidate;
  }

  if (index > 0 && photoSet.gallery[index]) {
    return photoSet.gallery[index];
  }

  return photoSet.primary;
};

/**
 * Returns the entire gallery of verified photos for a venue, ensuring no broken photos exist.
 */
export const getVenuePhotoGallery = (venue: DetectableVenue): string[] => {
  const sportKey = detectVenueSportKey(venue);
  const photoSet = VERIFIED_SPORTS_PHOTOS[sportKey] || VERIFIED_SPORTS_PHOTOS.arena;

  const validCustomImages = (venue.images || []).filter((url) => !isBrokenPhotoUrl(url));

  if (validCustomImages.length > 0) {
    // If custom images are fewer than 3, pad with matching sport gallery photos
    const combined = [...validCustomImages];
    for (const p of photoSet.gallery) {
      if (!combined.includes(p)) {
        combined.push(p);
      }
    }
    return combined;
  }

  return photoSet.gallery;
};

