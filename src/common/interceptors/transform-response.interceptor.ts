import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SuccessResponse } from '../../shared/dto/response.dto';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data: any) => {
        const message = data?.message || 'success';
        const meta = data?.meta;
        const payload = data?.data !== undefined ? data.data : data;

        const response: SuccessResponse<T> = {
          status: 'success',
          message,
          data: payload,
        };

        if (meta) {
          response.meta = meta;
        }

        return response;
      }),
    );
  }
}
