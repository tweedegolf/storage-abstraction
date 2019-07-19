import { MediaFile } from '../backend/src/entities/MediaFile';

export type StorageInitData = {
  types: string[];
  buckets: string[];
  files: MediaFile[];
  selectedStorageId: null | string;
  selectedBucket: null | string;
};

export type DeleteBucketData = {
  buckets: string[];
  files: MediaFile[];
  selectedBucket: null | string;
};
