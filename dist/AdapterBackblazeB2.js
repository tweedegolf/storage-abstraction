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
exports.AdapterBackblazeB2 = void 0;
const backblaze_b2_1 = __importDefault(require("backblaze-b2"));
const AbstractAdapter_1 = require("./AbstractAdapter");
const types_1 = require("./types");
const util_1 = require("./util");
require("@gideo-llc/backblaze-b2-upload-any").install(backblaze_b2_1.default);
class AdapterBackblazeB2 extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super();
        this.type = types_1.StorageType.B2;
        this.buckets = [];
        this.files = [];
        this.config = this.parseConfig(config);
        if (typeof this.config.bucketName !== "undefined") {
            const msg = this.validateName(this.config.bucketName);
            if (msg !== null) {
                throw new Error(msg);
            }
            this.bucketName = this.config.bucketName;
        }
        this.storage = new backblaze_b2_1.default(this.config);
    }
    parseConfig(config) {
        let cfg;
        if (typeof config === "string") {
            const { type, part1: applicationKeyId, part2: applicationKey, bucketName, queryString, } = (0, util_1.parseUrl)(config);
            cfg = Object.assign({ type,
                applicationKeyId,
                applicationKey,
                bucketName }, queryString);
        }
        else {
            cfg = Object.assign({}, config);
        }
        if (cfg.skipCheck === true) {
            return cfg;
        }
        if (!cfg.applicationKey || !cfg.applicationKeyId) {
            throw new Error("You must specify a value for both 'applicationKeyId' and  'applicationKey' for storage type 'b2'");
        }
        return cfg;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("init()", this.initialized, this.bucketName);
            if (this.initialized) {
                return Promise.resolve(true);
            }
            try {
                yield this.storage.authorize();
            }
            catch (e) {
                throw new Error(e.message);
            }
            // check if the bucket already exists
            if (this.bucketName) {
                // create new bucket if it doesn't exist
                yield this.createBucket(this.bucketName);
                this.bucketId = this.getBucketId();
            }
            this.initialized = true;
            return true;
        });
    }
    getBucketId() {
        // console.log(this.buckets);
        const index = this.buckets.findIndex((b) => b.bucketName === this.bucketName);
        if (index !== -1) {
            return this.buckets[index].bucketId;
        }
    }
    getFileAsReadable(name, options = { start: 0 }) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = yield this.findFile(name);
            if (file === null) {
                throw new Error("file not found");
            }
            const d = yield this.storage.downloadFileById({
                fileId: file.fileId,
                responseType: "stream",
                axios: {
                    headers: {
                        "Content-Type": file.contentType,
                        Range: `bytes=${options.start}-${options.end || ""}`,
                    },
                },
            });
            return d.data;
        });
    }
    removeFile(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const file = yield this.findFile(name);
            if (file === null) {
                return "file not found";
            }
            const { data: { files }, } = yield this.storage.listFileVersions({
                bucketId: this.bucketId,
            });
            Promise.all(files
                .filter((f) => f.fileName === name)
                .map(({ fileId, fileName }) => this.storage.deleteFileVersion({
                fileId,
                fileName,
            })));
            this.files = this.files.filter((file) => file.fileName !== name);
            return "file removed";
        });
    }
    // util function for findBucket
    findBucketLocal(name) {
        if (this.buckets.length === 0) {
            return null;
        }
        const index = this.buckets.findIndex((b) => b.bucketName === name);
        if (index !== -1) {
            return this.buckets[index];
        }
        return null;
    }
    // check if we have accessed and stored the bucket earlier
    findBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const b = this.findBucketLocal(name);
            if (b !== null) {
                return b;
            }
            yield this.listBuckets();
            return this.findBucketLocal(name);
        });
    }
    getSelectedBucket() {
        return this.bucketName;
    }
    store(arg, targetPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            yield this.createBucket(this.bucketName);
            try {
                const file = yield this.storage.uploadAny(Object.assign(Object.assign({}, options), { bucketId: this.bucketId, fileName: targetPath, data: arg }));
                this.files.push(file);
                return `${this.storage.downloadUrl}/file/${this.bucketName}/${targetPath}`;
            }
            catch (e) {
                return Promise.reject();
            }
        });
    }
    createBucket(name, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = this.validateName(name);
            if (msg !== null) {
                return Promise.reject(msg);
            }
            const b = yield this.findBucket(name);
            if (b !== null) {
                return;
            }
            const d = yield this.storage
                .createBucket(Object.assign(Object.assign({}, options), { bucketName: name, bucketType: "allPrivate" }))
                .catch((e) => {
                throw new Error(e.response.data.message);
            });
            this.buckets.push(d.data);
            // console.log("createBucket", this.buckets, d.data);
            return "bucket created";
        });
    }
    selectBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!name) {
                this.bucketName = "";
                return `bucket '${name}' deselected`;
            }
            if (name === this.bucketName) {
                return `bucket '${name}' selected`;
            }
            const b = yield this.findBucket(name);
            if (b !== null) {
                this.bucketName = name;
                this.bucketId = b.bucketId;
                this.files = [];
                return `bucket '${name}' selected`;
            }
            // return `bucket ${name} not found`;
            yield this.createBucket(name);
            this.bucketName = name;
            this.bucketId = this.getBucketId();
            this.files = [];
            return `bucket '${name}' selected`;
        });
    }
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            const b = yield this.findBucket(n);
            if (b === null) {
                throw new Error("bucket not found");
            }
            const { data: { files }, } = yield this.storage.listFileVersions({
                bucketId: b.bucketId,
            });
            yield Promise.all(files.map((file) => this.storage.deleteFileVersion({
                fileId: file.fileId,
                fileName: file.fileName,
            })));
            return "bucket cleared";
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            const b = yield this.findBucket(n);
            if (b === null) {
                throw new Error("bucket not found");
            }
            try {
                yield this.clearBucket(n);
            }
            catch (e) {
                return e.response.data.message;
            }
            const { bucketId } = b;
            try {
                yield this.storage.deleteBucket({ bucketId });
            }
            catch (e) {
                return e.response.data.message;
            }
            this.buckets = this.buckets.filter((b) => b.bucketName !== n);
            this.bucketId = "";
            this.bucketName = "";
            return "bucket deleted";
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: { buckets }, } = yield this.storage.listBuckets();
            // this.bucketsById = buckets.reduce((acc: { [id: string]: string }, val: BackBlazeB2Bucket) => {
            //   acc[val.bucketId] = val.bucketName;
            //   return acc;
            // }, {});
            this.buckets = buckets;
            const names = this.buckets.map((b) => b.bucketName);
            return names;
        });
    }
    listFiles(numFiles = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("ID", this.bucketId);
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const { data: { files, nextFileName }, } = yield this.storage.listFileNames({
                bucketId: this.bucketId,
                maxFileCount: numFiles,
            });
            // console.log(files);
            this.files = [...files];
            // @TODO; should loop this until all files are listed
            if (nextFileName !== null) {
                // console.log(nextFileName);
                this.nextFileName = nextFileName;
            }
            return this.files.map((f) => [f.fileName, f.contentLength]);
        });
    }
    findFile(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = this.files.findIndex((file) => file.fileName === name);
            if (i > -1) {
                return this.files[i];
            }
            const { data: { files }, } = yield this.storage.listFileNames({ bucketId: this.bucketId });
            this.files = files;
            i = this.files.findIndex((file) => file.fileName === name);
            if (i > -1) {
                return this.files[i];
            }
            return null;
        });
    }
    sizeOf(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const file = yield this.findFile(name);
            if (file === null) {
                throw new Error("File not found");
            }
            return file.contentLength;
        });
    }
    fileExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const file = yield this.findFile(name);
            if (file === null) {
                return false;
            }
            return true;
        });
    }
}
exports.AdapterBackblazeB2 = AdapterBackblazeB2;
//# sourceMappingURL=AdapterBackblazeB2.js.map