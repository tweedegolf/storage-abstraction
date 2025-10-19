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
const adapters_1 = require("./adapters");
const availableAdapters = (0, adapters_1.getAvailableAdapters)();
// console.log(availableAdapters)
/**
 * @implements {IAdapter}
 */
class Storage {
    // public ready: Promise<void>;
    constructor(config) {
        // this.ready = this.switchAdapter(config);
        this.switchAdapter(config);
    }
    // public async switchAdapter(config: string | AdapterConfig): Promise<void> {
    switchAdapter(config) {
        // console.log(config);
        // at this point we are only interested in the type of the config
        let provider;
        if (typeof config === "string") {
            if (config.indexOf("://") !== -1) {
                provider = config.substring(0, config.indexOf("://"));
            }
            else {
                // you can also pass a string that only contains the type, e.g. "gcs"
                provider = config;
            }
        }
        else {
            provider = config.provider;
        }
        // console.log("provider", provider);
        // console.log("adapterClasses", adapterClasses);
        // console.log("class", adapterClasses[provider], "function", adapterFunctions[type]);
        if (!adapters_1.adapterClasses[provider] && !adapters_1.adapterFunctions[provider]) {
            throw new Error(`unsupported storage type, must be one of ${availableAdapters}`);
        }
        if (adapters_1.adapterClasses[provider]) {
            const adapterName = adapters_1.adapterClasses[provider][0];
            const adapterPath = adapters_1.adapterClasses[provider][1];
            // const AdapterClass = require(path.join(__dirname, name));
            let AdapterClass; // eslint-disable-line
            try {
                AdapterClass = require(adapterPath)[adapterName];
                // console.log(`using remote adapter class ${adapterName}`);
            }
            catch (e) {
                // console.log(`using local adapter class ${adapterName}`);
                // console.log(e.message);
                try {
                    AdapterClass = require(path_1.default.join(__dirname, adapterName))[adapterName];
                }
                catch (e) {
                    if (e instanceof Error) {
                        throw e.message;
                    }
                    else {
                        throw e;
                    }
                }
            }
            this._adapter = new AdapterClass(config);
            // const AdapterClass = await import(`./${name}`);
            // this.adapter = new AdapterClass[name](args);
        }
        else if (adapters_1.adapterFunctions[provider]) {
            const adapterName = adapters_1.adapterClasses[provider][0];
            const adapterPath = adapters_1.adapterClasses[provider][1];
            // const module = require(path.join(__dirname, name));
            let module; // eslint-disable-line
            try {
                module = require(adapterPath);
            }
            catch (e) {
                module = require(require(path_1.default.join(__dirname, adapterPath)));
            }
            this._adapter = module.createAdapter(config);
        }
    }
    // introspective adapter API
    setSelectedBucket(bucketName) {
        this.adapter.bucketName = bucketName;
    }
    set selectedBucket(bucketName) {
        this.adapter.bucketName = bucketName;
    }
    getSelectedBucket() {
        return this.adapter.bucketName;
    }
    get selectedBucket() {
        return this.adapter.bucketName;
    }
    set bucketName(bucketName) {
        this.adapter.bucketName = bucketName;
    }
    get bucketName() {
        return this.adapter.bucketName;
    }
    get adapter() {
        return this._adapter;
    }
    getAdapter() {
        return this.adapter;
    }
    get provider() {
        return this.adapter.provider;
    }
    getProvider() {
        return this.adapter.provider;
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
    // public adapter API
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
    createBucket(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.createBucket(...args);
        });
    }
    clearBucket(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.clearBucket(bucketName);
        });
    }
    deleteBucket(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.deleteBucket(bucketName);
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.listBuckets();
        });
    }
    getFileAsStream(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getFileAsStream(...args);
        });
    }
    getPublicURL(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getPublicURL(...args);
        });
    }
    getSignedURL(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getSignedURL(...args);
        });
    }
    removeFile(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.removeFile(...args);
        });
    }
    listFiles(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.listFiles(...args);
        });
    }
    sizeOf(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.sizeOf(...args);
        });
    }
    bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.bucketExists(bucketName);
        });
    }
    bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.bucketIsPublic(bucketName);
        });
    }
    fileExists(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.fileExists(...args);
        });
    }
    getPresignedUploadURL(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getPresignedUploadURL(...args);
        });
    }
}
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map