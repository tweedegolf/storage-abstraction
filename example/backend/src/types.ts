export interface BaseMediaFile {
  id: number;
  path: string;
  size: number;
  name: string;
}

export interface DescribedError {
  status: number;
  message: string;
  type?: string;
  stacktrace?: any;
}

export interface When {
  created: Date;
  updated: Date;
}
