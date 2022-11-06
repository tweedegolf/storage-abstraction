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
exports.Storage = void 0;
var path_1 = __importDefault(require("path"));
//  add new storage adapters here
var adapterClasses = {
    b2: "AdapterBackblazeB2",
    s3: "AdapterAmazonS3",
    gcs: "AdapterGoogleCloudStorage",
    local: "AdapterLocal",
};
// or here for functional adapters
var adapterFunctions = {
    b2f: "AdapterBackblazeB2F",
};
var availableAdapters = Object.keys(adapterClasses)
    .concat(Object.keys(adapterFunctions))
    .reduce(function (acc, val) {
    if (acc.findIndex(function (v) { return v === val; }) === -1) {
        acc.push(val);
    }
    return acc;
}, [])
    .sort()
    .join(", ");
var Storage = /** @class */ (function () {
    function Storage(config) {
        this.switchAdapter(config);
    }
    Storage.prototype.getType = function () {
        return this.adapter.getType();
    };
    // public getOptions(): TypeJSON {
    //   return this.adapter.getOptions();
    // }
    Storage.prototype.getConfiguration = function () {
        return this.adapter.getConfiguration();
    };
    Storage.prototype.switchAdapter = function (args) {
        // console.log(args);
        var type;
        if (typeof args === "string") {
            type = args.substring(0, args.indexOf("://"));
        }
        else {
            type = args.type;
        }
        // console.log("type", type);
        // console.log("class", adapterClasses[type], "function", adapterFunctions[type]);
        if (!adapterClasses[type] && !adapterFunctions[type]) {
            throw new Error("unsupported storage type, must be one of ".concat(availableAdapters));
        }
        if (adapterClasses[type]) {
            var name_1 = adapterClasses[type];
            var AdapterClass = require(path_1.default.join(__dirname, name_1))[name_1];
            this.adapter = new AdapterClass(args);
        }
        else if (adapterFunctions[type]) {
            var name_2 = adapterFunctions[type];
            var module_1 = require(path_1.default.join(__dirname, name_2));
            this.adapter = module_1.createAdapter(args);
        }
    };
    // all methods below are implementing IStorage
    Storage.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.init()];
            });
        });
    };
    Storage.prototype.test = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.test()];
            });
        });
    };
    Storage.prototype.addFileFromBuffer = function (buffer, targetPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.addFileFromBuffer(buffer, targetPath)];
            });
        });
    };
    Storage.prototype.addFileFromPath = function (origPath, targetPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.addFileFromPath(origPath, targetPath)];
            });
        });
    };
    Storage.prototype.addFileFromReadable = function (stream, targetPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.addFileFromReadable(stream, targetPath)];
            });
        });
    };
    Storage.prototype.createBucket = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.createBucket(name)];
            });
        });
    };
    Storage.prototype.clearBucket = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.clearBucket(name)];
            });
        });
    };
    Storage.prototype.deleteBucket = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.deleteBucket(name)];
            });
        });
    };
    Storage.prototype.listBuckets = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.listBuckets()];
            });
        });
    };
    Storage.prototype.getSelectedBucket = function () {
        return this.adapter.getSelectedBucket();
    };
    Storage.prototype.getFileAsReadable = function (name, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, start, end;
            return __generator(this, function (_b) {
                _a = options.start, start = _a === void 0 ? 0 : _a, end = options.end;
                // console.log(start, end, options);
                return [2 /*return*/, this.adapter.getFileAsReadable(name, { start: start, end: end })];
            });
        });
    };
    Storage.prototype.removeFile = function (fileName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.removeFile(fileName)];
            });
        });
    };
    Storage.prototype.listFiles = function (numFiles) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.listFiles(numFiles)];
            });
        });
    };
    Storage.prototype.selectBucket = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.selectBucket(name)];
            });
        });
    };
    Storage.prototype.sizeOf = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.sizeOf(name)];
            });
        });
    };
    Storage.prototype.fileExists = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.adapter.fileExists(name)];
            });
        });
    };
    return Storage;
}());
exports.Storage = Storage;
//# sourceMappingURL=Storage.js.map