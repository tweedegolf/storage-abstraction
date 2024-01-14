"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableAdapters = exports.adapterFunctions = exports.adapterClasses = void 0;
//  add new storage adapters here
exports.adapterClasses = {
    b2: ["AdapterBackblazeB2", "@tweedegolf/sab-adapter-backblaze-b2"],
    s3: ["AdapterAmazonS3", "@tweedegolf/sab-adapter-amazon-s3"],
    gcs: ["AdapterGoogleCloudStorage", "@tweedegolf/sab-adapter-google-cloud"],
    local: ["AdapterLocal", "@tweedegolf/sab-adapter-local"],
    azure: ["AdapterAzureStorageBlob", "@tweedegolf/sab-adapter-azure-blob"],
    minio: ["AdapterMinio", "@tweedegolf/sab-adapter-minio"],
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
            acc.push(val[0]);
        }
        return acc;
    }, [])
        .sort()
        .join(", ");
}
exports.getAvailableAdapters = getAvailableAdapters;
//# sourceMappingURL=adapters.js.map