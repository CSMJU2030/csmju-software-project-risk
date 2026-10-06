import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const message = typeof raw === 'string'
      ? raw
      : (raw as { message?: string | string[] } | null)?.message;
    const details = Array.isArray(message) ? message : message ? [message] : [];

    const code = this.errorCode(status);
    const safeMessage = status >= 500
      ? (status === 503 ? 'Service temporarily unavailable' : 'Internal server error')
      : details[0] ?? this.defaultMessage(status);

    if (status === 429 || status === 503) {
      response.setHeader('Retry-After', '5');
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message: safeMessage,
        ...(details.length > 1 ? { details } : {}),
      },
    });
  }

  private errorCode(status: number) {
    const codes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'TOO_MANY_REQUESTS',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codes[status] ?? 'INTERNAL_ERROR';
  }

  private defaultMessage(status: number) {
    const messages: Record<number, string> = {
      400: 'Request validation failed',
      401: 'Missing or invalid token',
      403: 'You do not have permission to perform this action',
      404: 'Resource not found',
      409: 'Request conflicts with the current data',
    };
    return messages[status] ?? 'Request failed';
  }
}
