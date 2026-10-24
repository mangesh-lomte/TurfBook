export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'TurfBook REST API',
    version: '1.0.0',
    description:
      'TurfBook Sports Turf Booking & Management Platform API Documentation. Features include multi-role auth, venue discovery, PostgreSQL GiST exclusion-backed concurrency-safe booking engine, and real analytics.',
    contact: {
      name: 'TurfBook Engineering Team',
      email: 'support@turfbook.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      CookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: { description: 'Server and PostgreSQL connection healthy' },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new customer or owner account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', example: 'alex@example.com' },
                  password: { type: 'string', example: 'Player@123' },
                  fullName: { type: 'string', example: 'Alex Smith' },
                  phone: { type: 'string', example: '+91 9876543210' },
                  role: { type: 'string', enum: ['CUSTOMER', 'OWNER'], default: 'CUSTOMER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'customer@turfbook.com' },
                  password: { type: 'string', example: 'Customer@123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logged in successfully' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'User profile retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/venues': {
      get: {
        summary: 'Explore venues with filters and search',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'city', in: 'query', schema: { type: 'string' } },
          { name: 'sport', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: { description: 'List of venues' },
        },
      },
      post: {
        summary: 'Create a new venue (Owner / Admin)',
        security: [{ BearerAuth: [] }],
        responses: {
          201: { description: 'Venue created' },
        },
      },
    },
    '/venues/{id}': {
      get: {
        summary: 'Get detailed venue profile with grounds and hours',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Venue details' },
          404: { description: 'Venue not found' },
        },
      },
    },
    '/grounds/{id}/availability': {
      get: {
        summary: 'Get real-time slot availability for a ground on a given date',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', required: true, schema: { type: 'string', example: '2026-10-25' } },
        ],
        responses: {
          200: { description: 'Available and booked slots' },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Create a new slot booking (Protected with PostgreSQL GiST exclusion constraint against double bookings)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['groundId', 'startTime', 'endTime'],
                properties: {
                  groundId: { type: 'string', format: 'uuid' },
                  startTime: { type: 'string', format: 'date-time' },
                  endTime: { type: 'string', format: 'date-time' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Booking confirmed' },
          409: { description: 'Conflict: Slot already booked or overlapping' },
        },
      },
    },
    '/bookings/my': {
      get: {
        summary: 'Get all bookings for the authenticated customer',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Booking history' },
        },
      },
    },
    '/bookings/{id}/cancel': {
      post: {
        summary: 'Cancel an eligible booking and restore slot availability',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Booking cancelled' },
        },
      },
    },
    '/owner/overview': {
      get: {
        summary: 'Get owner analytics and revenue metrics',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Owner dashboard metrics' },
        },
      },
    },
    '/admin/overview': {
      get: {
        summary: 'Get platform-wide admin metrics',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Admin platform metrics' },
        },
      },
    },
  },
};
