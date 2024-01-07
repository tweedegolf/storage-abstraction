"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Compatible = exports.StorageType = void 0;
var StorageType;
(function (StorageType) {
    StorageType["LOCAL"] = "local";
    StorageType["GCS"] = "gcs";
    StorageType["S3"] = "s3";
    StorageType["B2"] = "b2";
    StorageType["AZURE"] = "azure";
    StorageType["MINIO"] = "minio";
})(StorageType || (exports.StorageType = StorageType = {}));
var S3Compatible;
(function (S3Compatible) {
    S3Compatible[S3Compatible["Amazon"] = 0] = "Amazon";
    S3Compatible[S3Compatible["R2"] = 1] = "R2";
    S3Compatible[S3Compatible["Backblaze"] = 2] = "Backblaze";
})(S3Compatible || (exports.S3Compatible = S3Compatible = {}));
/**
 * @paramObject FilePath
 * @param {string} FilePath.bucketName
 * @param {string} FilePath.origPath - path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
 * @param {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
 * @param {object} FilePath.options
 * @returns {ResultObject}
 */
/**
 * @paramObject FileBufferParams
 * @param {string} FilePath.bucketName
 * @param {Buffer} FilePath.buffer - buffer
 * @param {string} FilePath.targetPath - path on the storage, you can add a path or only provide name of the file
 * @param {object} FilePath.options
 * @returns {ResultObject}
 */
/**
 * @typedef {Object} FilePathParams
 * @property {string} bucketName
 * @property {string} origPath - path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
 * @property {string} argetPath - path on the storage, you can add a path or only provide name of the file
 * @property {object} options
 */
/**
 * @typedef {Object} ResultObject
 * @property {string | null} value
 * @property {string | null} error
 */
/**
 * Params for adding a file to the storage
 * @typedef {Object} FilePathParams
 * @property {string} bucketName
 * @property {string} origPath - path to the file that you want to add, e.g. /home/user/Pictures/image1.jpg
 * @property {string} argetPath - path on the storage, you can add a path or only provide name of the file
 * @property {object} options
 */
//# sourceMappingURL=types.js.map