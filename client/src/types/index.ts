export type Role = 'CUSTOMER' | 'OWNER' | 'ADMIN';
export type VenueStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  minPlayers: number;
  maxPlayers: number;
  isActive: boolean;
}

export interface Ground {
  id: string;
  venueId: string;
  sportId: string;
  name: string;
  description?: string | null;
  surfaceType: string;
  isIndoor: boolean;
  hourlyRate: number | string;
  minSlotDurationMinutes: number;
  maxSlotDurationMinutes: number;
  isActive: boolean;
  sport?: Sport;
}

export interface OperatingHours {
  id?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  venueId: string;
  customerId: string;
  rating: number;
  comment: string;
  isVerifiedStay: boolean;
  createdAt: string;
  customer?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
}

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  contactPhone: string;
  contactEmail: string;
  facilities: string[];
  images: string[];
  status: VenueStatus;
  isFeatured: boolean;
  createdAt: string;
  averageRating?: number;
  totalReviews?: number;
  startingPrice?: number | null;
  sports?: Sport[];
  grounds?: Ground[];
  operatingHours?: OperatingHours[];
  reviews?: Review[];
  owner?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
}

export interface TimeSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  isAvailable: boolean;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED' | 'PAST';
  price: number;
  reason?: string;
}

export interface AvailabilityResponse {
  groundId: string;
  groundName: string;
  hourlyRate: number;
  venueName: string;
  date: string;
  isOpen: boolean;
  message?: string;
  operatingHours?: {
    openTime: string;
    closeTime: string;
  };
  slots: TimeSlot[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  bookingId: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  provider: string;
  transactionRef?: string | null;
  failureReason?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  booking?: Booking;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  groundId: string;
  startTime: string;
  endTime: string;
  totalHours: number | string;
  hourlyRate: number | string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  totalPrice: number | string;
  status: BookingStatus;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  createdAt: string;
  ground?: Ground & {
    venue?: {
      id: string;
      name: string;
      slug?: string;
      address: string;
      city: string;
      contactPhone?: string;
      images?: string[];
      ownerId?: string;
    };
    sport?: Sport;
  };
  customer?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
  };
  payments?: Payment[];
  review?: Review | null;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CustomerAnalytics {
  upcomingBookings: number;
  pastBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  recentBookings: Booking[];
}

export interface OwnerAnalytics {
  totalVenues: number;
  totalBookings: number;
  todayBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  recentReservations: Booking[];
  topGrounds: {
    id: string;
    name: string;
    venueName: string;
    sportName: string;
    hourlyRate: number;
    bookingCount: number;
  }[];
}

export interface AdminAnalytics {
  totalUsers: number;
  totalVenues: number;
  pendingVenues: number;
  approvedVenues: number;
  totalBookings: number;
  confirmedBookings: number;
  platformRevenue: number;
  recentAuditLogs: {
    id: string;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    createdAt: string;
    user?: {
      fullName: string;
      email: string;
      role: Role;
    } | null;
  }[];
}
