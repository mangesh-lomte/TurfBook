import { PrismaClient, Role, VenueStatus, BookingStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting TurfBook database seeding...');

  // 1. Clear existing seed data safely if re-running
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.blockedPeriod.deleteMany();
  await prisma.operatingHours.deleteMany();
  await prisma.venueSport.deleteMany();
  await prisma.ground.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Hash default passwords
  const passwordAdmin = await bcrypt.hash('Admin@123456', 10);
  const passwordOwner = await bcrypt.hash('Owner@123456', 10);
  const passwordCustomer = await bcrypt.hash('Customer@123456', 10);

  // 3. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@turfbook.com',
      passwordHash: passwordAdmin,
      fullName: 'Vikram Mehta (Admin)',
      phone: '+91 9820011223',
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const ownerUser1 = await prisma.user.create({
    data: {
      email: 'owner@turfbook.com',
      passwordHash: passwordOwner,
      fullName: 'Rajesh Sharma (Owner)',
      phone: '+91 9811122233',
      role: Role.OWNER,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const ownerUser2 = await prisma.user.create({
    data: {
      email: 'owner2@turfbook.com',
      passwordHash: passwordOwner,
      fullName: 'Priya Nair (Owner)',
      phone: '+91 9844455566',
      role: Role.OWNER,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@turfbook.com',
      passwordHash: passwordCustomer,
      fullName: 'Rohan Gupta (Customer)',
      phone: '+91 9876543210',
      role: Role.CUSTOMER,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  console.log('👤 Created demo users: Admin, Owners, and Customer');

  // 4. Create Sports
  const football = await prisma.sport.create({
    data: {
      name: 'Football',
      slug: 'football',
      icon: '⚽',
      description: '5-a-side and 7-a-side FIFA approved artificial turf pitches',
      minPlayers: 10,
      maxPlayers: 14,
    },
  });

  const cricket = await prisma.sport.create({
    data: {
      name: 'Box Cricket',
      slug: 'box-cricket',
      icon: '🏏',
      description: 'Enclosed netted floodlit box cricket arenas',
      minPlayers: 8,
      maxPlayers: 16,
    },
  });

  const badminton = await prisma.sport.create({
    data: {
      name: 'Badminton',
      slug: 'badminton',
      icon: '🏸',
      description: 'BWF certified synthetic & wooden indoor courts',
      minPlayers: 2,
      maxPlayers: 4,
    },
  });

  const tennis = await prisma.sport.create({
    data: {
      name: 'Tennis',
      slug: 'tennis',
      icon: '🎾',
      description: 'All-weather hard and clay tennis courts',
      minPlayers: 2,
      maxPlayers: 4,
    },
  });

  const basketball = await prisma.sport.create({
    data: {
      name: 'Basketball',
      slug: 'basketball',
      icon: '🏀',
      description: 'FIBA standard acrylic outdoor and indoor courts',
      minPlayers: 6,
      maxPlayers: 10,
    },
  });

  console.log('🏆 Created sports categories');

  // Helper for 7 days operating hours
  const generateOperatingHours = (venueId: string) =>
    [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      venueId,
      dayOfWeek,
      openTime: '06:00',
      closeTime: '23:00',
      isOpen: true,
    }));

  // 5. Create Approved Venue 1
  const venue1 = await prisma.venue.create({
    data: {
      ownerId: ownerUser1.id,
      name: 'Greenfield Sports Arena',
      slug: 'greenfield-sports-arena-mumbai',
      description:
        'Premier multi-sports facility equipped with FIFA 2-Star artificial turf, LED floodlights, professional dugout, and spacious locker rooms.',
      address: 'Plot 42, Link Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400053',
      latitude: 19.1363,
      longitude: 72.8277,
      contactPhone: '+91 9820098200',
      contactEmail: 'contact@greenfieldsports.in',
      facilities: ['Floodlights', 'Changing Rooms', 'Showers', 'Cafeteria', 'Ample Parking', 'First Aid', 'Drinking Water'],
      images: [
        'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
      ],
      status: VenueStatus.APPROVED,
      isFeatured: true,
    },
  });

  await prisma.operatingHours.createMany({ data: generateOperatingHours(venue1.id) });
  await prisma.venueSport.createMany({
    data: [
      { venueId: venue1.id, sportId: football.id },
      { venueId: venue1.id, sportId: cricket.id },
    ],
  });

  // Grounds for Venue 1
  const ground1A = await prisma.ground.create({
    data: {
      venueId: venue1.id,
      sportId: football.id,
      name: 'Main Football Turf (Pitch A - 7v7)',
      description: 'Full sized 7-a-side pitch with high density 50mm artificial grass and cool-fill rubber pellets.',
      surfaceType: 'FIFA 2-Star Artificial Turf',
      isIndoor: false,
      hourlyRate: 1400.0,
      minSlotDurationMinutes: 60,
      maxSlotDurationMinutes: 180,
    },
  });

  const ground1B = await prisma.ground.create({
    data: {
      venueId: venue1.id,
      sportId: cricket.id,
      name: 'Box Cricket Arena (Net 1)',
      description: 'High tension 30ft ceiling netted box cricket ground with astro-turf pitch.',
      surfaceType: 'AstroTurf Pro',
      isIndoor: false,
      hourlyRate: 900.0,
      minSlotDurationMinutes: 60,
      maxSlotDurationMinutes: 180,
    },
  });

  // 6. Create Approved Venue 2
  const venue2 = await prisma.venue.create({
    data: {
      ownerId: ownerUser2.id,
      name: 'Apex Turf & Sports Complex',
      slug: 'apex-turf-sports-complex-bangalore',
      description:
        'State-of-the-art sports arena in Koramangala offering world-class synthetic badminton courts and 5v5 football turf.',
      address: '80 Feet Road, 4th Block, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      contactPhone: '+91 9845098450',
      contactEmail: 'hello@apexturf.com',
      facilities: ['Indoor AC Courts', 'Locker Rooms', 'Pro Equipment Rental', 'Cafe', 'WiFi', 'Valet Parking'],
      images: [
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
      ],
      status: VenueStatus.APPROVED,
      isFeatured: true,
    },
  });

  await prisma.operatingHours.createMany({ data: generateOperatingHours(venue2.id) });
  await prisma.venueSport.createMany({
    data: [
      { venueId: venue2.id, sportId: football.id },
      { venueId: venue2.id, sportId: badminton.id },
      { venueId: venue2.id, sportId: tennis.id },
    ],
  });

  const ground2A = await prisma.ground.create({
    data: {
      venueId: venue2.id,
      sportId: football.id,
      name: 'Fast-Track 5v5 Turf',
      description: 'Shock-pad cushioned fast artificial turf for high octane 5-a-side games.',
      surfaceType: 'Monofilament Turf',
      isIndoor: false,
      hourlyRate: 1100.0,
      minSlotDurationMinutes: 60,
      maxSlotDurationMinutes: 180,
    },
  });

  const ground2B = await prisma.ground.create({
    data: {
      venueId: venue2.id,
      sportId: badminton.id,
      name: 'Yonex Badminton Court 1',
      description: 'BWF Grade 1 wooden cushioned synthetic badminton court with glare-free LED lighting.',
      surfaceType: 'Synthetic Polyurethane on Teak',
      isIndoor: true,
      hourlyRate: 450.0,
      minSlotDurationMinutes: 60,
      maxSlotDurationMinutes: 120,
    },
  });

  // 7. Create Approved Venue 3
  const venue3 = await prisma.venue.create({
    data: {
      ownerId: ownerUser1.id,
      name: 'Thunderbolt Arena',
      slug: 'thunderbolt-arena-hyderabad',
      description:
        'Sprawling sports destination in Hitec City featuring floodlit basketball courts, tennis courts, and football turfs.',
      address: 'Madhapur Main Road, Near Cyber Towers',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500081',
      latitude: 17.4483,
      longitude: 78.3915,
      contactPhone: '+91 9888877777',
      contactEmail: 'book@thunderboltarena.com',
      facilities: ['Floodlights', 'Washrooms', 'Sports Lounge', 'Coaching Available', 'Spectator Seating'],
      images: [
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
      ],
      status: VenueStatus.APPROVED,
      isFeatured: false,
    },
  });

  await prisma.operatingHours.createMany({ data: generateOperatingHours(venue3.id) });
  await prisma.venueSport.createMany({
    data: [
      { venueId: venue3.id, sportId: basketball.id },
      { venueId: venue3.id, sportId: tennis.id },
    ],
  });

  await prisma.ground.create({
    data: {
      venueId: venue3.id,
      sportId: basketball.id,
      name: 'Court 1 - Championship Basketball Court',
      description: 'Cushioned acrylic outdoor basketball court with breakaway rims and scoreboard.',
      surfaceType: 'Acrylic Hardcourt',
      isIndoor: false,
      hourlyRate: 750.0,
    },
  });

  // 8. Create a Pending Venue for Admin Approval Queue Testing
  const pendingVenue = await prisma.venue.create({
    data: {
      ownerId: ownerUser2.id,
      name: 'Champions Den Sports Club',
      slug: 'champions-den-sports-club',
      description:
        'Newly constructed multi-sport ground awaiting verification by admin. Top-tier box cricket and football.',
      address: 'Sector 29, Golf Course Road',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122002',
      latitude: 28.4682,
      longitude: 77.0637,
      contactPhone: '+91 9999988888',
      contactEmail: 'champions@den.com',
      facilities: ['Floodlights', 'Parking', 'Beverages'],
      images: [
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1200&q=80',
      ],
      status: VenueStatus.PENDING,
    },
  });

  await prisma.operatingHours.createMany({ data: generateOperatingHours(pendingVenue.id) });
  await prisma.venueSport.create({
    data: { venueId: pendingVenue.id, sportId: cricket.id },
  });

  await prisma.ground.create({
    data: {
      venueId: pendingVenue.id,
      sportId: cricket.id,
      name: 'Pitch 1 - Box Arena',
      surfaceType: 'AstroTurf',
      hourlyRate: 850.0,
    },
  });

  console.log('🏟️ Created venues and playable grounds');

  // 9. Create Sample Bookings and Reviews
  // Booking 1: Past completed booking
  const pastStart = new Date();
  pastStart.setDate(pastStart.getDate() - 3);
  pastStart.setUTCHours(18, 0, 0, 0);
  const pastEnd = new Date(pastStart);
  pastEnd.setUTCHours(19, 0, 0, 0);

  const pastBooking = await prisma.booking.create({
    data: {
      bookingNumber: 'TB-20261021-X9A2',
      customerId: customerUser.id,
      groundId: ground1A.id,
      startTime: pastStart,
      endTime: pastEnd,
      totalHours: 1.0,
      hourlyRate: 1400.0,
      subtotal: 1400.0,
      discount: 0,
      tax: 0,
      totalPrice: 1400.0,
      status: BookingStatus.COMPLETED,
    },
  });

  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-TB-20261021-X9A2',
      bookingId: pastBooking.id,
      amount: 1400.0,
      currency: 'INR',
      status: PaymentStatus.SUCCESS,
      transactionRef: 'SIM-992384210',
    },
  });

  await prisma.review.create({
    data: {
      bookingId: pastBooking.id,
      venueId: venue1.id,
      customerId: customerUser.id,
      rating: 5,
      comment:
        'Outstanding turf quality! The rubber infill was even, floodlights were super bright without glare, and staff was very helpful. Will book again next week!',
      isVerifiedStay: true,
    },
  });

  // Booking 2: Upcoming confirmed booking
  const futureStart = new Date();
  futureStart.setDate(futureStart.getDate() + 2);
  futureStart.setUTCHours(19, 0, 0, 0);
  const futureEnd = new Date(futureStart);
  futureEnd.setUTCHours(20, 0, 0, 0);

  const futureBooking = await prisma.booking.create({
    data: {
      bookingNumber: 'TB-20261026-F4R1',
      customerId: customerUser.id,
      groundId: ground2A.id,
      startTime: futureStart,
      endTime: futureEnd,
      totalHours: 1.0,
      hourlyRate: 1100.0,
      subtotal: 1100.0,
      discount: 0,
      tax: 0,
      totalPrice: 1100.0,
      status: BookingStatus.CONFIRMED,
      notes: 'Please keep football bibs ready for 10 players.',
    },
  });

  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-TB-20261026-F4R1',
      bookingId: futureBooking.id,
      amount: 1100.0,
      currency: 'INR',
      status: PaymentStatus.SUCCESS,
      transactionRef: 'SIM-992384999',
    },
  });

  // 10. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_SEEDED',
      resourceType: 'System',
      metadata: { seedVersion: '1.0', environment: 'development' },
    },
  });

  console.log('✅ TurfBook database seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Demo Credentials for Evaluation:');
  console.log('  Admin:    admin@turfbook.com    / Admin@123456');
  console.log('  Owner 1:  owner@turfbook.com    / Owner@123456');
  console.log('  Owner 2:  owner2@turfbook.com   / Owner@123456');
  console.log('  Customer: customer@turfbook.com / Customer@123456');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
