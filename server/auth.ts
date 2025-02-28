import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { User as SelectUser } from '@shared/schema';
import { Express } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { storage } from './storage';

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Flag to identify if we're in development testing mode
const isDevelopmentTesting = !process.env.DATABASE_URL || process.env.USE_MOCK_STORAGE === 'true';

async function hashPassword(password: string) {
  // In testing mode, use a simplified format that's easier to work with
  if (isDevelopmentTesting) {
    console.log('[Auth] Using simplified password hashing for testing');
    const salt = 'mocktestsalt';
    const hash = password + salt;
    return `${hash}.${salt}`;
  }

  // In production mode, use secure hashing
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // In testing mode, use simplified comparison
  if (isDevelopmentTesting) {
    console.log('[Auth] Using simplified password comparison for testing');
    const [hash, salt] = stored.split('.');
    return hash === supplied + salt;
  }

  // In production mode, use secure comparison
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Define more robust session settings
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'ai-agent-generator-secret',
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    rolling: true, // Reset cookie expiration on each response
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
      httpOnly: true, // Prevents client-side JS from reading cookie
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      sameSite: 'lax', // Helps against CSRF attacks
    },
    store: storage.sessionStore,
    name: 'aiagent.sid', // Custom session name instead of default
  };

  // Properly handle proxy headers when behind a reverse proxy
  app.set('trust proxy', 1);

  // Set up session middleware
  app.use(session(sessionSettings));

  // Initialize passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Log session events for diagnostics
  console.log('[Auth] Session store initialized');

  // Monitor session store health (with type safety)
  if (storage.sessionStore && typeof storage.sessionStore.on === 'function') {
    try {
      // Use explicit type annotation to avoid TypeScript error
      type ErrorCallback = (error: Error) => void;
      const errorHandler: ErrorCallback = (error) => {
        console.error('[Auth] Session store error:', error);
      };

      storage.sessionStore.on('error', errorHandler);
    } catch (err) {
      console.warn('[Auth] Session store does not support event listeners');
    }
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post('/api/register', async (req, res, next) => {
    console.log('[Auth] Register attempt:', req.body.username);
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      console.log('[Auth] Registration failed: Username already exists');
      return res.status(400).send('Username already exists');
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    console.log('[Auth] User created with ID:', user.id);

    req.login(user, (err) => {
      if (err) {
        console.error('[Auth] Login after registration failed:', err);
        return next(err);
      }
      console.log('[Auth] Login after registration successful');
      res.status(201).json(user);
    });
  });

  app.post('/api/login', (req, res, next) => {
    console.log('[Auth] Login attempt:', req.body.username);
    passport.authenticate('local', (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        console.error('[Auth] Login error:', err);
        return next(err);
      }

      if (!user) {
        console.log('[Auth] Login failed: Invalid credentials');
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.login(user, (err) => {
        if (err) {
          console.error('[Auth] Session login failed:', err);
          return next(err);
        }
        console.log('[Auth] Login successful for user:', user.username);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res, next) => {
    console.log('[Auth] Logout attempt');
    req.logout((err) => {
      if (err) {
        console.error('[Auth] Logout error:', err);
        return next(err);
      }
      console.log('[Auth] Logout successful');
      res.sendStatus(200);
    });
  });

  app.get('/api/user', (req, res) => {
    console.log('[Auth] Get user check - is authenticated:', req.isAuthenticated());
    if (req.isAuthenticated()) {
      console.log('[Auth] User data returned:', req.user.username);
      return res.json(req.user);
    }
    return res.sendStatus(401);
  });

  // Developer login endpoint - for easy testing only
  app.post('/api/devlogin', async (req, res, next) => {
    console.log('[Auth] Developer login');

    // Try to find the developer user
    let user = await storage.getUserByUsername('developer');

    // If developer user doesn't exist, create one
    if (!user) {
      console.log('[Auth] Creating developer user');
      user = await storage.createUser({
        username: 'developer',
        password: await hashPassword('password'),
        email: 'dev@example.com',
      });
    }

    // Log in
    req.login(user, (err) => {
      if (err) {
        console.error('[Auth] Developer login failed:', err);
        return next(err);
      }
      console.log('[Auth] Developer login successful');
      return res.status(200).json(user);
    });
  });
}
