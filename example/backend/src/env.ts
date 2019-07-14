export const getEnvOrDie = (key: string): string => {
  const value = process.env[key];
  // console.log(value, process.env[key]);
  if (value === undefined) {
    throw new Error(`ENV variable ${key} not set`);
  }
  return value;
};

export const getEnv = (key: string): string | null => {
  const value = process.env[key];
  // console.log(value, process.env[key]);
  if (value === undefined) {
    return null;
  }
  return value;
};

// multer
export const getMediaUploadDir = (): string => getEnvOrDie('MEDIA_UPLOAD_DIR');
// thumbnailservice
export const getMediaThumbnailCacheDir = (): string => getEnvOrDie('MEDIA_THUMBNAIL_CACHE_DIR');

export const getSentryDsn = (): string | undefined => process.env.SENTRY_DSN;
export const getVersion = (): string => 'development';
export const getEnvironment = (): string => 'development';
export const isProduction = (): boolean => false;
