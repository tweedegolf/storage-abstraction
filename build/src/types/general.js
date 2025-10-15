"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
// add your custom type here
var Provider;
(function (Provider) {
    Provider["NONE"] = "none";
    Provider["LOCAL"] = "local";
    Provider["GCS"] = "gcs";
    Provider["GS"] = "gs";
    Provider["S3"] = "s3";
    Provider["AWS"] = "aws";
    Provider["AZURE"] = "azure";
    Provider["B2"] = "b2";
    Provider["BACKBLAZE"] = "b2";
    Provider["B2_S3"] = "b2-s3";
    Provider["BACKBLAZE_S3"] = "b2-s3";
    Provider["MINIO"] = "minio";
    Provider["MINIO_S3"] = "minio-s3";
    Provider["CUBBIT"] = "cubbit";
    Provider["R2"] = "r2";
    Provider["CLOUDFLARE"] = "r2";
})(Provider || (exports.Provider = Provider = {}));
//# sourceMappingURL=general.js.map