import { MediaFile } from '../../backend/src/entities/MediaFile';

export type RootState = {
  files: MediaFile[],
  types: string[],
  buckets: string[],
  message: string | null,
  selectedStorageType: string[] | null,
  selectedBucket: string | null,
};
