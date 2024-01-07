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
exports.AdapterAzureBlob = void 0;
const fs_1 = __importDefault(require("fs"));
const stream_1 = require("stream");
const AbstractAdapter_1 = require("./AbstractAdapter");
const storage_blob_1 = require("@azure/storage-blob");
const identity_1 = require("@azure/identity");
const types_1 = require("./types");
const util_1 = require("./util");
class AdapterAzureBlob extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._type = types_1.StorageType.AZURE;
        this._configError = null;
        if (this._configError === null) {
            if (typeof this.config.accountName === "undefined" &&
                typeof this.config.connectionString === "undefined") {
                this._configError =
                    '[configError] Please provide at least a value for "accountName" or for "connectionString';
                return;
            }
            // option 1: accountKey
            if (typeof this.config.accountKey !== "undefined") {
                try {
                    this.sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(this.config.accountName, this.config.accountKey);
                }
                catch (e) {
                    this._configError = `[configError] ${JSON.parse(e.message).code}`;
                }
                this._client = new storage_blob_1.BlobServiceClient(`https://${this.config.accountName}.blob.core.windows.net`, this.sharedKeyCredential, this.config.options);
                // option 2: sasToken
            }
            else if (typeof this.config.sasToken !== "undefined") {
                this._client = new storage_blob_1.BlobServiceClient(`https://${this.config.accountName}.blob.core.windows.net?${this.config.sasToken}`, new storage_blob_1.AnonymousCredential(), this.config.options);
                // option 3: connection string
            }
            else if (typeof this.config.connectionString !== "undefined") {
                this._client = storage_blob_1.BlobServiceClient.fromConnectionString(this.config.connectionString);
                // option 4: password less
            }
            else {
                this._client = new storage_blob_1.BlobServiceClient(`https://${this.config.accountName}.blob.core.windows.net`, new identity_1.DefaultAzureCredential(), this.config.options);
            }
        }
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
                return { value: null, error: this.configError };
            }
            try {
                const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
                const exists = yield file.exists();
                if (!exists) {
                    return {
                        value: null,
                        error: `File ${fileName} could not be found in bucket ${bucketName}`,
                    };
                }
                const { start, end } = options;
                let offset;
                let count;
                if (typeof start !== "undefined") {
                    offset = start;
                }
                else {
                    offset = 0;
                }
                if (typeof end !== "undefined") {
                    count = end - offset + 1;
                }
                delete options.start;
                delete options.end;
                // console.log(offset, count, options);
                try {
                    const stream = yield file.download(offset, count, options);
                    return { value: stream.readableStreamBody, error: null };
                }
                catch (e) {
                    return { value: null, error: e.message };
                }
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    getFileAsURL(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
                const exists = yield file.exists();
                if (!exists) {
                    return {
                        value: null,
                        error: `File ${fileName} could not be found in bucket ${bucketName}`,
                    };
                }
                try {
                    const options = {
                        permissions: storage_blob_1.BlobSASPermissions.parse("r"),
                        expiresOn: new Date(new Date().valueOf() + 86400),
                    };
                    const url = yield file.generateSasUrl(options);
                    return { value: url, error: null };
                }
                catch (e) {
                    return { value: null, error: e.message };
                }
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    createBucket(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            const error = (0, util_1.validateName)(name);
            if (error !== null) {
                return { value: null, error };
            }
            try {
                const res = yield this._client.createContainer(name, options);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    clearBucket(name) {
        var _a, e_1, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                // const containerClient = this._client.getContainerClient(name);
                // const blobs = containerClient.listBlobsFlat();
                // for await (const blob of blobs) {
                //   console.log(blob.name);
                //   await containerClient.deleteBlob(blob.name);
                // }
                const containerClient = this._client.getContainerClient(name);
                const blobs = containerClient.listBlobsByHierarchy("/");
                try {
                    for (var _d = true, blobs_1 = __asyncValues(blobs), blobs_1_1; blobs_1_1 = yield blobs_1.next(), _a = blobs_1_1.done, !_a; _d = true) {
                        _c = blobs_1_1.value;
                        _d = false;
                        const blob = _c;
                        if (blob.kind === "prefix") {
                            // console.log("prefix", blob);
                        }
                        else {
                            yield containerClient.deleteBlob(blob.name);
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
                const del = yield this._client.deleteContainer(name);
                //console.log('deleting container: ', del);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    listBuckets() {
        var _a, e_2, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            // let i = 0;
            try {
                const bucketNames = [];
                try {
                    // let i = 0;
                    for (var _d = true, _e = __asyncValues(this._client.listContainers()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const container = _c;
                        // console.log(`${i++} ${container.name}`);
                        bucketNames.push(container.name);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                return { value: bucketNames, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    listFiles(bucketName) {
        var _a, e_3, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const files = [];
                const data = this._client.getContainerClient(bucketName).listBlobsFlat();
                try {
                    for (var _d = true, data_1 = __asyncValues(data), data_1_1; data_1_1 = yield data_1.next(), _a = data_1_1.done, !_a; _d = true) {
                        _c = data_1_1.value;
                        _d = false;
                        const blob = _c;
                        if (blob.properties["ResourceType"] !== "directory") {
                            files.push([blob.name, blob.properties.contentLength]);
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
                return { value: files, error: null };
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
                const container = this._client.getContainerClient(bucketName);
                const file = yield container.getBlobClient(fileName).deleteIfExists();
                return { value: "ok", error: null };
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
                const blob = this._client.getContainerClient(bucketName).getBlobClient(fileName);
                const length = (yield blob.getProperties()).contentLength;
                return { value: length, error: null };
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
                const cont = this._client.getContainerClient(name);
                const exists = yield cont.exists();
                return { value: exists, error: null };
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
                const exists = yield this._client
                    .getContainerClient(bucketName)
                    .getBlobClient(fileName)
                    .exists();
                return { value: exists, error: null };
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
                const file = this._client
                    .getContainerClient(params.bucketName)
                    .getBlobClient(params.targetPath)
                    .getBlockBlobClient();
                const writeStream = yield file.uploadStream(readStream, 64000, 20, options);
                if (writeStream.errorCode) {
                    return { value: null, error: writeStream.errorCode };
                }
                else {
                    return this.getFileAsURL(params.bucketName, params.targetPath);
                }
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
}
exports.AdapterAzureBlob = AdapterAzureBlob;
//# sourceMappingURL=AdapterAzureBlob.js.map