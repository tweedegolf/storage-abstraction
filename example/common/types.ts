export interface DescribedError {
  status: number;
  message: string;
  type?: string;
  stacktrace?: any;
}

export type ResError = { error: true } & DescribedError;

export interface ResSuccess<T> {
  error: false;
  data: T;
}

export type ResResult<T> = ResError | ResSuccess<T>;
