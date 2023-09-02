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
    constructor(config) {
        this.switchAdapter(config);
    }
    getType() {
        return this.adapter.getType();
    }
    // public getOptions(): TypeJSON {
    //   return this.adapter.getOptions();
    // }
    getConfiguration() {
        return this.adapter.getConfiguration();
    }
    switchAdapter(args) {
        // console.log(args);
        let type;
        if (typeof args === "string") {
            type = args.substring(0, args.indexOf("://"));
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
            this.adapter = new AdapterClass(args);
        }
        else if (adapterFunctions[type]) {
            const name = adapterFunctions[type];
            const module = require(path_1.default.join(__dirname, name));
            this.adapter = module.createAdapter(args);
        }
    }
    // all methods below are implementing IStorage
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.init();
        });
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.test();
        });
    }
    addFileFromBuffer(buffer, targetPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.addFileFromBuffer(buffer, targetPath, options);
        });
    }
    addFileFromPath(origPath, targetPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.addFileFromPath(origPath, targetPath, options);
        });
    }
    addFileFromReadable(stream, targetPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.addFileFromReadable(stream, targetPath, options);
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
    getSelectedBucket() {
        return this.adapter.getSelectedBucket();
    }
    getFileAsReadable(name, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { start = 0, end } = options;
            // console.log(start, end, options);
            return this.adapter.getFileAsReadable(name, { start, end });
        });
    }
    getFileAsURL(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.getFileAsURL(name);
        });
    }
    removeFile(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.removeFile(fileName);
        });
    }
    listFiles(numFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.listFiles(numFiles);
        });
    }
    selectBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.selectBucket(name);
        });
    }
    sizeOf(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.sizeOf(name);
        });
    }
    fileExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.adapter.fileExists(name);
        });
    }
}
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map