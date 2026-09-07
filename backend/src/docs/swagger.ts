export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'PyroGuard AI - Industrial Fire & Thermal Detection API',
    version: '1.0.0',
    description:
      'Production REST API for AI-based detection, classification, and spatio-temporal monitoring of industrial fires, gas flares, and persistent thermal sources using NASA FIRMS and OpenStreetMap intelligence.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password', 'fullName'],
                properties: {
                  username: { type: 'string', example: 'fire_officer_1' },
                  email: { type: 'string', example: 'officer@refinery.com' },
                  password: { type: 'string', example: 'SecurePass@2026' },
                  fullName: { type: 'string', example: 'Cmdr. John Miller' },
                  role: { type: 'string', enum: ['ANALYST', 'ADMIN'], example: 'ANALYST' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User successfully registered' },
          400: { description: 'Validation error' },
          409: { description: 'User already exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@pyroguard.ai' },
                  password: { type: 'string', example: 'Admin@12345' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful with JWT token' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/detections/analyze': {
      post: {
        summary: 'Analyze a thermal anomaly coordinate via AI/ML model',
        tags: ['Detections & GIS'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lat', 'lon', 'brightness', 'frp'],
                properties: {
                  lat: { type: 'number', example: 22.3619 },
                  lon: { type: 'number', example: 69.8318 },
                  brightness: { type: 'number', example: 450.0 },
                  frp: { type: 'number', example: 310.0 },
                  daynight: { type: 'string', enum: ['D', 'N'], example: 'N' },
                  confidence: { type: 'string', example: 'high' },
                  satellite: { type: 'string', example: 'VIIRS-SNPP' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Thermal anomaly classified with explainable indicators' },
          400: { description: 'Invalid parameters' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/detections': {
      get: {
        summary: 'List paginated thermal detections with search and filters',
        tags: ['Detections & GIS'],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'classification', in: 'query', schema: { type: 'string' } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of detections' },
        },
      },
    },
    '/api/detections/facilities': {
      get: {
        summary: 'Get list of registered critical industrial facilities',
        tags: ['Detections & GIS'],
        responses: {
          200: { description: 'List of facilities' },
        },
      },
    },
    '/api/analytics/summary': {
      get: {
        summary: 'Get aggregated platform analytics and detection metrics',
        tags: ['Analytics'],
        responses: {
          200: { description: 'Summary statistics, risk tiers, and trends' },
        },
      },
    },
    '/api/admin/health': {
      get: {
        summary: 'Get backend, database, and ML service health status',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'System health report' },
          403: { description: 'Forbidden (Admin only)' },
        },
      },
    },
  },
};
