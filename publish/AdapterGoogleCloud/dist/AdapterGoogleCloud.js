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
exports.AdapterGoogleCloud = void 0;
const fs_1 = __importDefault(require("fs"));
const stream_1 = require("stream");
const storage_1 = require("@google-cloud/storage");
const AbstractAdapter_1 = require("./AbstractAdapter");
const types_1 = require("./types");
const util_1 = require("./util");
class AdapterGoogleCloud extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._type = types_1.StorageType.GCS;
        this._configError = null;
        if (this._configError === null) {
            this._client = new storage_1.Storage(this._config);
        }
    }
    // util method used by listFiles
    getFileSize(bucketName, fileNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = [];
            for (let i = 0; i < fileNames.length; i += 1) {
                const file = this._client.bucket(bucketName).file(fileNames[i]);
                try {
                    const [metadata] = yield file.getMetadata();
                    result.push([file.name, parseInt(metadata.size, 10)]);
                }
                catch (e) {
                    return { value: null, error: e.message };
                }
            }
            return { value: result, error: null };
        });
    }
    get config() {
        return this._config;
    }
    get serviceClient() {
        return this._client;
    }
    getFileAsURL(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const file = this._client.bucket(bucketName).file(fileName);
                return { value: file.publicUrl(), error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const file = this._client.bucket(bucketName).file(fileName);
                const [exists] = yield file.exists();
                if (exists) {
                    return { value: file.createReadStream(options), error: null };
                }
                else {
                    return {
                        value: null,
                        error: `File '${fileName}' does not exist in bucket '${bucketName}'.`,
                    };
                }
            }
            catch (e) {
                return {
                    value: null,
                    error: `File ${fileName} could not be retrieved from bucket ${bucketName}`,
                };
            }
        });
    }
    removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const file = this._client.bucket(bucketName).file(fileName);
                const [exists] = yield file.exists();
                if (exists) {
                    yield this._client.bucket(bucketName).file(fileName).delete();
                    return { value: "ok", error: null };
                }
                // no fail if the file does not exist
                return { value: "ok", error: null };
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
                let readStream;
                if (typeof params.origPath === "string") {
                    const f = params.origPath;
                    if (!fs_1.default.existsSync(f)) {
                        return { value: null, error: `File with given path: ${f}, was not found` };
                    }
                    readStream = fs_1.default.createReadStream(f);
                }
                else if (typeof params.buffer !== "undefined") {
                    readStream = new stream_1.Readable();
                    readStream._read = () => { }; // _read is required but you can noop it
                    readStream.push(params.buffer);
                    readStream.push(null);
                }
                else if (typeof params.stream !== "undefined") {
                    readStream = params.stream;
                }
                const file = this._client.bucket(params.bucketName).file(params.targetPath, options);
                const writeStream = file.createWriteStream(options);
                return new Promise((resolve) => {
                    readStream
                        .pipe(writeStream)
                        .on("error", (e) => {
                        resolve({ value: null, error: e.message });
                    })
                        .on("finish", () => {
                        resolve({ value: file.publicUrl(), error: null });
                    });
                    writeStream.on("error", (e) => {
                        resolve({ value: null, error: e.message });
                    });
                });
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
                const bucket = this._client.bucket(name, options);
                const [exists] = yield bucket.exists();
                if (exists) {
                    return { value: null, error: "bucket exists" };
                }
            }
            catch (e) {
                // console.log(e.message);
                // just move on
            }
            try {
                yield this._client.createBucket(name, options);
                return { value: "ok", error: null };
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
            try {
                yield this._client.bucket(name).deleteFiles({ force: true });
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.clearBucket(name);
            }
            catch (e) {
                return { value: null, error: e.message };
            }
            try {
                yield this._client.bucket(name).delete();
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const [buckets] = yield this._client.getBuckets();
                return { value: buckets.map((b) => b.name), error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    listFiles(bucketName, numFiles = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const data = yield this._client.bucket(bucketName).getFiles();
                const names = data[0].map((f) => f.name);
                return this.getFileSize(bucketName, names);
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
                const file = this._client.bucket(bucketName).file(fileName);
                const [metadata] = yield file.getMetadata();
                return { value: parseInt(metadata.size, 10), error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    bucketExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const data = yield this._client.bucket(name).exists();
                // console.log(data);
                return { value: data[0], error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const data = yield this._client.bucket(bucketName).file(fileName).exists();
                // console.log(data);
                return { value: data[0], error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
}
exports.AdapterGoogleCloud = AdapterGoogleCloud;
//# sourceMappingURL=AdapterGoogleCloud.js.map