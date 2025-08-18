import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_MESSAGE_KEY } from '../decorators/api-message.decorator';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, any>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const message = this.reflector.get<string>(API_MESSAGE_KEY, context.getHandler()) || 'Request successful';

    return next.handle().pipe(
      map((data: any) => {
        // If data already has the standard structure (message and data), return as-is
        if (data && typeof data === 'object' && 'message' in data && 'data' in data && !('success' in data)) {
          return {
            success: true,
            ...data
          };
        }

        // Check if this is a service response that needs wrapping
        if (data && typeof data === 'object' && 'data' in data && !('message' in data)) {
          // This is a service response with data, wrap it with controller message
          const { data: serviceData, ...rest } = data;
          return {
            success: true,
            message,
            data: serviceData,
            ...rest, // Preserve pagination and other metadata
          };
        }

        // Otherwise, wrap in standard format with controller message
        return {
          success: true,
          message,
          data: data,
        };
      }),
    );
  }
}
