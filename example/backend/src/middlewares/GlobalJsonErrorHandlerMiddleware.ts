import * as Sentry from '@sentry/node';
import Express from 'express';
import {
  Err,
  GlobalErrorHandlerMiddleware,
  IMiddlewareError,
  IResponseError,
  OverrideProvider,
  Request,
  Response,
} from '@tsed/common';
import { Exception } from 'ts-httpexceptions';
import { DescribedError } from '../types';
import { isProduction } from '../env';

@OverrideProvider(GlobalErrorHandlerMiddleware)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class GlobalJsonErrorHandlerMiddleware implements IMiddlewareError {
  public use(
    @Err() error: any,
    @Request() request: Express.Request,
    @Response() response: Express.Response,
  ): any {
    this.setHeaders(response, error, error.origin);

    const description = this.deconstructError(error);

    const responseData = {
      ...description,
      stack: description.stacktrace && isProduction() ? description.stacktrace : undefined,
    };

    response
      .status(description.status)
      .send({
        ...responseData,
        error: true,
      });

    if (description.status === 500) {
      Sentry.captureEvent({
        message: error.message,
        stacktrace: error.stacktrace,
        level: Sentry.Severity.Error,
        request: {
          url: request.url,
          method: request.method,
          data: request.body,
          headers: request.headers as { [key in string]: string },
        },
      });

      request.log.error({
        error: {
          message: error.message,
          stacktrace: error.stacktrace,
          status: error.status,
          origin: error.origin,
        },
      });
    } else {
      request.log.info({
        error: {
          message: error.message,
          stacktrace: error.stacktrace,
          status: error.status,
          origin: error.origin,
        },
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setHeaders(response: Express.Response, ...args: IResponseError[]): void {
    response.setHeader('Content-Type', 'application/json');
  }

  private deconstructError(error: any): DescribedError {
    if (error instanceof Exception || error.status) {
      return {
        status: error.status,
        message: error.message,
        type: error.type,
        stacktrace: error.stack,
      };
    }

    if (typeof error === 'string') {
      return {
        status: 500,
        message: error,
      };
    }

    if (isProduction()) {
      return {
        status: 500,
        message: 'Internal error',
      };
    }

    return {
      status: 500,
      message: error.message ? error.message : `Unknown error (${error.toString()})`,
    };
  }
}
