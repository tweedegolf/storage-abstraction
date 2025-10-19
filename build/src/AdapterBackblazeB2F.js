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
        provider: general_1.Provider.B2,
        applicationKeyId: "",
        applicationKey: "",
    };
};
const getProvider = () => general_1.Provider.B2;
const getConfigError = () => "string";
const getServiceClient = () => { }; // eslint-disable-line
const createBucket = (name_1, ...args_1) => __awaiter(void 0, [name_1, ...args_1], void 0, function* (name, options = {}) {
    const error = (0, util_1.validateName)(name, general_1.Provider.B2);
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
const getFileAsStream = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: fs_1.default.createReadStream(""), error: null };
});
const getPublicURL = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve({ value: "url", error: null });
});
const getSignedURL = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve({ value: "url", error: null });
});
const getPresignedUploadURL = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: {}, error: null };
});
const removeFile = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: "ok", error: null };
});
const listFiles = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: [["s", 0]], error: null };
});
const sizeOf = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: 42, error: null };
});
const fileExists = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: true, error: null };
});
const bucketExists = (bucketName) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: true, error: null };
});
const bucketIsPublic = (bucketName) => __awaiter(void 0, void 0, void 0, function* () {
    return { value: true, error: null };
});
const adapter = {
    get provider() {
        return getProvider();
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
    get bucketName() {
        return "bucketName";
    },
    set bucketName(bucketName) { },
    get selectedBucket() {
        return "bucketName";
    },
    set selectedBucket(bucketName) { },
    setSelectedBucket(bucketName) { },
    getSelectedBucket() {
        return "bucketName";
    },
    getProvider,
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
    getPublicURL,
    getSignedURL,
    getPresignedUploadURL,
    removeFile,
    listFiles,
    sizeOf,
    bucketExists,
    bucketIsPublic,
    fileExists,
};
const createAdapter = (config) => {
    console.log("create functional adapter");
    const configError = null;
    let conf;
    if (typeof config === "string") {
        conf = (0, util_1.parseQueryString)(config);
    }
    else {
        conf = Object.assign({}, config);
    }
    const state = {
        applicationKey: conf.applicationKey,
        applicationKeyId: conf.applicationKeyId,
        configError,
    };
    return adapter;
};
exports.createAdapter = createAdapter;
//# sourceMappingURL=AdapterBackblazeB2F.js.map