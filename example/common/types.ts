import { MediaFile } from '../backend/src/entities/MediaFile';

export type StorageInitData = {
  types: string[];
  files: MediaFile[];
  selectedStorageId: null | string;
  selectedBucket: null | string;
};
