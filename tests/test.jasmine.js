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
require("jasmine");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var rimraf_1 = __importDefault(require("rimraf"));
var dotenv = __importStar(require("dotenv"));
var uniquid_1 = __importDefault(require("uniquid"));
var slugify_1 = __importDefault(require("slugify"));
var Storage_1 = require("../src/Storage");
var types_1 = require("../src/types");
var util_1 = require("./util");
dotenv.config();
var type = process.env["TYPE"];
var configUrl = process.env["CONFIG_URL"];
var bucketName = process.env["BUCKET_NAME"];
var directory = process.env["LOCAL_DIRECTORY"];
var projectId = process.env["GOOGLE_CLOUD_PROJECT_ID"];
var keyFilename = process.env["GOOGLE_CLOUD_KEYFILE"];
var accessKeyId = process.env["AWS_ACCESS_KEY_ID"];
var secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
var applicationKeyId = process.env["B2_APPLICATION_KEY_ID"];
var applicationKey = process.env["B2_APPLICATION_KEY"];
console.log(type, configUrl, bucketName, directory, projectId, keyFilename, accessKeyId, secretAccessKey);
var config = "";
if (type === types_1.StorageType.LOCAL) {
    config = {
        type: type,
        directory: directory,
    };
}
else if (type === types_1.StorageType.GCS) {
    config = {
        type: type,
        bucketName: bucketName,
        projectId: projectId,
        keyFilename: keyFilename,
    };
}
else if (type === types_1.StorageType.S3) {
    config = {
        type: type,
        bucketName: bucketName,
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
    };
}
else if (type === types_1.StorageType.B2) {
    config = {
        type: type,
        bucketName: bucketName,
        applicationKeyId: applicationKeyId,
        applicationKey: applicationKey,
    };
}
else {
    if (!configUrl) {
        config = "local://".concat(process.cwd(), "/the-buck");
    }
    else {
        config = configUrl;
    }
}
var newBucketName = "bucket-".concat((0, uniquid_1.default)(), "-").concat(new Date().getTime());
console.log("CONFIG", config);
console.log("newBucketName:", newBucketName, '\n');
var storage;
// try {
//   storage = new Storage(config);
//   await storage.init();
//   console.log(storage.getConfiguration());
// } catch (e) {
//   console.error(`\x1b[31m${e.message}`);
//   process.exit(0);
// }
var waitABit = function (millis) {
    if (millis === void 0) { millis = 100; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    setTimeout(function () {
                        // console.log(`just wait a bit (${millis}ms)`);
                        resolve();
                    }, millis);
                })];
        });
    });
};
describe("[testing ".concat(type, " storage]"), function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // beforeAll(async () => {
        //   storage = new Storage(config);
        //   await storage.init();
        //   console.log("beforeAll");
        //   console.log(storage.getConfiguration());
        // });
        beforeEach(function () {
            // increase this value if you experience a lot of timeouts
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
        });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.clearBucket((0, slugify_1.default)(bucketName))];
                    case 1:
                        _a.sent();
                        if (!(storage.getType() === types_1.StorageType.LOCAL)) return [3 /*break*/, 3];
                        return [4 /*yield*/, storage.deleteBucket("new-bucket")];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        // cleaning up test data
                        (0, rimraf_1.default)(path.join(process.cwd(), "test-*.jpg"), function () {
                            console.log("all cleaned up!");
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it("init", function () { return __awaiter(void 0, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        storage = new Storage_1.Storage(config);
                        return [4 /*yield*/, storage.init()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        console.error(e_1);
                        return [2 /*return*/];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        it("test", function () { return __awaiter(void 0, void 0, void 0, function () {
            var e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, storage.test()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_2 = _a.sent();
                        console.error(e_2);
                        return [2 /*return*/];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        it("create bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // console.log(storage.getSelectedBucket());
                    return [4 /*yield*/, expectAsync(storage.createBucket(storage.getSelectedBucket())).toBeResolved()];
                    case 1:
                        // console.log(storage.getSelectedBucket());
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // it("wait it bit", async () => {
        //   await expectAsync(waitABit(2000)).toBeResolved();
        // });
        it("clear bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.clearBucket()).toBeResolved()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("check if bucket is empty", function () { return __awaiter(void 0, void 0, void 0, function () {
            var files;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.listFiles().catch(function (e) {
                            console.log(e.message);
                        })];
                    case 1:
                        files = _a.sent();
                        expect(files).toEqual([]);
                        return [2 /*return*/];
                }
            });
        }); });
        it("add file success", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg")).toBeResolved()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("add file error", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.addFileFromPath("./tests/data/non-existent.jpg", "non-existent.jpg")).toBeRejected()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("add with new name and dir", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // const [err, result] = await to(storage.addFileFromPath('./tests/data/image1.jpg', {
                    //   dir: 'subdir',
                    //   name: 'renamed.jpg',
                    // }));
                    return [4 /*yield*/, expectAsync(storage.addFileFromPath("./tests/data/image1.jpg", "subdir/renamed.jpg")).toBeResolved()];
                    case 1:
                        // const [err, result] = await to(storage.addFileFromPath('./tests/data/image1.jpg', {
                        //   dir: 'subdir',
                        //   name: 'renamed.jpg',
                        // }));
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("list files 1", function () { return __awaiter(void 0, void 0, void 0, function () {
            var expectedResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectedResult = [
                            ["image1.jpg", 32201],
                            ["subdir/renamed.jpg", 32201],
                        ];
                        return [4 /*yield*/, expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("remove file success", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // const [err, result] = await to(storage.removeFile('subdir/renamed.jpg'));
                    // console.log(err, result);
                    return [4 /*yield*/, expectAsync(storage.removeFile("subdir/renamed.jpg")).toBeResolved()];
                    case 1:
                        // const [err, result] = await to(storage.removeFile('subdir/renamed.jpg'));
                        // console.log(err, result);
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("remove file again", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.removeFile("subdir/renamed.jpg")).toBeResolved()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("list files 2", function () { return __awaiter(void 0, void 0, void 0, function () {
            var expectedResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectedResult = [["image1.jpg", 32201]];
                        return [4 /*yield*/, expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("get readable stream", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.getFileAsReadable("image1.jpg")).toBeResolved()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("get readable stream error", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.getFileAsReadable("image2.jpg")).toBeRejected()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("get readable stream and save file", function () { return __awaiter(void 0, void 0, void 0, function () {
            var readStream, filePath, writeStream, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, storage.getFileAsReadable("image1.jpg")];
                    case 1:
                        readStream = _a.sent();
                        filePath = path.join(process.cwd(), 'tests', 'tmp', "test-".concat(storage.getType(), ".jpg"));
                        writeStream = fs.createWriteStream(filePath);
                        return [4 /*yield*/, (0, util_1.copyFile)(readStream, writeStream)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_3 = _a.sent();
                        console.log(e_3);
                        throw e_3;
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        it("get readable stream partially and save file", function () { return __awaiter(void 0, void 0, void 0, function () {
            var filePath, readStream, writeStream, e_4, size;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePath = path.join(process.cwd(), 'tests', 'tmp', "test-".concat(storage.getType(), "-part.jpg"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, storage.getFileAsReadable("image1.jpg", { end: 2999 })];
                    case 2:
                        readStream = _a.sent();
                        writeStream = fs.createWriteStream(filePath);
                        return [4 /*yield*/, (0, util_1.copyFile)(readStream, writeStream)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_4 = _a.sent();
                        console.log(e_4);
                        throw e_4;
                    case 5: return [4 /*yield*/, fs.promises.stat(filePath)];
                    case 6:
                        size = (_a.sent()).size;
                        expect(size).toBe(3000);
                        return [2 /*return*/];
                }
            });
        }); });
        it("add file from stream", function () { return __awaiter(void 0, void 0, void 0, function () {
            var stream;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        stream = fs.createReadStream("./tests/data/image2.jpg");
                        return [4 /*yield*/, expectAsync(storage.addFileFromReadable(stream, "image2.jpg")).toBeResolved()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("add file from buffer", function () { return __awaiter(void 0, void 0, void 0, function () {
            var buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.promises.readFile("./tests/data/image2.jpg")];
                    case 1:
                        buffer = _a.sent();
                        return [4 /*yield*/, expectAsync(storage.addFileFromBuffer(buffer, "image3.jpg")).toBeResolved()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("list files 3", function () { return __awaiter(void 0, void 0, void 0, function () {
            var expectedResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectedResult = [
                            ["image1.jpg", 32201],
                            ["image2.jpg", 42908],
                            ["image3.jpg", 42908],
                        ];
                        return [4 /*yield*/, expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("sizeOf", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.sizeOf("image1.jpg")).toBeResolvedTo(32201)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("check if file exists: yes", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.fileExists("image1.jpg")).toBeResolvedTo(true)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("check if file exists: nope", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.fileExists("image10.jpg")).toBeResolvedTo(false)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("create bucket error", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.createBucket()).toBeRejectedWith("Please provide a bucket name")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("create bucket error", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.createBucket("")).toBeRejectedWith("Please provide a bucket name")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("create bucket error", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.createBucket(null)).toBeRejectedWith("Can not use `null` as bucket name")];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("create bucket error", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.createBucket("null")).toBeRejectedWith('Can not use "null" as bucket name')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("create bucket error", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.createBucket("undefined")).toBeRejectedWith('Can not use "undefined" as bucket name')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("create already existing bucket that you are not allowed to access", function () { return __awaiter(void 0, void 0, void 0, function () {
            var r, msg, e_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        r = storage.getType() === types_1.StorageType.LOCAL;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, storage.createBucket("new-bucket")];
                    case 2:
                        msg = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_5 = _a.sent();
                        r = e_5.message !== "ok" && e_5.message !== "";
                        return [3 /*break*/, 4];
                    case 4:
                        expect(r).toEqual(true);
                        return [2 /*return*/];
                }
            });
        }); });
        it("create bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            var e_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, storage.createBucket(newBucketName)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_6 = _a.sent();
                        console.error("\x1b[31m", e_6, "\n");
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        it("check created bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            var buckets, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.listBuckets()];
                    case 1:
                        buckets = _a.sent();
                        index = buckets.indexOf(newBucketName);
                        expect(index).toBeGreaterThan(-1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("selected bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // local storage does not automatically slugify
                if (storage.getType() === "local") {
                    expect(storage.getSelectedBucket()).not.toBe((0, slugify_1.default)(bucketName));
                }
                else {
                    expect(storage.getSelectedBucket()).toBe((0, slugify_1.default)(bucketName));
                }
                return [2 /*return*/];
            });
        }); });
        it("select bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.selectBucket(newBucketName)];
                    case 1:
                        _a.sent();
                        expect(storage.getSelectedBucket()).toBe((0, slugify_1.default)(newBucketName));
                        return [2 /*return*/];
                }
            });
        }); });
        it("add file to new bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg")).toBeResolved()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("list files in new bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            var expectedResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        expectedResult = [["image1.jpg", 32201]];
                        return [4 /*yield*/, expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("delete bucket currently selected non-empty bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            var msg, buckets, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.deleteBucket()];
                    case 1:
                        msg = _a.sent();
                        expect(storage.getSelectedBucket()).toBe("");
                        return [4 /*yield*/, storage.listBuckets()];
                    case 2:
                        buckets = _a.sent();
                        index = buckets.indexOf(newBucketName);
                        expect(index).toBe(-1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("create bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            var e_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, storage.createBucket(newBucketName)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_7 = _a.sent();
                        console.error("\x1b[31m", e_7, "\n");
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        it("check created bucket", function () { return __awaiter(void 0, void 0, void 0, function () {
            var buckets, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.listBuckets()];
                    case 1:
                        buckets = _a.sent();
                        index = buckets.indexOf(newBucketName);
                        expect(index).not.toBe(-1);
                        return [2 /*return*/];
                }
            });
        }); });
        it("clear bucket by providing a bucket name", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.clearBucket(newBucketName)).toBeResolved()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("bucket should contain no files", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expectAsync(storage.selectBucket(newBucketName)).toBeResolvedTo("bucket selected")];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, expectAsync(storage.listFiles()).toBeResolvedTo([])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it("delete bucket by providing a bucket name", function () { return __awaiter(void 0, void 0, void 0, function () {
            var msg, buckets, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, storage.deleteBucket(newBucketName)];
                    case 1:
                        msg = _a.sent();
                        return [4 /*yield*/, storage.listBuckets()];
                    case 2:
                        buckets = _a.sent();
                        index = buckets.indexOf(newBucketName);
                        expect(index).toBe(-1);
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); });
//# sourceMappingURL=test.jasmine.js.map