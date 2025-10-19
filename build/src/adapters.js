"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adapterFunctions = exports.adapterClasses = void 0;
exports.getAvailableAdapters = getAvailableAdapters;
//  add new storage adapters here
exports.adapterClasses = {
    s3: ["AdapterS3", "@tweedegolf/sab-adapter-s3"],
    aws: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],
    b2: ["AdapterBackblazeB2", "@tweedegolf/sab-adapter-backblaze-b2"],
    backblaze: ["AdapterBackblazeB2", "@tweedegolf/sab-adapter-backblaze-b2"],
    "b2-s3": ["AdapterBackblazeS3", "@tweedegolf/sab-adapter-backblaze-s3"],
    "backblaze-s3": ["AdapterBackblazeS3", "@tweedegolf/sab-adapter-backblaze-s3"],
    minio: ["AdapterMinio", "@tweedegolf/sab-adapter-minio"],
    "minio-s3": ["AdapterMinioS3", "@tweedegolf/sab-adapter-minio-s3"],
    r2: ["AdapterCloudflareS3", "@tweedegolf/sab-adapter-cloudflare-s3"],
    cloudflare: ["AdapterCloudflareS3", "@tweedegolf/sab-adapter-cloudflare-s3"],
    cubbit: ["AdapterCubbitS3", "@tweedegolf/sab-adapter-cubbit-s3"],
    gs: ["AdapterGoogleCloud", "@tweedegolf/sab-adapter-google-cloud"],
    gcs: ["AdapterGoogleCloud", "@tweedegolf/sab-adapter-google-cloud"],
    local: ["AdapterLocal", "@tweedegolf/sab-adapter-local"],
    azure: ["AdapterAzureBlob", "@tweedegolf/sab-adapter-azure-blob"],
};
// or here for functional adapters
exports.adapterFunctions = {
    b2f: ["AdapterBackblazeB2F", "@tweedegolf/sab-adapter-backblaze-b2f"],
};
function getAvailableAdapters() {
    return Object.keys(exports.adapterClasses)
        .concat(Object.keys(exports.adapterFunctions))
        .reduce((acc, val) => {
        if (acc.findIndex((v) => v === val) === -1) {
            acc.push(val);
        }
        return acc;
    }, [])
        .sort()
        .join(", ");
}
//# sourceMappingURL=adapters.js.map