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
exports.AdapterAmazonS3 = void 0;
const fs_1 = __importDefault(require("fs"));
const AbstractAdapter_1 = require("./AbstractAdapter");
const client_s3_1 = require("@aws-sdk/client-s3");
const types_1 = require("./types");
const util_1 = require("./util");
class AdapterAmazonS3 extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super();
        this.type = types_1.StorageType.S3;
        this.bucketNames = [];
        this.region = "";
        this.config = this.parseConfig(config);
        if (typeof this.config.bucketName !== "undefined") {
            const msg = this.validateName(this.config.bucketName);
            if (msg !== null) {
                throw new Error(msg);
            }
            this.bucketName = this.config.bucketName;
        }
        if (typeof this.config.region !== "undefined") {
            this.region = this.config.region;
        }
        this.storage = new client_s3_1.S3(this.config);
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
    parseConfig(config) {
        let cfg;
        if (typeof config === "string") {
            const { type, part1: accessKeyId, part2: secretAccessKey, part3: region, bucketName, queryString, } = (0, util_1.parseUrl)(config);
            cfg = Object.assign({ type,
                accessKeyId,
                secretAccessKey,
                region,
                bucketName }, queryString);
        }
        else {
            cfg = Object.assign({}, config);
        }
        if (cfg.skipCheck === true) {
            return cfg;
        }
        if (!cfg.accessKeyId || !cfg.secretAccessKey) {
            throw new Error("You must specify a value for both 'applicationKeyId' and  'applicationKey' for storage type 's3'");
        }
        if (!cfg.region) {
            throw new Error("You must specify a default region for storage type 's3'");
        }
        return cfg;
    }
    getFileAsReadable(fileName, options = { start: 0 }) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                Bucket: this.bucketName,
                Key: fileName,
                Range: `bytes=${options.start}-${options.end || ""}`,
            };
            yield this.storage.headObject(params);
            return (yield this.storage.getObject(params)).Body;
        });
    }
    removeFile(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                Bucket: this.bucketName,
                Key: fileName,
            };
            yield this.storage.deleteObject(params);
            return "file removed";
        });
    }
    // util members
    createBucket(name, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = this.validateName(name);
            if (msg !== null) {
                return Promise.reject(msg);
            }
            if (this.bucketNames.findIndex((b) => b === name) !== -1) {
                return;
            }
            try {
                yield this.storage.headBucket({ Bucket: name });
                this.bucketNames.push(name);
            }
            catch (e) {
                if (e.code === "Forbidden") {
                    // BucketAlreadyExists
                    console.log(e);
                    const msg = [
                        "The requested bucket name is not available.",
                        "The bucket namespace is shared by all users of the system.",
                        "Please select a different name and try again.",
                    ];
                    return Promise.reject(msg.join(" "));
                }
                yield this.storage.createBucket(Object.assign(Object.assign({}, options), { Bucket: name }));
                this.bucketNames.push(name);
            }
        });
    }
    selectBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            // add check if bucket exists!
            if (!name) {
                this.bucketName = "";
                return `bucket '${name}' deselected`;
            }
            yield this.createBucket(name);
            this.bucketName = name;
            return `bucket '${name}' selected`;
        });
    }
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            if (!n) {
                throw new Error("no bucket selected");
            }
            const params1 = {
                Bucket: n,
                MaxKeys: 1000,
            };
            const { Contents } = yield this.storage.listObjects(params1);
            if (!Contents || Contents.length === 0) {
                return;
            }
            const params2 = {
                Bucket: n,
                Delete: {
                    Objects: Contents.map((value) => ({ Key: value.Key })),
                    Quiet: false,
                },
            };
            yield this.storage.deleteObjects(params2);
            return "bucket cleared";
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            if (n === "") {
                throw new Error("no bucket selected");
            }
            try {
                yield this.clearBucket(name);
                yield this.storage.deleteBucket({ Bucket: n });
                if (n === this.bucketName) {
                    this.bucketName = "";
                }
                this.bucketNames = this.bucketNames.filter((b) => b !== n);
                return "bucket deleted";
            }
            catch (e) {
                if (e.code === "NoSuchBucket") {
                    throw new Error("bucket not found");
                }
                throw e;
            }
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.storage.listBuckets({});
            this.bucketNames = data.Buckets.map((d) => d.Name);
            return this.bucketNames;
        });
    }
    store(arg, targetPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            if (typeof options !== "object") {
                options = {};
            }
            yield this.createBucket(this.bucketName);
            const params = Object.assign(Object.assign({}, options), { Bucket: this.bucketName, Key: targetPath, Body: arg });
            if (typeof arg === "string") {
                if (!fs_1.default.existsSync(arg)) {
                    throw new Error(`File with given path: ${arg}, was not found`);
                }
                params.Body = fs_1.default.createReadStream(arg);
            }
            yield this.storage.putObject(params);
            if (this.region !== "") {
                this.region = (yield this.storage.getBucketLocation({ Bucket: this.bucketName })).LocationConstraint;
            }
            return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${targetPath}`;
        });
    }
    listFiles(maxFiles = 1000) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const params = {
                Bucket: this.bucketName,
                MaxKeys: maxFiles,
            };
            const { Contents } = yield this.storage.listObjects(params);
            if (!Contents) {
                return [];
            }
            return Contents.map((o) => [o.Key, o.Size]);
        });
    }
    sizeOf(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const params = {
                Bucket: this.bucketName,
                Key: name,
            };
            return yield this.storage.headObject(params).then((res) => res.ContentLength);
        });
    }
    fileExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const params = {
                Bucket: this.bucketName,
                Key: name,
            };
            return yield this.storage
                .headObject(params)
                .then(() => true)
                .catch(() => false);
        });
    }
}
exports.AdapterAmazonS3 = AdapterAmazonS3;
//# sourceMappingURL=AdapterAmazonS3.js.map