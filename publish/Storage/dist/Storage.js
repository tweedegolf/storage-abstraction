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
exports.Storage = void 0;
const path_1 = __importDefault(require("path"));
//  add new storage adapters here
const adapterClasses = {
    b2: "AdapterBackblazeB2",
    s3: "AdapterAmazonS3",
    gcs: "AdapterGoogleCloudStorage",
    local: "AdapterLocal",
    azure: "AdapterAzureStorageBlob",
    minio: "AdapterMinio",
};
// or here for functional adapters
const adapterFunctions = {
    b2f: "AdapterBackblazeB2F",
};
const availableAdapters = Object.keys(adapterClasses)
    .concat(Object.keys(adapterFunctions))
    .reduce((acc, val) => {
    if (acc.findIndex((v) => v === val) === -1) {
        acc.push(val);
    }
    return acc;
}, [])
    .sort()
    .join(", ");
class Storage {
    // public ready: Promise<void>;
    constructor(config) {
        // this.ready = this.switchAdapter(config);
        this.switchAdapter(config);
    }
    get adapter() {
        return this._adapter;
    }
    getAdapter() {
        return this.adapter;
    }
    // public async switchAdapter(args: string | AdapterConfig): Promise<void> {
    switchAdapter(args) {
        // console.log(args);
        let type;
        if (typeof args === "string") {
            if (args.indexOf("://") !== -1) {
                type = args.substring(0, args.indexOf("://"));
            }
            else {
                type = args;
            }
        }
        else {
            type = args.type;
        }
        // console.log("type", type);
        // console.log("class", adapterClasses[type], "function", adapterFunctions[type]);
        if (!adapterClasses[type] && !adapterFunctions[type]) {
            throw new Error(`unsupported storage type, must be one of ${availableAdapters}`);
        }
        if (adapterClasses[type]) {
            const name = adapterClasses[type];
            const AdapterClass = require(path_1.default.join(__dirname, name))[name];
            this._adapter = new AdapterClass(args);
            // const AdapterClass = await import(`./${name}`);
            // this.adapter = new AdapterClass[name](args);
        }
        else if (adapterFunctions[type]) {
            const name = adapterFunctions[type];
            // const module = require(path.join(__dirname, name));
            const module = require(path_1.default.join(__dirname, name));
            this._adapter = module.createAdapter(args);
        }
    }
    // all methods below are implementing IStorage
    get type() {
        return this.adapter.type;
    }
    getType() {
        return this.adapter.type;
    }
    get config() {
        return this.adapter.config;
    }
    getConfig() {
        return this.adapter.config;
    }
    get configError() {
        return this.adapter.configError;
    }
    getConfigError() {
        return this.adapter.configError;
    }
    //eslint-disable-next-line
    get serviceClient() {
        return this.adapter.serviceClient;
    }
    //eslint-disable-next-line
    getServiceClient() {
        return this.adapter.serviceClient;
    }
    addFile(paramObject) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.addFile(paramObject);
        });
    }
    addFileFromPath(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.addFileFromPath(params);
        });
    }
    addFileFromBuffer(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.addFileFromBuffer(params);
        });
    }
    addFileFromStream(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.addFileFromStream(params);
        });
    }
    createBucket(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.createBucket(name, options);
        });
    }
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.clearBucket(name);
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.deleteBucket(name);
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.listBuckets();
        });
    }
    getFileAsStream(bucketName, fileName, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getFileAsStream(bucketName, fileName, options);
        });
    }
    getFileAsURL(bucketName, fileName, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getFileAsURL(bucketName, fileName, options);
        });
    }
    removeFile(bucketName, fileName, allVersions = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.removeFile(bucketName, fileName, allVersions);
        });
    }
    listFiles(bucketName, numFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.listFiles(bucketName, numFiles);
        });
    }
    sizeOf(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.sizeOf(bucketName, fileName);
        });
    }
    bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.bucketExists(bucketName);
        });
    }
    fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.fileExists(bucketName, fileName);
        });
    }
}
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map