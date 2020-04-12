/**
 *  add new storage adapter here
 */

export const adapterClasses = {
  b2: { path: "../node_modules/@tweedegolf/sab-adapter-local", name: "AdapterLocal" },
  s3: { path: "../node_modules/@tweedegolf/sab-adapter-amazon-s3", name: "AdapterAmazonS3" },
  gcs: { path: "../node_modules/@tweedegolf/sab-adapter-google", name: "AdapterGoogleCloud" },
  local: { path: "../node_modules/@tweedegolf/sab-adapter-backblaze", name: "AdapterBackblazeB2" },
};

export const adapterFunctions = {
  b3: { path: "../node_modules/sab-adapter-backblaze-f", name: "createAdapter" },
};
