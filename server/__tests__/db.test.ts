import { jest } from '@jest/globals';

// Mock postgres module
jest.mock('postgres', () => {
  const mockSql = jest.fn();
  mockSql.mockReturnValue({
    // Mock basic query methods
    query: jest.fn(),
    unsafe: jest.fn(),
    begin: jest.fn(),
    end: jest.fn(),
  });
  return mockSql;
});

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
});

afterEach(() => {
  process.env = originalEnv;
});

// Mock logger
jest.mock('../lib/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('Database Connection', () => {
  it('should create a connection pool with improved settings', async () => {
    // Import the postgres mock
    const postgres = require('postgres');

    // Import the db module (which will use our mocked postgres)
    const { getPool } = require('../db');

    // Call getPool to initialize the connection
    await getPool();

    // Verify postgres was called with improved settings
    expect(postgres).toHaveBeenCalledWith(
      'postgres://user:pass@localhost:5432/testdb',
      expect.objectContaining({
        max: expect.any(Number),
        idle_timeout: expect.any(Number),
        connect_timeout: 20,
        max_lifetime: 60 * 60,
        prepare: false,
        connection: {
          application_name: 'ai-agent-generator',
        },
        onretry: expect.any(Function),
      }),
    );
  });

  it('should retry connection on failure', async () => {
    // Mock postgres to fail on first attempt
    const postgres = require('postgres');
    postgres.mockImplementationOnce(() => {
      throw new Error('Connection failed');
    });

    // Second attempt succeeds
    postgres.mockImplementationOnce(() => ({
      query: jest.fn(),
      unsafe: jest.fn(),
      begin: jest.fn(),
      end: jest.fn(),
    }));

    // Import the db module
    const { getPool } = require('../db');

    // Call getPool which should retry
    const pool = await getPool();

    // Verify postgres was called twice
    expect(postgres).toHaveBeenCalledTimes(2);
    expect(pool).toBeDefined();
  });

  it('should throw after max retry attempts', async () => {
    // Mock postgres to always fail
    const postgres = require('postgres');
    postgres.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    // Import the db module
    const { getPool } = require('../db');

    // Call getPool which should eventually fail
    await expect(getPool()).rejects.toThrow();
  });

  it('should use SSL when configured', async () => {
    // Set SSL to true
    process.env.DATABASE_SSL = 'true';

    // Import the postgres mock
    const postgres = require('postgres');

    // Import the db module
    const { getPool } = require('../db');

    // Call getPool
    await getPool();

    // Verify SSL was enabled
    expect(postgres).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ssl: true,
      }),
    );
  });

  it('should disable SSL when not configured', async () => {
    // Set SSL to false
    process.env.DATABASE_SSL = 'false';

    // Import the postgres mock
    const postgres = require('postgres');

    // Import the db module
    const { getPool } = require('../db');

    // Call getPool
    await getPool();

    // Verify SSL was disabled
    expect(postgres).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ssl: false,
      }),
    );
  });

  it('should handle connection parameters', async () => {
    // Import the postgres mock
    const postgres = require('postgres');

    // Create a mock for the onparameter callback
    let parameterCallback: Function | null = null;
    postgres.mockImplementationOnce((url, options) => {
      // Capture the onparameter callback
      parameterCallback = options.onparameter;
      return {
        query: jest.fn(),
        unsafe: jest.fn(),
        begin: jest.fn(),
        end: jest.fn(),
      };
    });

    // Import the db module
    const { getPool } = require('../db');
    const logger = require('../lib/logger');

    // Call getPool
    await getPool();

    // Verify the onparameter callback was captured
    expect(parameterCallback).toBeDefined();

    // Call the onparameter callback
    if (parameterCallback) {
      parameterCallback('timezone', 'UTC');
    }

    // Verify logger.debug was called
    expect(logger.debug).toHaveBeenCalledWith(
      'Postgres parameter change:',
      expect.objectContaining({
        key: 'timezone',
        value: 'UTC',
      }),
    );
  });

  it('should handle notices', async () => {
    // Import the postgres mock
    const postgres = require('postgres');

    // Create a mock for the onnotice callback
    let noticeCallback: Function | null = null;
    postgres.mockImplementationOnce((url, options) => {
      // Capture the onnotice callback
      noticeCallback = options.onnotice;
      return {
        query: jest.fn(),
        unsafe: jest.fn(),
        begin: jest.fn(),
        end: jest.fn(),
      };
    });

    // Import the db module
    const { getPool } = require('../db');
    const logger = require('../lib/logger');

    // Call getPool
    await getPool();

    // Verify the onnotice callback was captured
    expect(noticeCallback).toBeDefined();

    // Call the onnotice callback
    if (noticeCallback) {
      noticeCallback({ message: 'Test notice' });
    }

    // Verify logger.debug was called
    expect(logger.debug).toHaveBeenCalledWith(
      'Postgres notice:',
      expect.objectContaining({
        notice: 'Test notice',
      }),
    );
  });
});
