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
exports.AbstractAdapter = void 0;
const fs_1 = __importDefault(require("fs"));
const general_1 = require("./types/general");
const util_1 = require("./util");
class AbstractAdapter {
    constructor(config) {
        this._provider = general_1.Provider.NONE;
        this._configError = null;
        this._bucketName = null;
    }
    get provider() {
        return this._provider;
    }
    getProvider() {
        return this.provider;
    }
    get config() {
        return this._config;
    }
    getConfig() {
        return this.config;
    }
    get configError() {
        return this._configError;
    }
    getConfigError() {
        return this.configError;
    }
    // eslint-disable-next-line
    get serviceClient() {
        return this._client;
    }
    // eslint-disable-next-line
    getServiceClient() {
        return this._client;
    }
    setSelectedBucket(bucketName) {
        this._bucketName = bucketName;
    }
    getSelectedBucket() {
        return this._bucketName;
    }
    set selectedBucket(bucketName) {
        this._bucketName = bucketName;
    }
    get selectedBucket() {
        return this._bucketName;
    }
    set bucketName(bucketName) {
        this._bucketName = bucketName;
    }
    get bucketName() {
        return this._bucketName;
    }
    getFileAndBucketAndOptions(...args) {
        const [arg1, arg2, arg3] = args;
        // console.log("getFileAndBucketAndOptions", arg1, arg2, arg3);
        let bucketName = undefined;
        let fileName = undefined;
        let options = {};
        let error = null;
        if (typeof arg1 !== "string" && typeof arg2 !== "string") {
            return { bucketName, fileName, options, error: "Please provide a filename" };
        }
        if (typeof arg1 === "string" && typeof arg2 === "string") {
            bucketName = arg1;
            fileName = arg2;
            if (typeof arg3 === "object" || typeof arg3 === "boolean") {
                options = arg3;
            }
            return { bucketName, fileName, options, error };
        }
        if (typeof arg1 !== "string" && typeof arg2 === "string") {
            bucketName = this._bucketName === null ? undefined : this._bucketName;
            if (bucketName === null) {
                return { bucketName, fileName, options, error: "Please provide or select a bucket" };
            }
            fileName = arg2;
            if (typeof arg3 === "object" || typeof arg3 === "boolean") {
                options = arg3;
            }
            return { bucketName, fileName, options, error };
        }
        if (typeof arg1 === "string" && typeof arg2 !== "string") {
            bucketName = this._bucketName === null ? undefined : this._bucketName;
            if (bucketName === null) {
                return { bucketName, fileName, options, error: "Please provide or select a bucket" };
            }
            fileName = arg1;
            if (typeof arg2 === "object" || typeof arg2 === "boolean") {
                options = arg2;
            }
            return { bucketName, fileName, options, error };
        }
        if (bucketName === null) {
            return { bucketName, fileName, options, error: "Please provide or select a bucket" };
        }
        if (fileName === null) {
            return { bucketName, fileName, options, error: "Please provide a filename" };
        }
        return { bucketName, fileName, options, error };
    }
    checkBucket(name_1) {
        return __awaiter(this, arguments, void 0, function* (name, checkIfExists = true) {
            if (this._configError !== null) {
                return { value: null, error: this.configError };
            }
            if (typeof name === "undefined") {
                if (this._bucketName === null) {
                    return {
                        value: null,
                        error: "No bucket selected.",
                    };
                }
                name = this._bucketName;
            }
            if (checkIfExists === true) {
                const { value, error } = yield this._bucketExists(name);
                if (error !== null) {
                    return { value: null, error };
                }
                else if (value === false) {
                    return { value: null, error: `No bucket '${name}' found.` };
                }
            }
            return { value: name, error: null };
        });
    }
    checkFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = yield this._fileExists(bucketName, fileName);
            if (r.error) {
                return { value: null, error: r.error };
            }
            if (r.value === false) {
                return { value: null, error: `No file '${fileName}' found in bucket '${bucketName}'` };
            }
            return { value: null, error: null };
        });
    }
    // public
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._configError !== null) {
                return { value: null, error: this.configError };
            }
            return this._listBuckets();
        });
    }
    createBucket(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._configError !== null) {
                return { value: null, error: this.configError };
            }
            const [arg1, arg2] = args;
            let name;
            if (typeof arg1 !== "string") {
                if (this._bucketName === null) {
                    return {
                        value: null,
                        error: "No bucket selected.",
                    };
                }
                name = this._bucketName;
            }
            else {
                name = arg1;
                const error = (0, util_1.validateName)(name, this.provider);
                if (error !== null) {
                    return { value: null, error };
                }
            }
            const { value, error } = yield this.bucketExists(name);
            if (error !== null) {
                return { value: null, error };
            }
            else if (value === true) {
                return { value: null, error: `Bucket '${name}' already exists.` };
            }
            return this._createBucket(name, arg2 || {});
        });
    }
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = yield this.checkBucket(name, true);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            name = r.value;
            return this._clearBucket(name);
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = yield this.checkBucket(name, true);
            if (r.error !== null) {
                if (r.error === `No bucket '${name}' found.`) {
                    return { value: r.error, error: null };
                }
                else {
                    return r;
                }
            }
            name = r.value;
            const data = yield this._clearBucket(name);
            if (data.error !== null) {
                return { value: null, error: data.error };
            }
            const r2 = yield this._deleteBucket(name);
            if (r2.error === null) {
                if (this.selectedBucket === name) {
                    this.selectedBucket = null;
                }
            }
            return r2;
        });
    }
    bucketExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = yield this.checkBucket(name, false);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            name = r.value;
            return this._bucketExists(name);
        });
    }
    bucketIsPublic(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = yield this.checkBucket(name, true);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            name = r.value;
            return this._bucketIsPublic(name);
        });
    }
    listFiles(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const [arg1, arg2] = args;
            let bucketName = undefined;
            let numFiles = 10000;
            if (typeof arg1 === "number") {
                numFiles = arg1;
            }
            else if (typeof arg1 === "string") {
                bucketName = arg1;
                if (typeof arg2 === "number") {
                    numFiles = arg2;
                }
            }
            const r = yield this.checkBucket(bucketName, true);
            if (r.error) {
                return { value: null, error: r.error };
            }
            // console.log(bucketName, numFiles)
            return this._listFiles(r.value, numFiles);
        });
    }
    addFileFromPath(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.addFile(params);
        });
    }
    addFileFromBuffer(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.addFile(params);
        });
    }
    addFileFromStream(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.addFile(params);
        });
    }
    addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName: _fn, options, error, } = this.getFileAndBucketAndOptions(params.bucketName, params.targetPath, params.options);
            if (error !== null) {
                return { value: null, error: error };
            }
            // console.log(bucketName, _fn, options, error);
            const r = yield this.checkBucket(bucketName);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            else {
                params.bucketName = r.value;
                params.options = options === null ? {} : options;
            }
            let fh = null;
            if (typeof params.origPath === "string") {
                const f = params.origPath;
                try {
                    fh = yield fs_1.default.promises.open(f);
                }
                catch (e) {
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
                const readStream = fs_1.default.createReadStream(f);
                params = {
                    bucketName: params.bucketName,
                    options: params.options,
                    stream: readStream,
                    targetPath: params.targetPath,
                };
            }
            const r2 = yield this._addFile(params);
            if (fh !== null) {
                fh.close();
            }
            return r2;
        });
    }
    getFileAsStream(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName, options, error } = this.getFileAndBucketAndOptions(...args);
            // console.log(bucketName, fileName, options, error);
            if (error !== null) {
                return { value: null, error: error };
            }
            const r = yield this.checkBucket(bucketName);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            const r2 = yield this.checkFile(r.value, fileName);
            if (r2.error !== null) {
                return { value: null, error: r2.error };
            }
            return this._getFileAsStream(r.value, fileName, options === null ? {} : options);
        });
    }
    getPublicURL(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName, options: opt, error } = this.getFileAndBucketAndOptions(...args);
            if (error !== null) {
                return { value: null, error: error };
            }
            const r = yield this.checkBucket(bucketName);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            const r2 = yield this.checkFile(r.value, fileName);
            if (r2.error !== null) {
                return { value: null, error: r2.error };
            }
            const options = opt === null ? {} : opt;
            if (options.noCheck !== true && this.provider !== general_1.Provider.CUBBIT /*ouch!*/ && this.provider !== general_1.Provider.CLOUDFLARE /*ugly!*/) {
                const result = yield this._bucketIsPublic(bucketName);
                if (result.error !== null) {
                    return { value: null, error: result.error };
                }
                if (result.value === false) {
                    return { value: null, error: `Bucket "${bucketName}" is not public!` };
                }
            }
            return this._getPublicURL(r.value, fileName, options);
        });
    }
    getSignedURL(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName, options, error } = this.getFileAndBucketAndOptions(...args);
            if (error !== null) {
                return { value: null, error: error };
            }
            const r = yield this.checkBucket(bucketName);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            const r2 = yield this.checkFile(r.value, fileName);
            if (r2.error !== null) {
                return { value: null, error: r2.error };
            }
            return this._getSignedURL(r.value, fileName, options === null ? {} : options);
        });
    }
    sizeOf(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName, options: _o, error } = this.getFileAndBucketAndOptions(...args);
            if (error !== null) {
                return { value: null, error: error };
            }
            const r = yield this.checkBucket(bucketName);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            const r2 = yield this.checkFile(r.value, fileName);
            if (r2.error !== null) {
                return { value: null, error: r2.error };
            }
            return this._sizeOf(r.value, fileName);
        });
    }
    fileExists(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName, options: _o, error } = this.getFileAndBucketAndOptions(...args);
            if (error !== null) {
                return { value: null, error: error };
            }
            const r = yield this.checkBucket(bucketName);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            return this._fileExists(r.value, fileName);
        });
    }
    removeFile(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName, options: _allVersions, error, } = this.getFileAndBucketAndOptions(...args);
            if (error !== null) {
                return { value: null, error: error };
            }
            const r = yield this.checkBucket(bucketName);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            // check if file exists, this is especially necessary for Backblaze B2 with S3 adapter!
            const r2 = yield this.checkFile(r.value, fileName);
            if (r2.error !== null) {
                if (r2.error.startsWith(`No file '${fileName}' found in bucket`)) {
                    return { value: r2.error, error: null };
                }
                else {
                    return { value: null, error: r2.error };
                }
            }
            return this._removeFile(bucketName, fileName);
        });
    }
    getPresignedUploadURL(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const { bucketName, fileName, options, error } = this.getFileAndBucketAndOptions(...args);
            if (error !== null) {
                return { value: null, error: error };
            }
            const r = yield this.checkBucket(bucketName);
            if (r.error !== null) {
                return { value: null, error: r.error };
            }
            return this._getPresignedUploadURL(r.value, fileName, options);
        });
    }
}
exports.AbstractAdapter = AbstractAdapter;
//# sourceMappingURL=AbstractAdapter.js.map