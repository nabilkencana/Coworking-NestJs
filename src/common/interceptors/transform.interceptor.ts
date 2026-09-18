import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const http = context.switchToHttp();
    const response = http.getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((res) => {
        let message = 'Berhasil memproses permintaan';
        let data: any = res;

        if (res && typeof res === 'object') {
          if ('message' in res && typeof res.message === 'string') {
            message = res.message;
            if ('data' in res) {
              data = res.data;
            } else {
              const { message: _, ...rest } = res;
              data = Object.keys(rest).length > 0 ? rest : null;
            }
          }
        }

        return {
          status: true,
          statusCode,
          message,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
