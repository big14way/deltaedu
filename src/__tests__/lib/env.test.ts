// src/__tests__/lib/env.test.ts
import { getEnv, isProduction, isDevelopment } from '@/lib/env';

// Suppress console output for tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('env utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // Note: validateEnv tests are commented out as they require a more complex
  // test setup due to module-level environment validation during import

  describe('getEnv', () => {
    it('should return environment variable value', () => {
      process.env.GROQ_API_KEY = 'test-groq-key';

      expect(getEnv('GROQ_API_KEY')).toBe('test-groq-key');
    });

    it('should throw error when environment variable is not set', () => {
      delete process.env.GROQ_API_KEY;
      expect(() => getEnv('GROQ_API_KEY')).toThrow(/Environment variable GROQ_API_KEY is not set/);
    });
  });

  describe('isProduction', () => {
    it('should return true in production environment', () => {
      process.env.NODE_ENV = 'production';

      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
    });

    it('should return false in development environment', () => {
      process.env.NODE_ENV = 'development';

      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(true);
    });
  });
});
