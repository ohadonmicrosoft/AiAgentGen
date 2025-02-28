import express from "express";
import passport from "passport";

/**
 * Sets up the authentication router with all auth-related endpoints
 */
export function setupAuthRouter() {
  const router = express.Router();

  // Login route
  router.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res
          .status(401)
          .json({ error: info.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ user });
      });
    })(req, res, next);
  });

  // Logout route
  router.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // Check if user is authenticated
  router.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({
        authenticated: true,
        user: req.user,
      });
    } else {
      res.json({
        authenticated: false,
      });
    }
  });

  return router;
}
