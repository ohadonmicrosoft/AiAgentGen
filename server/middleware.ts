import { Request, Response, NextFunction } from "express";
import { Permission, PERMISSIONS, ROLES } from "@shared/schema";
import { storage } from "./storage";

// Authentication middleware
export function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
}

// Permission middleware creator
export function checkPermission(requiredPermission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const userId = req.user!.id;
      const hasPermission = await storage.hasPermission(userId, requiredPermission);
      
      if (hasPermission) {
        return next();
      } else {
        console.warn(`[Permission] User ${userId} denied access to ${requiredPermission}`);
        return res.status(403).json({ 
          error: "Forbidden", 
          message: "You do not have permission to perform this action" 
        });
      }
    } catch (error) {
      console.error("[Permission] Error checking permissions:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Middleware to check if user is admin
export function checkAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (req.user!.role === ROLES.ADMIN) {
    return next();
  }
  
  return res.status(403).json({ 
    error: "Forbidden", 
    message: "This action requires administrator privileges" 
  });
}

// Middleware to check if user owns a resource or has permission to manage any
export function checkResourceOwnership(resourceType: 'agent' | 'prompt', anyPermission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userId = req.user!.id;
    const resourceId = parseInt(req.params.id);
    
    if (isNaN(resourceId)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }
    
    try {
      // Check if the user has permission to manage any resource
      const hasAnyPermission = await storage.hasPermission(userId, anyPermission);
      if (hasAnyPermission) {
        return next();
      }
      
      // Check if the user owns the resource
      let resource;
      if (resourceType === 'agent') {
        resource = await storage.getAgent(resourceId);
      } else {
        resource = await storage.getPrompt(resourceId);
      }
      
      if (!resource) {
        return res.status(404).json({ error: `${resourceType} not found` });
      }
      
      if (resource.userId === userId) {
        return next();
      }
      
      return res.status(403).json({ 
        error: "Forbidden", 
        message: "You do not have permission to access this resource" 
      });
    } catch (error) {
      console.error(`[Permission] Error checking ${resourceType} ownership:`, error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}