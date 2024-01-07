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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.AdapterMinio = void 0;
const fs_1 = __importDefault(require("fs"));
const Minio = __importStar(require("minio"));
const AbstractAdapter_1 = require("./AbstractAdapter");
const general_1 = require("./types/general");
const util_1 = require("./util");
class AdapterMinio extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._type = general_1.StorageType.MINIO;
        this._configError = null;
        if (this._configError === null) {
            if (this.config.accessKey === "undefined" ||
                this.config.secretKey === "undefined" ||
                this.config.endPoint === "undefined") {
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
                    this.config.port = useSSL ? 443 : 80;
                }
                if (typeof port === "string") {
                    this.config.port = parseInt(port, 10);
                }
                const region = this.config.region;
                if (typeof region !== "string") {
                    this.config.region = "auto";
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
                this._client = new Minio.Client(c);
            }
        }
    }
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
    getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { error: this.configError, value: null };
            }
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
                yield this._client.removeObject(bucketName, fileName);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    createBucket(name, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            const error = (0, util_1.validateName)(name);
            if (error !== null) {
                return { value: null, error };
            }
            try {
                const e = yield this._client.bucketExists(name);
                if (e) {
                    return { value: null, error: "bucket exists" };
                }
            }
            catch (e) {
                return { value: null, error: e.message };
            }
            try {
                const { region } = this._config;
                yield this._client.makeBucket(name, region, options);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            const { value: files, error } = yield this.listFiles(name);
            if (error !== null) {
                return { value: null, error };
            }
            try {
                yield this._client.removeObjects(name, files.map((t) => t[0]));
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
                yield this._client.removeBucket(name);
                return { value: "ok", error: null };
            }
            catch (e) {
                console.log(e.message);
                if (e.message === "NoSuchBucket") {
                    return { value: "bucket not found", error: null };
                }
                return { value: null, error: e.message };
            }
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const buckets = yield this._client.listBuckets();
                return { value: buckets.map((b) => b.name), error: null };
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
                let fileData;
                if (typeof params.origPath !== "undefined") {
                    const f = params.origPath;
                    if (!fs_1.default.existsSync(f)) {
                        return { value: null, error: `File with given path: ${f}, was not found` };
                    }
                    fileData = fs_1.default.createReadStream(f);
                }
                else if (typeof params.buffer !== "undefined") {
                    fileData = params.buffer;
                }
                else if (typeof params.stream !== "undefined") {
                    fileData = params.stream;
                }
                const { bucketName, targetPath } = params;
                const response = yield this._client.putObject(bucketName, targetPath, fileData, options);
                return this.getFileAsURL(params.bucketName, params.targetPath, options);
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    getFileAsURL(bucketName, fileName, options // e.g. { expiry: 3600 }
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            const expiry = options.expiry || 7 * 24 * 60 * 60;
            try {
                const url = yield this._client.presignedUrl("GET", bucketName, fileName, expiry, options);
                return { value: url, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    listFiles(bucketName, maxFiles = 10000) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const stream = this._client.listObjectsV2(bucketName, "", true);
                const files = [];
                const { error: streamError } = yield new Promise((resolve) => {
                    stream.on("data", function (obj) {
                        files.push([obj.name, obj.size]);
                    });
                    stream.on("end", function () {
                        resolve({ value: files, error: null });
                    });
                    stream.on("error", function (e) {
                        resolve({ value: null, error: e.message });
                    });
                });
                if (streamError !== null) {
                    return { value: null, error: streamError };
                }
                return { value: files, error: null };
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
                const stats = yield this._client.statObject(bucketName, fileName);
                return { value: stats.size, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const exists = yield this._client.bucketExists(bucketName);
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
                const stats = yield this._client.statObject(bucketName, fileName);
                return { value: stats !== null, error: null };
            }
            catch (e) {
                return { value: false, error: null };
            }
        });
    }
}
exports.AdapterMinio = AdapterMinio;
//# sourceMappingURL=AdapterMinio.js.map