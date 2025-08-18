import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { API_MESSAGE_KEY } from './api-message.decorator';

export function ApiStandardResponses(includeCreated = false) {
  const decorators = [
    ApiResponse({ 
      status: 200, 
      description: 'Success',
      schema: {
        example: {
          success: true,
          message: 'Success message from @ApiMessage decorator',
          data: {}
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: 'Bad Request - Validation or business logic error',
      schema: {
        example: {
          success: false,
          message: 'Validation error message',
          data: null,
          statusCode: 400,
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      }
    }),
    ApiResponse({ 
      status: 404, 
      description: 'Not Found - Resource not found',
      schema: {
        example: {
          success: false,
          message: 'Resource not found',
          data: null,
          statusCode: 404,
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      }
    }),
    ApiResponse({ 
      status: 500, 
      description: 'Internal Server Error - Unexpected server error',
      schema: {
        example: {
          success: false,
          message: 'Internal server error',
          data: null,
          statusCode: 500,
          timestamp: '2024-01-15T10:30:00.000Z'
        }
      }
    }),
  ];

  // Add 201 for creation endpoints
  if (includeCreated) {
    decorators.unshift(
      ApiResponse({ 
        status: 201, 
        description: 'Created successfully',
        schema: {
          example: {
            success: true,
            message: 'Created successfully',
            data: {}
          }
        }
      })
    );
  }

  return applyDecorators(...decorators);
}
