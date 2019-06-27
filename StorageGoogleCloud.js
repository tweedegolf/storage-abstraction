"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
exports.__esModule = true;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var storage_1 = require("@google-cloud/storage");
var Storage_1 = require("./Storage");
var StorageGoogleCloud = /** @class */ (function (_super) {
    __extends(StorageGoogleCloud, _super);
    function StorageGoogleCloud(config) {
        var _this = _super.call(this, config) || this;
        var projectId = config.projectId, keyFilename = config.keyFilename;
        _this.storage = new storage_1.Storage({
            projectId: projectId,
            keyFilename: keyFilename
        });
        return _this;
    }
    StorageGoogleCloud.prototype.getFileAsReadable = function (fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var file, exists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        file = this.storage.bucket(this.bucketName).file(fileName);
                        return [4 /*yield*/, file.exists()];
                    case 1:
                        exists = (_a.sent())[0];
                        if (!exists) {
                            console.log('file not found');
                            throw new Error('file not found');
                        }
                        else {
                            return [2 /*return*/, file.createReadStream()];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    StorageGoogleCloud.prototype.downloadFile = function (fileName, downloadPath) {
        return __awaiter(this, void 0, void 0, function () {
            var file, exists, localFilename;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        file = this.storage.bucket(this.bucketName).file(fileName);
                        return [4 /*yield*/, file.exists()];
                    case 1:
                        exists = (_a.sent())[0];
                        if (!exists) {
                            console.error(fileName + " does not exist");
                            return [2 /*return*/, false];
                        }
                        localFilename = path_1["default"].join(downloadPath, fileName);
                        return [2 /*return*/, file.download({
                                destination: localFilename
                            })
                                .then(function () { return true; })["catch"](function (err) {
                                console.log(err.message);
                                throw new Error(err.message);
                            })];
                }
            });
        });
    };
    // async getFile(fileName: string) {
    //   const file = this.storage.bucket(this.bucketName).file(fileName)
    //   file.get().then(async (data) => {
    //     const apiResponse: any = data[1];
    //     const bin = axios.request({
    //       url: apiResponse.selfLink,
    //       headers: {
    //         'x-goog-project-id': '',
    //       }
    //     })
    //       .then(data => console.log(data))
    //       .catch(e => console.error(e));
    //   });
    // }
    StorageGoogleCloud.prototype.removeFile = function (fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.storage.bucket(this.bucketName).file(fileName)["delete"]()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        e_1 = _a.sent();
                        if (e_1.message.indexOf('No such object') !== -1) {
                            return [2 /*return*/, true];
                        }
                        console.log(e_1.message);
                        throw new Error(e_1.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // util members
    StorageGoogleCloud.prototype.store = function (origPath, targetPath) {
        return __awaiter(this, void 0, void 0, function () {
            var readStream_1, writeStream_1, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.createBucket()];
                    case 1:
                        _a.sent();
                        readStream_1 = fs_1["default"].createReadStream(origPath);
                        writeStream_1 = this.storage.bucket(this.bucketName).file(targetPath).createWriteStream();
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                readStream_1.on('end', function () {
                                    resolve();
                                });
                                readStream_1.on('error', function (e) {
                                    reject(e);
                                });
                                readStream_1.pipe(writeStream_1);
                                writeStream_1.on('error', function (e) {
                                    reject(e);
                                });
                            })];
                    case 2:
                        e_2 = _a.sent();
                        console.log(e_2.message);
                        throw e_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StorageGoogleCloud.prototype.createBucket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.bucketCreated) {
                            return [2 /*return*/, true];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.storage.createBucket(this.bucketName)];
                    case 2:
                        _a.sent();
                        this.bucketCreated = true;
                        return [2 /*return*/, true];
                    case 3:
                        e_3 = _a.sent();
                        if (e_3.code === 409) {
                            // error code 409 is 'You already own this bucket. Please select another name.'
                            // so we can safely return true if this error occurs
                            return [2 /*return*/, true];
                        }
                        throw new Error(e_3.message);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    StorageGoogleCloud.prototype.clearBucket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.storage.bucket(this.bucketName).deleteFiles({ force: true })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        e_4 = _a.sent();
                        throw new Error(e_4.message);
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StorageGoogleCloud.prototype.getMetaData = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var i, file, metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < result.length)) return [3 /*break*/, 4];
                        file = this.storage.bucket(this.bucketName).file(result[i][0]);
                        return [4 /*yield*/, file.getMetadata()];
                    case 2:
                        metadata = (_a.sent())[0];
                        // console.log(metadata.size);
                        result[i].push(parseInt(metadata.size, 10));
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, result];
                }
            });
        });
    };
    StorageGoogleCloud.prototype.listFiles = function (numFiles) {
        if (numFiles === void 0) { numFiles = 1000; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.storage.bucket(this.bucketName).getFiles()
                        .then(function (data) { return __awaiter(_this, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    result = data[0].map(function (f) { return [f.name]; });
                                    return [4 /*yield*/, this.getMetaData(result)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/, result];
                            }
                        });
                    }); })["catch"](function (err) {
                        console.log(err.message);
                        throw new Error(err.message);
                    })];
            });
        });
    };
    return StorageGoogleCloud;
}(Storage_1.Storage));
exports.StorageGoogleCloud = StorageGoogleCloud;
