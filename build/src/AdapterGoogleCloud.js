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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterGoogleCloud = void 0;
const stream_1 = require("stream");
const storage_1 = require("@google-cloud/storage");
const AbstractAdapter_1 = require("./AbstractAdapter");
const general_1 = require("./types/general");
const util_1 = require("./util");
class AdapterGoogleCloud extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._provider = general_1.Provider.GCS;
        this._configError = null;
        if (typeof config !== "string") {
            this._config = Object.assign({}, config);
        }
        else {
            const { value, error } = (0, util_1.parseUrl)(config);
            if (value === null) {
                this._configError = `[configError] ${error}`;
            }
            else {
                const { protocol: type, username: accessKeyId, host: bucketName, searchParams } = value;
                if (searchParams !== null) {
                    this._config = Object.assign({ type }, searchParams);
                }
                else {
                    this._config = { type };
                }
                if (accessKeyId !== null) {
                    this._config.accessKeyId = accessKeyId;
                }
                if (bucketName !== null) {
                    this._config.bucketName = bucketName;
                }
            }
        }
        try {
            this._client = new storage_1.Storage(this._config);
        }
        catch (e) {
            this._configError = `[configError] ${(0, util_1.getErrorMessage)(e)}`;
        }
        if (typeof this.config.bucketName !== "undefined") {
            this._bucketName = this.config.bucketName;
        }
    }
    // protected, called by methods of public API via AbstractAdapter
    _listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [buckets] = yield this._client.getBuckets();
                return { value: buckets.map((b) => b.name), error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _createBucket(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bucket = this._client.bucket(name, options);
                const [exists] = yield bucket.exists();
                if (exists) {
                    return { value: null, error: "bucket exists" };
                }
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
            try {
                yield this._client.createBucket(name, options);
                if (options.public === true) {
                    yield this._client.bucket(name, options).makePublic();
                }
                // if (options.versioning === true) {
                //   await this._client.bucket(name).setMetadata({
                //     versioning: {
                //       enabled: true,
                //     },
                //   });
                // }
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getPublicURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (options.noCheck !== true) {
                    const { value, error } = yield this._bucketIsPublic(bucketName);
                    if (error !== null) {
                        return { value: null, error };
                    }
                    else if (value === false) {
                        return { value: null, error: `Bucket "${bucketName}" is not public!` };
                    }
                }
                const bucket = this._client.bucket(bucketName, options);
                const file = bucket.file(fileName);
                return { value: file.publicUrl(), error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getSignedURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const exp = new Date();
            if (typeof options.expiresIn !== "number") {
                exp.setUTCDate(exp.getUTCDate() + 7);
            }
            else {
                exp.setSeconds(exp.getSeconds() + options.expiresIn);
            }
            const expires = exp.valueOf();
            try {
                const file = this._client.bucket(bucketName).file(decodeURI(fileName));
                const url = (yield file.getSignedUrl({
                    action: "read",
                    expires,
                }))[0];
                return { value: url, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this._client.bucket(bucketName).file(fileName);
                return { value: file.createReadStream(options), error: null };
            }
            catch (e) {
                return {
                    value: null,
                    error: (0, util_1.getErrorMessage)(e),
                };
            }
        });
    }
    _removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this._client.bucket(bucketName).file(fileName);
                yield this._client.bucket(bucketName).file(fileName).delete();
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bucket = this._client.bucket(bucketName);
                const [policy] = yield bucket.iam.getPolicy({ requestedPolicyVersion: 3 });
                let isPublic = false;
                for (let i = 0; i < policy.bindings.length; i++) {
                    const element = policy.bindings[i];
                    if (element.role === "roles/storage.legacyBucketReader" &&
                        element.members.includes("allUsers")) {
                        isPublic = true;
                        break;
                    }
                }
                return { value: isPublic, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let readStream;
                if (typeof params.buffer !== "undefined") {
                    readStream = new stream_1.Readable();
                    readStream._read = () => { }; // _read is required but you can noop it
                    readStream.push(params.buffer);
                    readStream.push(null);
                }
                else if (typeof params.stream !== "undefined") {
                    readStream = params.stream;
                }
                const file = this._client
                    .bucket(params.bucketName)
                    .file(params.targetPath, params.options);
                const writeStream = file.createWriteStream(params.options);
                return new Promise((resolve) => {
                    readStream
                        .pipe(writeStream)
                        .on("error", (e) => {
                        resolve({ value: null, error: (0, util_1.getErrorMessage)(e) });
                    })
                        .on("finish", () => __awaiter(this, void 0, void 0, function* () {
                        resolve({ value: "ok", error: null });
                    }));
                    writeStream.on("error", (e) => {
                        resolve({ value: null, error: (0, util_1.getErrorMessage)(e) });
                    });
                });
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _listFiles(bucketName, numFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._client.bucket(bucketName).getFiles();
                let files = data[0].map((f) => [
                    f.name,
                    parseInt(f.metadata.size, 10),
                ]);
                if (typeof numFiles === "number") {
                    files = files.slice(0, numFiles);
                }
                return {
                    value: files,
                    error: null,
                };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _sizeOf(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this._client.bucket(bucketName).file(fileName);
                const [metadata] = yield file.getMetadata();
                return { value: parseInt(metadata.size, 10), error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _bucketExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._client.bucket(name).exists();
                return { value: data[0], error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this._client.bucket(bucketName).file(fileName).exists();
                // console.log(data);
                return { value: data[0], error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._client.bucket(name).delete();
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._client.bucket(name).deleteFiles({ force: true });
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getPresignedUploadURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let expires = new Date();
                let offset = 5 * 60;
                if (typeof options.expiresIn !== "undefined") {
                    offset = Number.parseInt(options.expiresIn, 10);
                }
                expires.setSeconds(expires.getSeconds() + offset);
                let version = "v4";
                if (typeof options.version !== "undefined") {
                    version = options.version;
                }
                if (version !== "v2" && version !== "v4") {
                    return {
                        value: null,
                        error: `${version} is not valid: version must be either 'v2' or 'v4'`,
                    };
                }
                let action = "write";
                if (typeof options.action !== "undefined") {
                    action = options.version;
                }
                if (action !== "write" &&
                    action !== "read" &&
                    action !== "delete" &&
                    action !== "resumable") {
                    return {
                        value: null,
                        error: `${action} is not valid: version must be either 'write', 'read', 'delete' or 'resumable'`,
                    };
                }
                let contentType = "application/octet-stream";
                if (typeof options.contentType !== "undefined") {
                    contentType = options.contentType;
                }
                const config = {
                    version,
                    action,
                    expires,
                    contentType,
                };
                // console.log("contentType", contentType);
                const [url] = yield this._client.bucket(bucketName).file(fileName).getSignedUrl(config);
                return { value: { url }, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    //public
    get config() {
        return this._config;
    }
    getConfig() {
        return this._config;
    }
    get serviceClient() {
        return this._client;
    }
    getServiceClient() {
        return this._client;
    }
}
exports.AdapterGoogleCloud = AdapterGoogleCloud;
//# sourceMappingURL=AdapterGoogleCloud.js.map