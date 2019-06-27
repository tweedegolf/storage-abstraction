"use strict";
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
require("multer");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var slugify_1 = __importDefault(require("slugify"));
var Storage = /** @class */ (function () {
    function Storage(config) {
        this.bucketCreated = false;
        // TODO: perform sanity tests?
        if (typeof config.bucketName === 'undefined') {
            throw new Error('bucket name is not defined');
        }
        this.bucketName = slugify_1["default"](config.bucketName);
    }
    Storage.prototype.copy = function (origPath, args) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, dir, _c, newName, _d, remove, origName, fileSize, targetPath, targetName, e_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = args || {}, _b = _a.dir, dir = _b === void 0 ? null : _b, _c = _a.name, newName = _c === void 0 ? null : _c, _d = _a.remove, remove = _d === void 0 ? false : _d;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 6, , 7]);
                        origName = path_1["default"].basename(origPath);
                        return [4 /*yield*/, fs_1["default"].promises.stat(origPath)];
                    case 2:
                        fileSize = (_e.sent()).size;
                        targetPath = '';
                        targetName = slugify_1["default"](origName);
                        if (newName !== null) {
                            targetName = slugify_1["default"](newName);
                        }
                        if (dir !== null) {
                            targetPath = slugify_1["default"](dir);
                        }
                        targetPath = path_1["default"].join(targetPath, targetName);
                        // console.log(targetPath, remove);
                        return [4 /*yield*/, this.store(origPath, targetPath)];
                    case 3:
                        // console.log(targetPath, remove);
                        _e.sent();
                        if (!remove) return [3 /*break*/, 5];
                        return [4 /*yield*/, fs_1["default"].promises.unlink(origPath)];
                    case 4:
                        _e.sent();
                        _e.label = 5;
                    case 5: return [2 /*return*/, {
                            origName: origName,
                            size: fileSize,
                            path: targetPath
                        }];
                    case 6:
                        e_1 = _e.sent();
                        // console.error('COPY', e);
                        throw new Error(e_1.message);
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * @param tempFile: temporary Multer file
     * @param config?: setting for processing this file by the permanent storage
     * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
     * @param config.newName?: the name of the file in the storage
     * @param config.remove?: whether or not to remove the temp file after it has been stored
     */
    Storage.prototype.addFileFromUpload = function (file, args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.copy(file.path, args)];
            });
        });
    };
    /**
     * @param filePath: path to the file to be copied
     * @param config?: setting for processing this file by the permanent storage
     * @param config.dir?: the directory to save this file into, directory will be created if it doesn't exist
     * @param config.newName?: the name of the file in the storage
     * @param config.remove?: whether or not to remove the file after it has been copied to the storage
     */
    Storage.prototype.addFileFromPath = function (origPath, args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.copy(origPath, args)];
            });
        });
    };
    Storage.TYPE_GOOGLE_CLOUD = 'TYPE_GOOGLE_CLOUD';
    Storage.TYPE_AMAZON_S3 = 'TYPE_AMAZON_S3';
    Storage.TYPE_LOCAL = 'TYPE_LOCAL';
    return Storage;
}());
exports.Storage = Storage;
