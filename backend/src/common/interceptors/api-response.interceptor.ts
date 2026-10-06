import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    return next.handle().pipe(
      map((result) => {
        if (result === undefined) return result;

        if (this.isPreparedResponse(result)) {
          return {
            success: true as const,
            data: result.data,
            meta: result.meta,
          };
        }

        return {
          success: true as const,
          data: result,
        };
      }),
    );
  }

  private isPreparedResponse(value: unknown): value is { data: T; meta: Record<string, unknown> } {
    return !!value && typeof value === 'object' && 'data' in value && 'meta' in value;
  }
}

