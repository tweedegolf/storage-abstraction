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
exports.AdapterGoogleCloudStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zip_1 = __importDefault(require("@ramda/zip"));
const stream_1 = require("stream");
const storage_1 = require("@google-cloud/storage");
const AbstractAdapter_1 = require("./AbstractAdapter");
const types_1 = require("./types");
const util_1 = require("./util");
class AdapterGoogleCloudStorage extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super();
        this.type = types_1.StorageType.GCS;
        this.bucketNames = [];
        this.config = this.parseConfig(config);
        if (typeof this.config.bucketName !== "undefined") {
            const msg = this.validateName(this.config.bucketName);
            if (msg !== null) {
                throw new Error(msg);
            }
            this.bucketName = this.config.bucketName;
        }
        this.storage = new storage_1.Storage(this.config);
    }
    /**
     * @param {string} keyFile - path to the keyFile
     *
     * Read in the keyFile and retrieve the projectId, this is function
     * is called when the user did not provide a projectId
     */
    getGCSProjectId(keyFile) {
        const data = fs_1.default.readFileSync(keyFile).toString("utf-8");
        const json = JSON.parse(data);
        return json.project_id;
    }
    parseConfig(config) {
        let cfg;
        if (typeof config === "string") {
            const { type, part1: keyFilename, part2: projectId, bucketName, queryString, } = (0, util_1.parseUrl)(config);
            cfg = Object.assign({ type,
                keyFilename,
                projectId,
                bucketName }, queryString);
        }
        else {
            cfg = Object.assign({}, config);
        }
        if (cfg.skipCheck === true) {
            return cfg;
        }
        if (!cfg.keyFilename) {
            throw new Error("You must specify a value for 'keyFilename' for storage type 'gcs'");
        }
        if (!cfg.projectId) {
            cfg.projectId = this.getGCSProjectId(cfg.keyFilename);
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
    // After uploading a file to Google Storage it may take a while before the file
    // can be discovered and downloaded; this function adds a little delay
    getFile(fileName, retries = 5) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.storage.bucket(this.bucketName).file(fileName);
            const [exists] = yield file.exists();
            if (!exists && retries !== 0) {
                const r = retries - 1;
                yield new Promise((res) => {
                    setTimeout(res, 250);
                });
                // console.log('RETRY', r, fileName);
                return this.getFile(fileName, r);
            }
            if (!exists) {
                throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
            }
            return file;
        });
    }
    getFileAsReadable(fileName, options = { start: 0 }) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.storage.bucket(this.bucketName).file(fileName);
            const [exists] = yield file.exists();
            if (exists) {
                return file.createReadStream(options);
            }
            throw new Error(`File ${fileName} could not be retrieved from bucket ${this.bucketName}`);
        });
    }
    // not in use
    downloadFile(fileName, downloadPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.storage.bucket(this.bucketName).file(fileName);
            const localFilename = path_1.default.join(downloadPath, fileName);
            yield file.download({ destination: localFilename });
        });
    }
    removeFile(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.storage.bucket(this.bucketName).file(fileName).delete();
                return "file deleted";
            }
            catch (e) {
                if (e.message.indexOf("No such object") !== -1) {
                    return "file deleted";
                }
                // console.log(e.message);
                throw e;
            }
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
            const file = this.storage.bucket(this.bucketName).file(targetPath, options);
            const writeStream = file.createWriteStream();
            return new Promise((resolve, reject) => {
                readStream
                    .pipe(writeStream)
                    .on("error", reject)
                    .on("finish", () => {
                    resolve(file.publicUrl());
                });
                writeStream.on("error", reject);
            });
        });
    }
    createBucket(name, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = this.validateName(name);
            if (msg !== null) {
                return Promise.reject(msg);
            }
            if (this.bucketNames.findIndex((b) => b === name) !== -1) {
                return "bucket exists";
            }
            try {
                const bucket = this.storage.bucket(name, options);
                const [exists] = yield bucket.exists();
                if (exists) {
                    return "bucket exists";
                }
            }
            catch (e) {
                // console.log(e.message);
                // just move on
            }
            try {
                yield this.storage.createBucket(name, options);
                this.bucketNames.push(name);
                return "bucket created";
            }
            catch (e) {
                // console.log("ERROR", e.message, e.code);
                if (e.code === 409 &&
                    e.message === "You already own this bucket. Please select another name.") {
                    // error code 409 can have messages like:
                    // "You already own this bucket. Please select another name." (bucket exists!)
                    // "Sorry, that name is not available. Please try a different one." (notably bucket name "new-bucket")
                    // So in some cases we can safely ignore this error, in some case we can't
                    return;
                }
                throw new Error(e.message);
            }
            // ossia:
            // await this.storage
            //   .createBucket(n)
            //   .then(() => {
            //     this.bucketNames.push(n);
            //     return "bucket created";
            //   })
            //   .catch(e => {
            //     if (e.code === 409) {
            //       // error code 409 is 'You already own this bucket. Please select another name.'
            //       // so we can safely return true if this error occurs
            //       return;
            //     }
            //     throw new Error(e.message);
            //   });
        });
    }
    selectBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name === null) {
                this.bucketName = "";
                return `bucket '${name}' deselected`;
            }
            // const [error] = await to(this.createBucket(name));
            // if (error !== null) {
            //   throw error;
            // }
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
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            yield this.storage.bucket(n).deleteFiles({ force: true });
            return "bucket cleared";
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            yield this.clearBucket(n);
            const data = yield this.storage.bucket(n).delete();
            // console.log(data);
            if (n === this.bucketName) {
                this.bucketName = "";
            }
            this.bucketNames = this.bucketNames.filter((b) => b !== n);
            return "bucket deleted";
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            const [buckets] = yield this.storage.getBuckets();
            this.bucketNames = buckets.map((b) => b.metadata.id);
            return this.bucketNames;
        });
    }
    getMetaData(files) {
        return __awaiter(this, void 0, void 0, function* () {
            const sizes = [];
            for (let i = 0; i < files.length; i += 1) {
                const file = this.storage.bucket(this.bucketName).file(files[i]);
                const [metadata] = yield file.getMetadata();
                // console.log(metadata);
                sizes.push(parseInt(metadata.size, 10));
            }
            return sizes;
        });
    }
    listFiles(numFiles = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const data = yield this.storage.bucket(this.bucketName).getFiles();
            const names = data[0].map((f) => f.name);
            const sizes = yield this.getMetaData(names);
            return (0, zip_1.default)(names, sizes);
        });
    }
    sizeOf(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const file = this.storage.bucket(this.bucketName).file(name);
            const [metadata] = yield file.getMetadata();
            return parseInt(metadata.size, 10);
        });
    }
    fileExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.storage.bucket(this.bucketName).file(name).exists();
            // console.log(data);
            return data[0];
        });
    }
}
exports.AdapterGoogleCloudStorage = AdapterGoogleCloudStorage;
//# sourceMappingURL=AdapterGoogleCloudStorage.js.map