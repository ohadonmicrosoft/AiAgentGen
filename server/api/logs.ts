import express from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Schema for validating log entries
const LogEntrySchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  context: z.record(z.any()).optional(),
  timestamp: z.string().datetime(),
  tags: z.array(z.string()).optional(),
});

// Schema for validating metadata
const MetadataSchema = z.object({
  sessionId: z.string(),
  userId: z.string().nullable(),
  userAgent: z.string(),
  timestamp: z.string().datetime(),
  url: z.string().url(),
  appVersion: z.string(),
  environment: z.string(),
});

// Schema for validating the entire payload
const LogPayloadSchema = z.object({
  logs: z.array(LogEntrySchema),
  metadata: MetadataSchema,
});

// Schema for validating client-side error reports
const ClientErrorSchema = z.object({
  name: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  componentName: z.string().optional(),
  url: z.string(),
  timestamp: z.string().datetime(),
  category: z.string().optional(),
  status: z.number().optional(),
  endpoint: z.string().optional(),
  requestId: z.string().optional(),
});

// Ensure log directory exists
const LOG_DIR = path.join(process.cwd(), 'logs');
const ERROR_DIR = path.join(LOG_DIR, 'errors');

// Create the directories
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

if (!fs.existsSync(ERROR_DIR)) {
  fs.mkdirSync(ERROR_DIR, { recursive: true });
}

/**
 * Server-side log utilities
 */
export const serverLogger = {
  /**
   * Log a message to the server console and file
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      level,
      message,
      timestamp,
      metadata,
    };

    // Log to console
    const consoleMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    switch (level) {
      case 'debug':
        console.debug(consoleMessage, metadata || '');
        break;
      case 'info':
        console.info(consoleMessage, metadata || '');
        break;
      case 'warn':
        console.warn(consoleMessage, metadata || '');
        break;
      case 'error':
        console.error(consoleMessage, metadata || '');
        break;
    }

    // Log to file
    this.writeToFile(logEntry);
  },

  /**
   * Write a log entry to a file
   */
  writeToFile(logEntry: any, errorLog: boolean = false): void {
    try {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const logFile = errorLog 
        ? path.join(ERROR_DIR, `${date}-errors.log`)
        : path.join(LOG_DIR, `${date}.log`);
      const logLine = JSON.stringify(logEntry) + '\n';

      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  },

  /**
   * Log client-side logs to server
   */
  logClientLogs(logs: any[], metadata: any): void {
    logs.forEach((log) => {
      this.log(
        log.level,
        `[CLIENT] ${log.message}`,
        {
          clientMetadata: metadata,
          context: log.context,
          tags: log.tags,
        }
      );
    });
  },
  
  /**
   * Log client-side error to server
   */
  logClientError(error: any): void {
    const timestamp = new Date().toISOString();
    const errorEntry = {
      level: 'error',
      source: 'client',
      message: `[CLIENT ERROR] ${error.name}: ${error.message}`,
      timestamp,
      error,
    };
    
    // Log to console with limited data
    console.error(
      `[${timestamp}] [ERROR] [CLIENT] ${error.name}: ${error.message}`, 
      { 
        url: error.url,
        component: error.componentName,
        ...(error.status && { status: error.status }),
        ...(error.endpoint && { endpoint: error.endpoint }),
      }
    );
    
    // Write full details to error log
    this.writeToFile(errorEntry, true);
    
    // Also write to the regular log (but with less detail)
    this.log('error', `[CLIENT ERROR] ${error.name}: ${error.message}`, {
      url: error.url,
      component: error.componentName,
      errorType: error.name,
    });
    
    // TODO: Add error aggregation and alerting for critical errors
  },
};

/**
 * Create and configure the logs API router
 */
export function setupLogsRouter(): express.Router {
  const router = express.Router();

  // Endpoint to receive client-side logs
  router.post('/api/logs', (req, res) => {
    try {
      // Validate the request body
      const validationResult = LogPayloadSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        serverLogger.log('warn', 'Invalid log payload received', {
          errors: validationResult.error.errors,
          body: req.body,
        });
        
        return res.status(400).json({
          error: 'Invalid log payload',
          details: validationResult.error.errors,
        });
      }

      const { logs, metadata } = validationResult.data;
      
      // Log the client logs to the server
      serverLogger.logClientLogs(logs, metadata);
      
      // Respond with success
      return res.status(200).json({ success: true });
    } catch (error) {
      serverLogger.log('error', 'Error processing client logs', error);
      return res.status(500).json({ error: 'Failed to process logs' });
    }
  });
  
  // Endpoint to receive client-side error reports
  router.post('/api/logs/client-error', (req, res) => {
    try {
      // Validate the request body
      const validationResult = ClientErrorSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        serverLogger.log('warn', 'Invalid client error payload received', {
          errors: validationResult.error.errors,
          body: req.body,
        });
        
        return res.status(400).json({
          error: 'Invalid error payload',
          details: validationResult.error.errors,
        });
      }

      const errorData = validationResult.data;
      
      // Log the client error to the server
      serverLogger.logClientError(errorData);
      
      // Respond with success
      return res.status(200).json({ success: true });
    } catch (error) {
      serverLogger.log('error', 'Error processing client error report', error);
      return res.status(500).json({ error: 'Failed to process error report' });
    }
  });

  return router;
}

// Direct server-side logging API
export const logger = {
  debug: (message: string, metadata?: any) => serverLogger.log('debug', message, metadata),
  info: (message: string, metadata?: any) => serverLogger.log('info', message, metadata),
  warn: (message: string, metadata?: any) => serverLogger.log('warn', message, metadata),
  error: (message: string, metadata?: any) => serverLogger.log('error', message, metadata),
}; 