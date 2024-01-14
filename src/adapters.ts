//  add new storage adapters here
export const adapterClasses = {
  b2: ["AdapterBackblazeB2", "@tweedegolf/sab-adapter-backblaze-b2"],
  s3: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],
  gcs: ["AdapterGoogleCloudStorage", "@tweedegolf/sab-adapter-google-cloud"],
  local: ["AdapterLocal", "@tweedegolf/sab-adapter-local"],
  azure: ["AdapterAzureStorageBlob", "@tweedegolf/sab-adapter-azure-blob"],
  minio: ["AdapterMinio", "@tweedegolf/sab-adapter-minio"],
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
