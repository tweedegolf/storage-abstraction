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
exports.createAdapter = void 0;
const fs_1 = __importDefault(require("fs"));
const general_1 = require("./types/general");
const util_1 = require("./util");
const getConfig = () => {
    return {
        type: general_1.StorageType.B2,
        applicationKeyId: "",
        applicationKey: "",
    };
};
const getType = () => "string";
const getConfigError = () => "string";
const getServiceClient = () => { }; // eslint-disable-line
const createBucket = (name, options) => __awaiter(void 0, void 0, void 0, function* () {
    const error = (0, util_1.validateName)(name);
    if (error !== null) {
        return { value: null, error };
    }
    return { value: "ok", error: null };
});
const clearBucket = (name) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "ok", error: null };
});
const deleteBucket = (name) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "ok", error: null };
});
const listBuckets = () => __awaiter(void 0, void 0, void 0, function* () {
    return { value: ["string", "string"], error: null };
});
const addFileFromPath = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "public url", error: null };
});
const addFileFromBuffer = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "public url", error: null };
});
const addFileFromStream = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "public url", error: null };
});
const addFile = (params) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "public url", error: null };
});
const getFileAsStream = (bucketName, fileName, options) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: fs_1.default.createReadStream(""), error: null };
});
const getFileAsURL = (bucketName, fileName, options) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "url", error: null };
});
const removeFile = (bucketName, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "ok", error: null };
});
const listFiles = (bucketName, numFiles) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: [["s", 0]], error: null };
});
const sizeOf = (bucketName, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: 42, error: null };
});
const fileExists = (bucketName, fileName) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: true, error: null };
});
const bucketExists = (bucketName) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: true, error: null };
});
const adapter = {
    get type() {
        return getType();
    },
    get config() {
        return getConfig();
    },
    get configError() {
        return getConfigError();
    },
    get serviceClient() {
        return getServiceClient();
    },
    getType,
    getConfigError,
    getConfig,
    getServiceClient,
    createBucket,
    clearBucket,
    deleteBucket,
    listBuckets,
    addFile,
    addFileFromPath,
    addFileFromBuffer,
    addFileFromStream,
    getFileAsStream,
    getFileAsURL,
    removeFile,
    listFiles,
    sizeOf,
    bucketExists,
    fileExists,
};
const createAdapter = (config) => {
    console.log("create functional adapter");
    let configError = null;
    if (typeof config === "string") {
        const { value, error } = (0, util_1.parseUrl)(config);
        if (error) {
            configError = `[configError] ${error}`;
        }
        config = value;
    }
    // const conf = config as AdapterConfigBackblazeB2;
    const state = {
        applicationKey: config.applicationKey,
        applicationKeyId: config.applicationKeyId,
        configError,
    };
    return adapter;
};
exports.createAdapter = createAdapter;
//# sourceMappingURL=AdapterBackblazeB2F.js.map