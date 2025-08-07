import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getAppInfo() {
    return {
      name: 'Zora TBA Coins API',
      version: '1.0.0',
      description: 'Production-grade API for Zora and TBA token data',
      environment: this.configService.get('NODE_ENV'),
      timestamp: new Date().toISOString(),
    };
  }
}
