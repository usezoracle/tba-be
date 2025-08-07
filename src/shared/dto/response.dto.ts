import { ApiProperty } from '@nestjs/swagger';

export interface SuccessResponse<T = any> {
  status: 'success';
  message?: string;
  data: T;
  meta?: any;
}

export interface ErrorResponse {
  status: 'error';
  error: {
    message: string;
    errorType: string;
  };
}

export class HealthResponseDto {
  @ApiProperty({
    description: 'Response status',
    example: 'success',
  })
  status: 'success';

  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({
    description: 'Health data',
    type: Object,
  })
  data: {
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    dependencies?: {
      redis?: { status: string; latency?: number };
    };
    system?: {
      memory: any;
      cpu: any;
      platform: string;
      nodeVersion: string;
    };
  };
}
