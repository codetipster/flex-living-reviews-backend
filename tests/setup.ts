// Test setup file
import 'reflect-metadata';

// Mock environment variables for testing
// Use bracket notation to satisfy TypeScript strict mode
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3001';
process.env['CLIENT_URL'] = 'http://localhost:5173';
process.env['API_BASE_URL'] = 'http://localhost:3001';

// Global test utilities
global.console = {
  ...console,
  // Suppress console output during tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now() for consistent timestamps in tests
const mockDate = new Date('2024-01-01T00:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());
global.Date = jest.fn(() => mockDate) as any;
global.Date.UTC = Date.UTC;
global.Date.parse = Date.parse;