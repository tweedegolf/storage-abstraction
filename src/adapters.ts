//  add new storage adapters here
export const adapterClasses = {
  s3: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],
  aws: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],

  b2: ["AdapterBackblazeB2", "@tweedegolf/sab-adapter-backblaze-b2"],
  backblaze: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],
  "b2-s3": ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],
  "backblaze-s3": ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],

  minio: ["AdapterMinio", "@tweedegolf/sab-adapter-minio"],
  "minio-s3": ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],

  r2: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],
  cloudflare: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],

  cubbit: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],

  gs: ["AdapterGoogleCloud", "@tweedegolf/sab-adapter-google-cloud"],
  gcs: ["AdapterGoogleCloud", "@tweedegolf/sab-adapter-google-cloud"],

  local: ["AdapterLocal", "@tweedegolf/sab-adapter-local"],

  azure: ["AdapterAzureBlob", "@tweedegolf/sab-adapter-azure-blob"],
};

// or here for functional adapters
export const adapterFunctions = {
  b2f: ["AdapterBackblazeB2F", "@tweedegolf/sab-adapter-backblaze-b2f"],
};

export function getAvailableAdapters(): string {
  return Object.keys(adapterClasses)
    .concat(Object.keys(adapterFunctions))
    .reduce((acc, val) => {
      if (acc.findIndex((v) => v === val) === -1) {
        acc.push(val[0]);
      }
      return acc;
    }, [])
    .sort()
    .join(", ");
}
