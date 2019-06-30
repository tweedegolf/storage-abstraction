const getEnvOrDie = (key: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`ENV variable ${key} not set`);
  }

  return value;
};

export const isProduction = (): boolean => process.env.ENVIRONMENT === 'production';
export const getEnvironment = (): string => process.env.ENVIRONMENT || 'development';
export const getVersion = (): string => process.env.VERSION || 'development';

/* Mandatory ENV parameters */
export const getBackendUrl = (): string => getEnvOrDie('BACKEND_URL');
export const getCorsWhitelist = (): string[] => getEnvOrDie('CORS_WHITELIST').split(';');
export const getMagazetiUrl = (): string => getEnvOrDie('MAGAZETI_URL');
export const getJwtSecret = (): string => getEnvOrDie('JWT_SECRET');

export const getGoogleAuthClientId = (): string => getEnvOrDie('GOOGLE_AUTH_CLIENT_ID');
export const getGoogleAuthClientSecret = (): string => getEnvOrDie('GOOGLE_AUTH_CLIENT_SECRET');

export const getGoogleCloudBucket = (): string => getEnvOrDie('GOOGLE_CLOUD_BUCKET');
export const getGoogleCloudProjectId = (): string => getEnvOrDie('GOOGLE_CLOUD_PROJECT_ID');
export const getGoogleCloudKeystorePath = (): string => getEnvOrDie('GOOGLE_CLOUD_KEYSTORE_PATH');

export const getMediaStorageMethod = (): string => getEnvOrDie('MEDIA_STORAGE_METHOD');
export const getLocalMediaStorageRoot = (): string => getEnvOrDie('MEDIA_STORAGE_ROOT_LOCAL');
export const getMediaThumbnailCacheRoot = (): string => getEnvOrDie('MEDIA_THUMBNAIL_CACHE_ROOT');

export const getMailDomain = (): string => getEnvOrDie('MAIL_DOMAIN');
export const getMailFromAddress = (): string => getEnvOrDie('MAIL_FROM_ADDRESS');

export const getLoginTokenTtlMins = (): number => parseInt(getEnvOrDie('LOGIN_TOKEN_TTL_MINS'), 10);

/* Optional ENV parameters (only optional in devel) */
export const getDatabaseUrl = (): string => process.env.DATABASE_URL || 'sqlite://:memory';
export const getMagazetiUsername = (): string => process.env.MAGAZETI_USER || 'admin';
export const getMagazetiSecret = (): string => process.env.MAGAZETI_SECRET || 'development';

export const getMailgunKey = (): string | undefined => process.env.MAILGUN_KEY;

export const getSentryDsn = (): string | undefined => process.env.SENTRY_DSN;
