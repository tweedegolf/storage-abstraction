const getEnvOrDie = (key: string): string => {
  const value = process.env[key];
  // console.log(value, process.env[key]);
  if (value === undefined) {
    throw new Error(`ENV variable ${key} not set`);
  }
  return value;
};

export const getStorageType = (): string => getEnvOrDie('STORAGE_TYPE');
export const getStorageBucketName = (): string => getEnvOrDie('STORAGE_BUCKETNAME');
// storage local
export const getLocalStorageDir = (): string => getEnvOrDie('STORAGE_LOCAL_DIRECTORY');
// storage Google Cloud
export const getGoogleStorageProjectId = (): string => getEnvOrDie('STORAGE_GOOGLE_CLOUD_PROJECT_ID');
export const getGoogleStorageKeyFile = (): string => getEnvOrDie('STORAGE_GOOGLE_CLOUD_KEYFILE');
// storage Amazon S3
export const getAmazonS3AccessKeyId = (): string => getEnvOrDie('STORAGE_AWS_ACCESS_KEY_ID');
export const getAmazonS3SecretAccessKey = (): string => getEnvOrDie('STORAGE_AWS_SECRET_ACCESS_KEY');
// multer
export const getMediaUploadDir = (): string => getEnvOrDie('MEDIA_UPLOAD_DIR');
// thumbnailservice
export const getMediaThumbnailCacheDir = (): string => getEnvOrDie('MEDIA_THUMBNAIL_CACHE_DIR');

export const getSentryDsn = (): string | undefined => process.env.SENTRY_DSN;
export const getVersion = (): string => 'development';
export const getEnvironment = (): string => 'development';

