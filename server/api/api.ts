import express from 'express';
import { checkAuthenticated } from '../middleware';

/**
 * Sets up the main API router with all API endpoints
 */
export function setupApiRouter() {
  const router = express.Router();

  // Protected routes that require authentication
  router.get('/api/user', checkAuthenticated, (req, res) => {
    res.json({ user: req.user });
  });

  // Example endpoints for demonstration
  router.get('/api/agents', checkAuthenticated, (req, res) => {
    res.json({ agents: [] });
  });

  router.get('/api/prompts', checkAuthenticated, (req, res) => {
    res.json({ prompts: [] });
  });

  router.get('/api/conversations', checkAuthenticated, (req, res) => {
    res.json({ conversations: [] });
  });

  return router;
}
