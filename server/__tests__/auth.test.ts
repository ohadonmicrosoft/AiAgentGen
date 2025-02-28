import express from 'express';
import request from 'supertest';
import { setupAuth } from '../auth';
import { storage } from '../storage';

// Mock dependencies
jest.mock('../storage', () => ({
  storage: {
    getUserByUsername: jest.fn(),
    createUser: jest.fn(),
  },
}));

// Setup test app
const app = express();
setupAuth(app);

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 if username already exists', async () => {
      // Mock that the user already exists
      (storage.getUserByUsername as jest.Mock).mockResolvedValue({
        id: 1,
        username: 'existinguser',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'existinguser', password: 'password123' });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Username already exists');
      expect(storage.getUserByUsername).toHaveBeenCalledWith('existinguser');
    });

    it('should register a new user successfully', async () => {
      // Mock that the user doesn't exist yet
      (storage.getUserByUsername as jest.Mock).mockResolvedValue(null);

      // Mock successful user creation
      (storage.createUser as jest.Mock).mockResolvedValue({
        id: 2,
        username: 'newuser',
        role: 'creator',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 2);
      expect(response.body).toHaveProperty('username', 'newuser');
      expect(response.body).toHaveProperty('role', 'creator');
      expect(response.body).not.toHaveProperty('password');

      expect(storage.getUserByUsername).toHaveBeenCalledWith('newuser');
      expect(storage.createUser).toHaveBeenCalledWith({
        username: 'newuser',
        password: expect.any(String), // Hashed password
        role: 'creator', // Default role
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if credentials are missing', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    // Add more login tests as needed
  });
});
