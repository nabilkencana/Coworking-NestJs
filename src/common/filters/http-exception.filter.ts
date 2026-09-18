import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Terjadi kesalahan pada server';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name.replace('Exception', '');
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as any;
        if (Array.isArray(resObj.message)) {
          message = resObj.message.join(', ');
        } else if (resObj.message) {
          message = resObj.message;
        }

        if (resObj.error) {
          error = resObj.error;
        } else {
          error = exception.name.replace('Exception', '');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(statusCode).json({
      status: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
