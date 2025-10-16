"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterMinio = void 0;
const Minio = __importStar(require("minio"));
const stream_1 = require("stream");
const AbstractAdapter_1 = require("./AbstractAdapter");
const general_1 = require("./types/general");
const util_1 = require("./util");
class AdapterMinio extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._provider = general_1.Provider.MINIO;
        this._configError = null;
        if (typeof config !== "string") {
            this._config = Object.assign({}, config);
        }
        else {
            const { value, error } = (0, util_1.parseUrl)(config);
            if (value === null) {
                this._configError = `[configError] ${error}`;
            }
            else {
                const { protocol: type, username: accessKey, password: secretKey, host: bucketName, searchParams, } = value;
                let endPoint;
                if (searchParams !== null) {
                    ({ endPoint } = searchParams);
                    delete searchParams.endPoint;
                }
                if (accessKey === null || secretKey === null || typeof endPoint === "undefined") {
                    this._configError = 'Please provide a value for "accessKey", "secretKey and "endPoint"';
                    return;
                }
                this._config = { type, accessKey, secretKey, endPoint };
                if (bucketName !== null) {
                    this._config.bucketName = bucketName;
                }
            }
            // console.log(this._config);
        }
        if (!this.config.accessKey || !this.config.secretKey || !this.config.endPoint) {
            this._configError = 'Please provide a value for "accessKey", "secretKey and "endPoint"';
        }
        else {
            const useSSL = this.config.useSSL;
            if (typeof useSSL === "undefined") {
                this.config.useSSL = true;
            }
            if (typeof useSSL === "string") {
                this.config.useSSL = useSSL === "true";
            }
            const port = this.config.port;
            if (typeof port === "undefined") {
                this.config.port = this.config.useSSL ? 443 : 80;
            }
            if (typeof port === "string") {
                this.config.port = parseInt(port, 10);
            }
            const region = this.config.region;
            if (typeof region !== "string") {
                // this.config.region = "auto";
                this.config.region = "us-east-1";
            }
            // console.log(useSSL, port, region);
            const c = {
                endPoint: this.config.endPoint,
                region: this.config.region,
                port: this.config.port,
                useSSL: this.config.useSSL,
                accessKey: this.config.accessKey,
                secretKey: this.config.secretKey,
            };
            // console.log(c);
            try {
                this._client = new Minio.Client(c);
            }
            catch (e) {
                this._configError = `[configError] ${(0, util_1.getErrorMessage)(e)}`;
            }
        }
        if (typeof this.config.bucketName !== "undefined") {
            this._bucketName = this.config.bucketName;
        }
    }
    // protected, called by methods of public API via AbstractAdapter
    _listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const buckets = yield this._client.listBuckets();
                return { value: buckets.map((b) => b.name), error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _createBucket(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const e = yield this._client.bucketExists(name);
                if (e) {
                    return { value: null, error: "bucket exists" };
                }
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
            try {
                const { region } = this._config;
                yield this._client.makeBucket(name, region, options);
                if (options.public === true) {
                    const publicReadPolicy = {
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Effect: "Allow",
                                Principal: { AWS: ["*"] },
                                Action: ["s3:GetObject"],
                                Resource: [`arn:aws:s3:::${name}/*`],
                            },
                        ],
                    };
                    // Set the bucket policy to public read
                    yield this._client.setBucketPolicy(name, JSON.stringify(publicReadPolicy));
                }
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { start, end } = options;
            let offset;
            let length;
            if (typeof start !== "undefined") {
                offset = start;
            }
            else {
                offset = 0;
            }
            if (typeof end !== "undefined") {
                length = end - offset + 1;
            }
            try {
                let stream;
                if (typeof length !== "undefined") {
                    stream = yield this._client.getPartialObject(bucketName, fileName, offset, length);
                }
                else {
                    stream = yield this._client.getPartialObject(bucketName, fileName, offset);
                }
                return { value: stream, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._client.removeObject(bucketName, fileName);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const { value: files, error } = yield this.listFiles(name);
            if (files === null) {
                return { value: null, error };
            }
            try {
                yield this._client.removeObjects(name, files.map((t) => t[0]));
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._client.removeBucket(name);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let fileData = "empty";
                let size;
                if (typeof params.buffer !== "undefined") {
                    fileData = params.buffer;
                    size = fileData.buffer.byteLength;
                }
                else if (typeof params.stream !== "undefined") {
                    fileData = params.stream;
                }
                if (fileData instanceof stream_1.Readable === false && fileData instanceof Buffer === false) {
                    return { value: null, error: "Could not find buffer or stream" };
                }
                const { bucketName, targetPath, options } = params;
                yield this._client.putObject(bucketName, targetPath, fileData, size, options);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getPublicURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = `https://${this.config.endPoint}`;
            if (this.config.port) {
                url += `:${this.config.port}`;
            }
            url += `/${bucketName}/${fileName}`;
            return { value: url, error: null };
        });
    }
    _getSignedURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let expiresIn = 300; // 5 * 60
            if (typeof options.expiresIn !== "undefined") {
                expiresIn = Number.parseInt(options.expiresIn, 10);
            }
            try {
                const url = yield this._client.presignedUrl("GET", bucketName, fileName, expiresIn);
                return { value: url, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _listFiles(bucketName, numFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = this._client.listObjectsV2(bucketName, "", true);
                const files = [];
                const { error: streamError } = yield new Promise((resolve) => {
                    stream.on("data", function (obj) {
                        if (typeof obj.name !== "undefined") {
                            files.push([obj.name, obj.size]);
                        }
                    });
                    stream.on("end", function () {
                        resolve({ value: files, error: null });
                    });
                    stream.on("error", function (e) {
                        resolve({ value: null, error: (0, util_1.getErrorMessage)(e) });
                    });
                });
                if (streamError !== null) {
                    return { value: null, error: streamError };
                }
                return { value: files, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _sizeOf(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this._client.statObject(bucketName, fileName);
                return { value: stats.size, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const exists = yield this._client.bucketExists(bucketName);
                return { value: exists, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const policy = yield this._client.getBucketPolicy(bucketName);
                const p = JSON.parse(policy);
                let isPublic = false;
                // console.log('Bucket policy:', policy);
                for (let i = 0; i < p.Statement.length; i++) {
                    const s = p.Statement[i];
                    if (s.Effect === "Allow" && s.Action.includes("s3:GetObject")) {
                        isPublic = true;
                        break;
                    }
                }
                return { value: isPublic, error: null };
            }
            catch (e) {
                if (e.code === "NoSuchBucketPolicy") {
                    return { value: false, error: null };
                }
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this._client.statObject(bucketName, fileName);
                return { value: stats !== null, error: null };
            }
            catch (e) {
                return { value: false, error: null };
            }
        });
    }
    _getPresignedUploadURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let expiresIn = 300; // 5 * 60
                if (typeof options.expiresIn !== "undefined") {
                    expiresIn = Number.parseInt(options.expiresIn, 10);
                }
                const url = yield this._client.presignedPutObject(bucketName, fileName, expiresIn);
                return { value: { url }, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    // public
    get config() {
        return this._config;
    }
    getConfig() {
        return this._config;
    }
    get serviceClient() {
        return this._client;
    }
    getServiceClient() {
        return this._client;
    }
}
exports.AdapterMinio = AdapterMinio;
//# sourceMappingURL=AdapterMinio.js.map