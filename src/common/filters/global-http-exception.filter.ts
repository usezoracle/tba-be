import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract message from exception response
    let message: string;
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      message = (exceptionResponse as any).message || exceptionResponse.toString();
    } else {
      message = 'An error occurred';
    }

    // Handle validation errors specifically
    if (status === HttpStatus.BAD_REQUEST && Array.isArray((exceptionResponse as any).message)) {
      message = (exceptionResponse as any).message.join(', ');
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
