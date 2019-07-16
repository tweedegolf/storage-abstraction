import { MediaFile } from '../../backend/src/entities/MediaFile';

export type RootState = {
  files: MediaFile[],
  types: string[],
  buckets: string[],
  message: string | null,
  selectedStorageId: string | null,
  selectedBucket: string | null,
};

export type ServerError = {
  error: string;
};
