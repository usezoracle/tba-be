import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';

export const createPinoConfig = (configService: ConfigService): Params => {
  const isDevelopment = configService.get('NODE_ENV') !== 'production';
  const logLevel =
    configService.get('LOG_LEVEL') || (isDevelopment ? 'warn' : 'info');

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
          const correlationId =
            object.correlationId || object.req?.headers?.['x-correlation-id'];
          if (correlationId) {
            object.correlationId = correlationId;
          }
          return object;
        },
      },

      // ISO timestamp for consistency
      timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

      // Simplified request/response serializers for HTTP logging
      serializers: {
        req: (req: any) => ({
          method: req.method,
          url: req.url,
          // Only log essential headers
          headers: {
            'user-agent': req.headers['user-agent'],
          },
        }),
        res: (res: any) => ({
          statusCode: res.statusCode,
        }),
        err: (err: any) => ({
          type: err.type,
          message: err.message,
          code: err.code,
        }),
      },

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

      // Disable auto-logging to reduce noise
      autoLogging: false,
    },
  };
};
