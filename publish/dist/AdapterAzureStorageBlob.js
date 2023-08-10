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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterAzureStorageBlob = void 0;
const fs_1 = __importDefault(require("fs"));
const stream_1 = require("stream");
const AbstractAdapter_1 = require("./AbstractAdapter");
const storage_blob_1 = require("@azure/storage-blob");
const types_1 = require("./types");
const util_1 = require("./util");
class AdapterAzureStorageBlob extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super();
        this.type = types_1.StorageType.AZURESTORAGEBLOB;
        this.bucketNames = [];
        this.config = this.parseConfig(config);
        if (typeof this.config.bucketName !== "undefined") {
            const msg = this.validateName(this.config.bucketName);
            if (msg !== null) {
                throw new Error(msg);
            }
            this.bucketName = this.config.bucketName;
        }
        this.sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(this.config.storageAccount, this.config.accessKey);
        this.storage = new storage_blob_1.BlobServiceClient(`https://${this.config.storageAccount}.blob.core.windows.net`, this.sharedKeyCredential);
    }
    parseConfig(config) {
        let cfg;
        if (typeof config === "string") {
            const { type, part1: storageAccount, part2: accessKey, bucketName, queryString, } = (0, util_1.parseUrl)(config);
            cfg = Object.assign({ type,
                storageAccount,
                accessKey,
                bucketName }, queryString);
        }
        else {
            cfg = Object.assign({}, config);
        }
        if (cfg.skipCheck === true) {
            return cfg;
        }
        if (!cfg.storageAccount) {
            throw new Error("You must specify a value for 'storageAccount' for storage type 'azurestorageblob'");
        }
        if (!cfg.accessKey) {
            throw new Error("You must specify a value for 'accessKey' for storage type 'azurestorageblob'");
        }
        return cfg;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized) {
                return Promise.resolve(true);
            }
            if (this.bucketName) {
                yield this.createBucket(this.bucketName);
                this.bucketNames.push(this.bucketName);
            }
            // no further initialization required
            this.initialized = true;
            return Promise.resolve(true);
        });
    }
    getFileAsReadable(fileName, options = { start: 0 }) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.storage.getContainerClient(this.bucketName).getBlobClient(fileName);
            const exists = yield file.exists();
            if (!exists) {
                throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
            }
            if (options.end !== undefined) {
                options.end = options.end + 1;
            }
            return (yield file.download(options.start, options.end)).readableStreamBody;
        });
    }
    getFileAsURL(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.storage.getContainerClient(this.bucketName).getBlobClient(fileName);
            const exists = yield file.exists();
            if (!exists) {
                throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
            }
            let options = {
                permissions: storage_blob_1.BlobSASPermissions.parse("r"),
                expiresOn: new Date(new Date().valueOf() + 86400),
            };
            return file.generateSasUrl(options);
        });
    }
    selectBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name === null) {
                this.bucketName = "";
                return `bucket '${name}' deselected`;
            }
            this.createBucket(name)
                .then(() => {
                this.bucketName = name;
                return `bucket '${name}' selected`;
            })
                .catch((e) => {
                throw e;
            });
        });
    }
    createBucket(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = this.validateName(name);
            if (msg !== null) {
                return Promise.reject(msg);
            }
            if (this.bucketNames.findIndex((b) => b === name) !== -1) {
                return "bucket already exists";
            }
            try {
                const cont = this.storage.getContainerClient(name);
                const exists = yield cont.exists();
                if (exists) {
                    return "container already exists";
                }
            }
            catch (e) {
            }
            try {
                let res = yield this.storage.createContainer(name);
                this.bucketNames.push(res.containerClient.containerName);
                return "container created";
            }
            catch (e) {
                console.log('error creating container: ', e);
                return;
            }
        });
    }
    clearBucket(name) {
        var _a, e_1, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            if (!n) {
                return Promise.reject("no bucket selected");
            }
            try {
                const containerClient = this.storage.getContainerClient(n);
                const blobs = containerClient.listBlobsFlat();
                try {
                    for (var _d = true, blobs_1 = __asyncValues(blobs), blobs_1_1; blobs_1_1 = yield blobs_1.next(), _a = blobs_1_1.done, !_a;) {
                        _c = blobs_1_1.value;
                        _d = false;
                        try {
                            const blob = _c;
                            yield containerClient.deleteBlob(blob.name);
                        }
                        finally {
                            _d = true;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = blobs_1.return)) yield _b.call(blobs_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return "bucket cleared";
            }
            catch (e) {
                return Promise.reject(e);
            }
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            if (!n) {
                return Promise.reject("no bucket selected");
            }
            try {
                yield this.clearBucket(n);
                let del = yield this.storage.deleteContainer(n);
                //console.log('deleting container: ', del);
                if (n === this.bucketName) {
                    this.bucketName = "";
                }
                this.bucketNames = this.bucketNames.filter((b) => b !== n);
                return "bucket deleted";
            }
            catch (e) {
                return Promise.reject(e);
            }
        });
    }
    listBuckets() {
        var _a, e_2, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (var _d = true, _e = __asyncValues(this.storage.listContainers()), _f; _f = yield _e.next(), _a = _f.done, !_a;) {
                    _c = _f.value;
                    _d = false;
                    try {
                        const container = _c;
                        this.bucketNames.map((b) => b = container.name);
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return this.bucketNames;
        });
    }
    listFiles() {
        var _a, e_3, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                return Promise.reject("no bucket selected");
            }
            const files = [];
            const data = this.storage.getContainerClient(this.bucketName).listBlobsFlat();
            try {
                for (var _d = true, data_1 = __asyncValues(data), data_1_1; data_1_1 = yield data_1.next(), _a = data_1_1.done, !_a;) {
                    _c = data_1_1.value;
                    _d = false;
                    try {
                        const blob = _c;
                        if (blob.properties['ResourceType'] !== "directory") {
                            files.push([blob.name, blob.properties.contentLength]);
                        }
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = data_1.return)) yield _b.call(data_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return files;
        });
    }
    removeFile(fileName) {
        try {
            const container = this.storage.getContainerClient(this.bucketName);
            const file = container.getBlobClient(fileName).deleteIfExists();
            /*if(file.()) {
                file.delete();
                return Promise.resolve("file deleted");
            } else {
                return Promise.resolve("file does not exist");
            }*/
            return Promise.resolve("file deleted");
        }
        catch (e) {
            console.log("error deleting file: ", e);
            return Promise.resolve(e);
        }
    }
    sizeOf(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                return Promise.reject("no bucket selected");
            }
            try {
                const blob = this.storage.getContainerClient(this.bucketName).getBlobClient(name);
                return Promise.resolve((yield blob.getProperties()).contentLength);
            }
            catch (e) {
                return Promise.reject(e);
            }
        });
    }
    fileExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                return Promise.reject("no bucket selected");
            }
            const data = yield this.storage.getContainerClient(this.bucketName).getBlobClient(name).exists();
            return data;
        });
    }
    store(arg, targetPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            yield this.createBucket(this.bucketName);
            let readStream;
            if (typeof arg === "string") {
                yield fs_1.default.promises.stat(arg); // throws error if path doesn't exist
                readStream = fs_1.default.createReadStream(arg);
            }
            else if (arg instanceof Buffer) {
                readStream = new stream_1.Readable();
                readStream._read = () => { }; // _read is required but you can noop it
                readStream.push(arg);
                readStream.push(null);
            }
            else if (arg instanceof stream_1.Readable) {
                readStream = arg;
            }
            const file = this.storage.getContainerClient(this.bucketName).getBlobClient(targetPath).getBlockBlobClient();
            const writeStream = yield file.uploadStream(readStream, 64000, 20, {
                onProgress: (ev) => null
            });
            return new Promise((resolve, reject) => {
                if (writeStream.errorCode) {
                    reject(writeStream.errorCode);
                }
                else {
                    resolve("file stored");
                }
            });
        });
    }
}
exports.AdapterAzureStorageBlob = AdapterAzureStorageBlob;
//# sourceMappingURL=AdapterAzureStorageBlob.js.map