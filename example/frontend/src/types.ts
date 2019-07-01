import { MediaFile } from '../../backend/src/entities/MediaFile';

export type RootState = {
  files: MediaFile[],
  message: string | null,
};
