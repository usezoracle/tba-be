import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, NextFunction, Response } from 'express';

// TODO: Implement device info functionality when needed
// This middleware is currently disabled as it requires additional dependencies

@Injectable()
export class DeviceInfoMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Basic device info extraction without external dependencies
    const userAgent = req.headers['user-agent'] || 'unknown';
    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    const realIp =
      forwardedFor?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip;
    const ipAddress = realIp === '::1' ? '127.0.0.1' : realIp;

    // Store basic device info in request
    req['deviceInfo'] = {
      userAgent,
      ipAddress,
      timestamp: new Date().toISOString(),
    };

    next();
  }
}
