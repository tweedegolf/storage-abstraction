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
const backblaze_b2_1 = __importDefault(require("backblaze-b2"));
require("@gideo-llc/backblaze-b2-upload-any").install(backblaze_b2_1.default);
const types_1 = require("./types");
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    return true;
});
const getConfiguration = () => {
    return {
        type: types_1.StorageType.B2,
        applicationKeyId: "",
        applicationKey: "",
    };
};
// const init = (): Promise<boolean> => Promise.resolve(true);
const getType = () => "string";
// const getConfiguration = (): AdapterConfig => ({} as AdapterConfig);
const test = () => Promise.resolve("ok");
const createBucket = (name) => Promise.resolve("ok");
const selectBucket = (name) => Promise.resolve("ok");
const clearBucket = (name) => Promise.resolve("ok");
const deleteBucket = (name) => Promise.resolve("ok");
const listBuckets = () => Promise.resolve(["string", "string"]);
const getSelectedBucket = () => "string";
const addFileFromPath = (origPath, targetPath, options) => Promise.resolve("public url");
const addFileFromBuffer = (buffer, targetPath, options) => Promise.resolve("public url");
const addFileFromReadable = (stream, targetPath, options) => Promise.resolve("public url");
const getFileAsReadable = (name, options) => Promise.resolve(fs_1.default.createReadStream(""));
const removeFile = (name) => Promise.resolve("ok");
const listFiles = (numFiles) => Promise.resolve([["s", 0]]);
const sizeOf = (name) => Promise.resolve(42);
const fileExists = (name) => Promise.resolve(true);
const adapter = {
    init,
    getType: () => types_1.StorageType.B2,
    getConfiguration,
    test,
    createBucket,
    selectBucket,
    clearBucket,
    deleteBucket,
    listBuckets,
    getSelectedBucket,
    addFileFromPath,
    addFileFromBuffer,
    addFileFromReadable,
    getFileAsReadable,
    removeFile,
    listFiles,
    sizeOf,
    fileExists,
};
const createAdapter = (config) => {
    console.log("create functional adapter");
    const state = {
        applicationKeyId: config.applicationKeyId,
        applicationKey: config.applicationKey,
        bucketName: "",
    };
    return adapter;
};
exports.createAdapter = createAdapter;
//# sourceMappingURL=AdapterBackblazeB2F.js.map