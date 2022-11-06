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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
var uniquid_1 = __importDefault(require("uniquid"));
var fs_1 = __importStar(require("fs"));
var path_1 = __importDefault(require("path"));
var Storage_1 = require("../src/Storage");
var types_1 = require("../src/types");
var util_1 = require("./util");
dotenv_1.default.config();
/**
 * Below 4 examples of how you can populate a config object using environment variables.
 * Note that you name the environment variables to your liking.
 */
var configS3 = {
    type: types_1.StorageType.S3,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.BUCKET_NAME,
};
var configGoogle = {
    type: types_1.StorageType.GCS,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
    bucketName: process.env.BUCKET_NAME,
};
var configBackblaze = {
    type: types_1.StorageType.B2,
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
    bucketName: process.env.BUCKET_NAME,
};
var configLocal = {
    type: types_1.StorageType.LOCAL,
    directory: process.env.LOCAL_DIRECTORY,
    // slug: true,
};
var generateBucketName = function () { return "bucket-".concat((0, uniquid_1.default)(), "-").concat(new Date().getTime()); };
var bucketNames = [generateBucketName(), generateBucketName(), generateBucketName()];
/**
 * A set of tests
 */
var test = function (storage) { return __awaiter(void 0, void 0, void 0, function () {
    var bucket, e_1, e_2, r, e_3, readStream, e_4, readStream, p, writeStream, size, e_5, readStream, p, writeStream, e_6, buckets, e_7, files;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("=>", storage.getType());
                bucket = storage.getSelectedBucket();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, storage.init()];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                console.error("\x1b[31m", e_1.message, "\n");
                process.exit(0);
                return [3 /*break*/, 4];
            case 4:
                _a.trys.push([4, 6, , 7]);
                return [4 /*yield*/, storage.test()];
            case 5:
                _a.sent();
                return [3 /*break*/, 7];
            case 6:
                e_2 = _a.sent();
                console.error("\x1b[31m", e_2, "\n");
                return [2 /*return*/];
            case 7:
                _a.trys.push([7, 9, , 10]);
                return [4 /*yield*/, storage.selectBucket(bucket)];
            case 8:
                r = _a.sent();
                console.log("select bucket \"".concat(bucket, "\": ").concat(r));
                return [3 /*break*/, 10];
            case 9:
                e_3 = _a.sent();
                console.error("\x1b[31m", e_3.message, "\n");
                return [2 /*return*/];
            case 10:
                _a.trys.push([10, 12, , 13]);
                readStream = (0, fs_1.createReadStream)(path_1.default.join("tests", "data", "image1.jpg"));
                return [4 /*yield*/, storage.addFileFromReadable(readStream, "/test.jpg")];
            case 11:
                _a.sent();
                return [3 /*break*/, 13];
            case 12:
                e_4 = _a.sent();
                console.error("\x1b[31m", e_4, "\n");
                return [3 /*break*/, 13];
            case 13:
                _a.trys.push([13, 17, , 18]);
                return [4 /*yield*/, storage.getFileAsReadable("test.jpg", {
                        end: 4000,
                    })];
            case 14:
                readStream = _a.sent();
                p = path_1.default.join(process.cwd(), "test-partial.jpg");
                writeStream = fs_1.default.createWriteStream(p);
                return [4 /*yield*/, (0, util_1.copyFile)(readStream, writeStream)];
            case 15:
                _a.sent();
                return [4 /*yield*/, fs_1.default.promises.stat(p)];
            case 16:
                size = (_a.sent()).size;
                console.log("size partial", size);
                return [3 /*break*/, 18];
            case 17:
                e_5 = _a.sent();
                console.error("\x1b[31m", e_5, "\n");
                return [3 /*break*/, 18];
            case 18: return [4 /*yield*/, fs_1.default.promises.unlink(path_1.default.join(process.cwd(), "test-partial.jpg"))];
            case 19:
                _a.sent();
                _a.label = 20;
            case 20:
                _a.trys.push([20, 23, , 24]);
                return [4 /*yield*/, storage.getFileAsReadable("test.jpg")];
            case 21:
                readStream = _a.sent();
                p = path_1.default.join(process.cwd(), "test.jpg");
                writeStream = fs_1.default.createWriteStream(p);
                return [4 /*yield*/, (0, util_1.copyFile)(readStream, writeStream)];
            case 22:
                _a.sent();
                return [3 /*break*/, 24];
            case 23:
                e_6 = _a.sent();
                console.error("\x1b[31m", e_6, "\n");
                return [3 /*break*/, 24];
            case 24: return [4 /*yield*/, fs_1.default.promises.unlink(path_1.default.join(process.cwd(), "test.jpg"))];
            case 25:
                _a.sent();
                return [4 /*yield*/, storage.listBuckets()];
            case 26:
                buckets = _a.sent();
                console.log("list buckets", buckets);
                return [4 /*yield*/, storage.createBucket(bucketNames[0])];
            case 27:
                _a.sent();
                return [4 /*yield*/, storage.createBucket(bucketNames[1])];
            case 28:
                _a.sent();
                return [4 /*yield*/, storage.createBucket(bucketNames[2])];
            case 29:
                _a.sent();
                return [4 /*yield*/, storage.listBuckets()];
            case 30:
                buckets = _a.sent();
                console.log("list buckets", buckets);
                return [4 /*yield*/, storage.deleteBucket(bucketNames[2])];
            case 31:
                _a.sent();
                return [4 /*yield*/, storage.listBuckets()];
            case 32:
                buckets = _a.sent();
                console.log("list buckets", buckets);
                _a.label = 33;
            case 33:
                _a.trys.push([33, 35, , 36]);
                return [4 /*yield*/, storage.addFileFromPath("./tests/data/image1.jpg", "subdir/sub subdir/new name.jpg")];
            case 34:
                _a.sent();
                return [3 /*break*/, 36];
            case 35:
                e_7 = _a.sent();
                console.log(e_7.message);
                return [3 /*break*/, 36];
            case 36: return [4 /*yield*/, storage.selectBucket(bucketNames[0])];
            case 37:
                _a.sent();
                console.log("select bucket \"".concat(storage.getSelectedBucket(), "\""));
                return [4 /*yield*/, storage.addFileFromPath("./tests/data/image1.jpg", "subdir/sub subdir/new name.jpg")];
            case 38:
                _a.sent();
                return [4 /*yield*/, storage.listFiles()];
            case 39:
                files = _a.sent();
                console.log("list files", files);
                return [4 /*yield*/, storage.clearBucket()];
            case 40:
                _a.sent();
                return [4 /*yield*/, storage.listFiles()];
            case 41:
                files = _a.sent();
                console.log("list files", files);
                return [4 /*yield*/, storage.addFileFromPath("./tests/data/image1.jpg", "subdir/sub subdir/new name.jpg")];
            case 42:
                _a.sent();
                return [4 /*yield*/, storage.listFiles()];
            case 43:
                files = _a.sent();
                console.log("add file", files);
                return [4 /*yield*/, storage.removeFile("subdir/sub subdir/new name.jpg")];
            case 44:
                _a.sent();
                return [4 /*yield*/, storage.listFiles()];
            case 45:
                files = _a.sent();
                console.log("remove file", files);
                return [4 /*yield*/, storage.addFileFromPath("./tests/data/image1.jpg", "tmp.jpg")];
            case 46:
                _a.sent();
                return [4 /*yield*/, storage.deleteBucket(bucketNames[0])];
            case 47:
                _a.sent();
                return [4 /*yield*/, storage.deleteBucket(bucketNames[1])];
            case 48:
                _a.sent();
                return [4 /*yield*/, storage.listBuckets()];
            case 49:
                buckets = _a.sent();
                console.log("cleanup buckets ".concat(buckets));
                console.log("\n");
                return [2 /*return*/];
        }
    });
}); };
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var storage;
    return __generator(this, function (_a) {
        storage = new Storage_1.Storage(configLocal);
        test(storage);
        return [2 /*return*/];
    });
}); };
run();
//# sourceMappingURL=test.js.map