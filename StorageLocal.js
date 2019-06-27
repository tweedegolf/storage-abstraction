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
var glob_1 = __importDefault(require("glob"));
var await_to_js_1 = __importDefault(require("await-to-js"));
var Storage_1 = require("./Storage");
var StorageLocal = /** @class */ (function (_super) {
    __extends(StorageLocal, _super);
    function StorageLocal(config) {
        var _this = _super.call(this, config) || this;
        var directory = config.directory;
        _this.directory = directory;
        _this.storagePath = path_1["default"].join(_this.directory, _this.bucketName);
        return _this;
    }
    StorageLocal.prototype.store = function (filePath, targetFileName) {
        return __awaiter(this, void 0, void 0, function () {
            var dest, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dest = path_1["default"].join(this.storagePath, targetFileName);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.createBucket()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, fs_1["default"].promises.stat(path_1["default"].dirname(dest))];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        fs_1["default"].mkdir(path_1["default"].dirname(dest), { recursive: true }, function (e) {
                            if (e) {
                                throw new Error(e.message);
                            }
                        });
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/, new Promise(function (resolve) {
                            fs_1["default"].copyFile(filePath, dest, function (e) {
                                if (e) {
                                    console.log('STORE LOCAL', e);
                                    throw new Error(e.message);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        })];
                }
            });
        });
    };
    StorageLocal.prototype.createBucket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.bucketCreated) {
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, fs_1["default"].promises.stat(this.storagePath)
                        .then(function () { return true; })["catch"](function () { return fs_1["default"].promises.mkdir(_this.storagePath, { recursive: true, mode: 511 }); })
                        .then(function () {
                        _this.bucketCreated = true;
                        return true;
                    })["catch"](function (e) {
                        console.log(e.message);
                        throw new Error(e.message);
                    })];
            });
        });
    };
    StorageLocal.prototype.clearBucket = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        glob_1["default"](_this.storagePath + "/**/*", {}, function (err, files) {
                            if (err !== null) {
                                reject(err);
                            }
                            else {
                                var promises = files.map(function (f) {
                                    return fs_1["default"].promises.unlink(f);
                                });
                                try {
                                    Promise.all(promises);
                                    resolve(true);
                                }
                                catch (e) {
                                    throw e;
                                }
                            }
                        });
                    })];
            });
        });
    };
    StorageLocal.prototype.globFiles = function (folder) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        glob_1["default"](folder + "/**/*.*", {}, function (err, files) {
                            if (err !== null) {
                                reject(err);
                            }
                            else {
                                resolve(files);
                            }
                        });
                    })];
            });
        });
    };
    StorageLocal.prototype.listFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, result, i, f, stat, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.globFiles(this.storagePath)];
                    case 1:
                        files = _a.sent();
                        result = [];
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < files.length)) return [3 /*break*/, 5];
                        f = files[i];
                        return [4 /*yield*/, fs_1["default"].promises.stat(f)];
                    case 3:
                        stat = _a.sent();
                        // result.push([path.basename(f), stat.size])
                        result.push([f.replace(this.storagePath + "/", ''), stat.size]);
                        _a.label = 4;
                    case 4:
                        i += 1;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, result];
                    case 6:
                        e_2 = _a.sent();
                        throw new Error(e_2.message);
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    StorageLocal.prototype.getFileAsReadable = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var p, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        p = path_1["default"].join(this.storagePath, name);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs_1["default"].promises.stat(p)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, fs_1["default"].createReadStream(p)];
                    case 3:
                        e_3 = _a.sent();
                        throw new Error(e_3.message);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    StorageLocal.prototype.removeFile = function (fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var p, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        p = path_1["default"].join(this.storagePath, fileName);
                        return [4 /*yield*/, await_to_js_1["default"](fs_1["default"].promises.unlink(p))];
                    case 1:
                        err = (_a.sent())[0];
                        if (err !== null) {
                            if (err.message.indexOf('no such file or directory') !== -1) {
                                return [2 /*return*/, true];
                            }
                            console.log(err);
                            throw new Error(err.message);
                        }
                        else {
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return StorageLocal;
}(Storage_1.Storage));
exports.StorageLocal = StorageLocal;
