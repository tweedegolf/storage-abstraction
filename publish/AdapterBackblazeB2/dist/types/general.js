"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageType = void 0;
// add your custom type here
var StorageType;
(function (StorageType) {
    StorageType["LOCAL"] = "local";
    StorageType["GCS"] = "gcs";
    StorageType["S3"] = "s3";
    StorageType["B2"] = "b2";
    StorageType["AZURE"] = "azure";
    StorageType["MINIO"] = "minio";
})(StorageType || (exports.StorageType = StorageType = {}));
//# sourceMappingURL=general.js.map