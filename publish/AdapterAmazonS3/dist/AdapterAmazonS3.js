"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterAmazonS3 = void 0;
const fs_1 = __importDefault(require("fs"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const AbstractAdapter_1 = require("./AbstractAdapter");
const general_1 = require("./types/general");
const util_1 = require("./util");
class AdapterAmazonS3 extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._type = general_1.StorageType.S3;
        this._configError = null;
        if (this._configError === null) {
            if (this.config.accessKeyId && this.config.secretAccessKey) {
                const o = Object.assign({}, this.config); // eslint-disable-line
                delete o.credentials;
                delete o.accessKeyId;
                delete o.secretAccessKey;
                this._client = new client_s3_1.S3Client(Object.assign({ credentials: {
                        accessKeyId: this.config.accessKeyId,
                        secretAccessKey: this.config.secretAccessKey,
                    } }, o));
            }
            else {
                const o = Object.assign({}, this.config); // eslint-disable-line
                delete o.accessKeyId;
                delete o.secretAccessKey;
                this._client = new client_s3_1.S3Client(o);
            }
        }
    }
    getFiles(name, maxFiles = 10000) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = {
                    Bucket: name,
                    MaxKeys: maxFiles,
                };
                const command = new client_s3_1.ListObjectsCommand(input);
                const { Contents } = yield this._client.send(command);
                // console.log("Contents", Contents);
                return { value: Contents, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    getFileVersions(name, maxFiles = 10000) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = {
                    Bucket: name,
                    MaxKeys: maxFiles,
                };
                const command = new client_s3_1.ListObjectVersionsCommand(input);
                const { Versions } = yield this._client.send(command);
                // console.log("Versions", Versions);
                return { value: Versions, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    get config() {
        return this._config;
    }
    get serviceClient() {
        return this._client;
    }
    getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { error: this.configError, value: null };
            }
            const { start, end } = options;
            let range = `bytes=${start}-${end}`;
            if (typeof start === "undefined" && typeof end === "undefined") {
                range = undefined;
            }
            else if (typeof start === "undefined") {
                range = `bytes=0-${end}`;
            }
            else if (typeof end === "undefined") {
                range = `bytes=${start}-`;
            }
            try {
                const params = {
                    Bucket: bucketName,
                    Key: fileName,
                    Range: range,
                };
                const command = new client_s3_1.GetObjectCommand(params);
                const response = yield this._client.send(command);
                return { value: response.Body, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const input = {
                    Bucket: bucketName,
                    Key: fileName,
                };
                const command = new client_s3_1.DeleteObjectCommand(input);
                const response = yield this._client.send(command);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    createBucket(name, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            const error = (0, util_1.validateName)(name);
            if (error !== null) {
                return { value: null, error };
            }
            try {
                const input = {
                    Bucket: name,
                };
                const command = new client_s3_1.HeadBucketCommand(input);
                const response = yield this._client.send(command);
                if (response.$metadata.httpStatusCode === 200) {
                    return { error: "bucket exists", value: null };
                }
            }
            catch (_e) {
                // this error simply means that the bucket doesn't exist yet
                // so it is safe to ignore it and continue
            }
            try {
                const input = Object.assign({ Bucket: name }, options);
                const command = new client_s3_1.CreateBucketCommand(input);
                const response = yield this._client.send(command);
                // console.log("response", response);
                if (response.$metadata.httpStatusCode === 200) {
                    return { value: "ok", error: null };
                }
                else {
                    return {
                        value: null,
                        error: `Error http status code ${response.$metadata.httpStatusCode}`,
                    };
                }
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            let objects;
            // first try to remove the versioned files
            const { value, error } = yield this.getFileVersions(name);
            if (error === "no versions" || error === "ListObjectVersions not implemented") {
                // if that fails remove non-versioned files
                const { value, error } = yield this.getFiles(name);
                if (error === "no contents") {
                    return { value: null, error: "Could not remove files" };
                }
                else if (error !== null) {
                    return { value: null, error };
                }
                else if (typeof value !== "undefined") {
                    objects = value.map((value) => ({ Key: value.Key }));
                }
            }
            else if (error !== null) {
                return { value: null, error };
            }
            else if (typeof value !== "undefined") {
                objects = value.map((value) => ({ Key: value.Key, VersionId: value.VersionId }));
            }
            if (typeof objects !== "undefined") {
                try {
                    const input = {
                        Bucket: name,
                        Delete: {
                            Objects: objects,
                            Quiet: false,
                        },
                    };
                    const command = new client_s3_1.DeleteObjectsCommand(input);
                    yield this._client.send(command);
                    return { value: "ok", error: null };
                }
                catch (e) {
                    return { value: null, error: e.message };
                }
            }
            return { value: "ok", error: null };
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.clearBucket(name);
                const input = {
                    Bucket: name,
                };
                const command = new client_s3_1.DeleteBucketCommand(input);
                const response = yield this._client.send(command);
                // console.log(response);
                return { value: "ok", error: null };
            }
            catch (e) {
                if (e.message === "NoSuchBucket") {
                    return { value: "bucket not found", error: null };
                }
                return { value: null, error: e.message };
            }
        });
    }
    listBuckets() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const input = {};
                const command = new client_s3_1.ListBucketsCommand(input);
                const response = yield this._client.send(command);
                const bucketNames = (_a = response.Buckets) === null || _a === void 0 ? void 0 : _a.map((b) => b === null || b === void 0 ? void 0 : b.Name);
                return { value: bucketNames, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            let { options } = params;
            if (typeof options !== "object") {
                options = {};
            }
            try {
                let fileData;
                if (typeof params.origPath !== "undefined") {
                    const f = params.origPath;
                    if (!fs_1.default.existsSync(f)) {
                        return { value: null, error: `File with given path: ${f}, was not found` };
                    }
                    fileData = fs_1.default.createReadStream(f);
                }
                else if (typeof params.buffer !== "undefined") {
                    fileData = params.buffer;
                }
                else if (typeof params.stream !== "undefined") {
                    fileData = params.stream;
                }
                const input = Object.assign({ Bucket: params.bucketName, Key: params.targetPath, Body: fileData }, options);
                const command = new client_s3_1.PutObjectCommand(input);
                const response = yield this._client.send(command);
                return this.getFileAsURL(params.bucketName, params.targetPath);
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    getFileAsURL(bucketName, fileName, options // e.g. { expiresIn: 3600 }
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(this._client, new client_s3_1.GetObjectCommand({
                    Bucket: bucketName,
                    Key: fileName,
                }), options);
                return { value: url, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    listFiles(bucketName, maxFiles = 10000) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const { value, error } = yield this.getFiles(bucketName, maxFiles);
                if (error !== null) {
                    return { value: null, error };
                }
                if (typeof value === "undefined") {
                    return { value: [], error: null };
                }
                return { value: value.map((o) => [o.Key, o.Size]), error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    sizeOf(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const input = {
                    Bucket: bucketName,
                    Key: fileName,
                };
                const command = new client_s3_1.HeadObjectCommand(input);
                const response = yield this._client.send(command);
                return { value: response.ContentLength, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const input = {
                    Bucket: bucketName,
                };
                const command = new client_s3_1.HeadBucketCommand(input);
                yield this._client.send(command);
                return { value: true, error: null };
            }
            catch (e) {
                return { value: false, error: null };
            }
        });
    }
    fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const input = {
                    Bucket: bucketName,
                    Key: fileName,
                };
                const command = new client_s3_1.HeadObjectCommand(input);
                yield this._client.send(command);
                return { value: true, error: null };
            }
            catch (e) {
                return { value: false, error: null };
            }
        });
    }
}
exports.AdapterAmazonS3 = AdapterAmazonS3;
//# sourceMappingURL=AdapterAmazonS3.js.map