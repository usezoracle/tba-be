import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';

export const createPinoConfig = (configService: ConfigService): Params => {
  const isDevelopment = configService.get('NODE_ENV') !== 'production';
  const logLevel = configService.get('LOG_LEVEL') || (isDevelopment ? 'debug' : 'info');

  return {
    pinoHttp: {
      level: logLevel,
      // Use pretty printing in development, structured JSON in production
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
              singleLine: false,
              messageFormat: '{context} {msg}',
            },
          }
        : undefined,
      
      // Custom formatters for better log structure
      formatters: {
        level: (label: string) => ({ level: label }),
        log: (object: any) => {
          // Add correlation ID if available
          const correlationId = object.correlationId || object.req?.headers?.['x-correlation-id'];
          if (correlationId) {
            object.correlationId = correlationId;
          }
          return object;
        },
      },
      
      // ISO timestamp for consistency
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
      
      // Request/Response serializers for HTTP logging
      serializers: {
        req: (req: any) => ({
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'x-correlation-id': req.headers['x-correlation-id'],
          },
          remoteAddress: req.remoteAddress,
          remotePort: req.remotePort,
        }),
        res: (res: any) => ({
          statusCode: res.statusCode,
          headers: {
            'content-type': res.headers?.['content-type'],
          },
        }),
        err: (err: any) => ({
          type: err.type,
          message: err.message,
          stack: err.stack,
          code: err.code,
        }),
      },
      
      // Async logging for better performance (non-blocking)
      // sync: false, // This property is not supported in current version
      
      // Custom log levels
      customLevels: {
        audit: 35, // Between info (30) and warn (40)
      },
      
      // Redact sensitive information
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },
      
      // Auto-logging for HTTP requests
      autoLogging: {
        ignore: (req: any) => {
          // Don't log health check requests to reduce noise
          return req.url === '/health' || req.url === '/api/v1/health';
        },
      },
    },
  };
};