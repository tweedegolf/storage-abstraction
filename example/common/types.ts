import { MediaFile } from '../backend/src/entities/MediaFile';

export type StorageInitData = {
  types: string[];
  buckets: string[];
  files: MediaFile[];
  selectedStorageId: null | string;
  selectedBucket: null | string;
};

export type BucketData = {
  buckets: string[];
  files: MediaFile[];
  selectedBucket: null | string;
};
