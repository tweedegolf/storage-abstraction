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
exports.AdapterLocal = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const rimraf_1 = require("rimraf");
const stream_1 = require("stream");
const types_1 = require("./types");
const AbstractAdapter_1 = require("./AbstractAdapter");
const util_1 = require("./util");
class AdapterLocal extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super();
        this.type = types_1.StorageType.LOCAL;
        this.buckets = [];
        this.mode = 0o777;
        this.config = this.parseConfig(config);
        if (typeof this.config.bucketName !== "undefined") {
            const msg = this.validateName(this.config.bucketName);
            if (msg !== null) {
                throw new Error(msg);
            }
            this.bucketName = this.config.bucketName;
        }
        const mode = this.config.mode;
        if (typeof mode !== "undefined") {
            this.mode = mode;
        }
        const directory = this.config.directory;
        this.directory = directory;
    }
    parseConfig(config) {
        let cfg;
        if (typeof config === "string") {
            const qm = config.indexOf("?");
            const sep = config.indexOf("://");
            const type = config.substring(0, sep);
            // const { mode } = parseQuerystring(config);
            const querystring = (0, util_1.parseQuerystring)(config);
            const end = qm !== -1 ? qm : config.length;
            const directory = config.substring(sep + 3, end);
            // console.log("DIR", directory, end, qm);
            cfg = Object.assign({ type,
                directory }, querystring);
            // console.log(cfg);
        }
        else {
            cfg = Object.assign({}, config);
        }
        if (cfg.skipCheck === true) {
            return cfg;
        }
        if (!cfg.directory) {
            throw new Error("You must specify a value for 'directory' for storage type 'local'");
        }
        return cfg;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized) {
                return Promise.resolve(true);
            }
            if (typeof this.bucketName !== "undefined") {
                yield this.createDirectory(path_1.default.join(this.directory, this.bucketName));
            }
            this.initialized = true;
            return Promise.resolve(true);
        });
    }
    /**
     * @param path
     * creates a directory if it doesn't exist
     */
    createDirectory(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.default.promises.access(path);
                return true;
            }
            catch (e) {
                yield fs_1.default.promises
                    .mkdir(path, {
                    recursive: true,
                    mode: (0, util_1.parseMode)(this.mode),
                })
                    .catch((e) => {
                    throw e;
                    // console.error(`\x1b[31m${e.message}`);
                    // return false;
                });
                // const m = (await fs.promises.stat(path)).mode;
                // console.log(m, this.options.mode);
                return true;
            }
        });
    }
    store(arg, targetPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const dest = path_1.default.join(this.directory, this.bucketName, targetPath);
            yield this.createDirectory(path_1.default.dirname(dest));
            if (typeof arg === "string") {
                yield fs_1.default.promises.copyFile(arg, dest);
                return dest;
            }
            const writeStream = fs_1.default.createWriteStream(dest);
            let readStream = null;
            if (arg instanceof Buffer) {
                readStream = new stream_1.Readable();
                readStream._read = () => { }; // _read is required but you can noop it
                readStream.push(arg);
                readStream.push(null); // close stream
            }
            else if (arg instanceof stream_1.Readable) {
                readStream = arg;
            }
            return new Promise((resolve, reject) => {
                readStream
                    .pipe(writeStream)
                    .on("error", reject)
                    .on("finish", () => {
                    resolve(dest);
                });
                writeStream.on("error", reject);
            });
        });
    }
    createBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = this.validateName(name);
            if (msg !== null) {
                return Promise.reject(msg);
            }
            // console.log(bn, name);
            const created = yield this.createDirectory(path_1.default.join(this.directory, name));
            if (created) {
                this.buckets.push(name);
                return "ok";
            }
        });
    }
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            if (!n) {
                return;
            }
            // remove all files and folders inside bucket directory, but not the directory itself
            const p = path_1.default.join(this.directory, n, "*");
            return (0, rimraf_1.rimraf)(p)
                .then(() => {
                return "";
            })
                .catch((e) => {
                throw e;
            });
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const n = name || this.bucketName;
            if (!n) {
                return Promise.resolve("");
            }
            const p = path_1.default.join(this.directory, n);
            return (0, rimraf_1.rimraf)(p)
                .then(() => {
                if (n === this.bucketName) {
                    this.bucketName = "";
                }
                return "";
            })
                .catch((e) => {
                if (n === this.bucketName) {
                    this.bucketName = "";
                }
                if (e !== null) {
                    return Promise.reject(e);
                }
            });
        });
    }
    selectBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!name) {
                this.bucketName = "";
                return `bucket '${name}' deselected`;
            }
            yield this.createBucket(name);
            this.bucketName = name;
            return `bucket '${name}' selected`;
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield fs_1.default.promises.readdir(this.directory);
            const stats = yield Promise.all(files.map((f) => fs_1.default.promises.stat(path_1.default.join(this.directory, f))));
            this.buckets = files.filter((_, i) => stats[i].isDirectory());
            return this.buckets;
        });
    }
    globFiles(folder) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, glob_1.glob)(`${folder}/**/*.*`, {})
                .then((files) => {
                return Promise.resolve(files);
            })
                .catch((err) => {
                return Promise.reject(err);
            });
        });
    }
    listFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const storagePath = path_1.default.join(this.directory, this.bucketName);
            const files = yield this.globFiles(storagePath);
            const result = [];
            for (let i = 0; i < files.length; i += 1) {
                const f = files[i];
                const stat = yield fs_1.default.promises.stat(f);
                // result.push([path.basename(f), stat.size])
                result.push([f.replace(`${storagePath}/`, ""), stat.size]);
            }
            return result;
        });
    }
    getFileAsReadable(name, options = { start: 0 }) {
        return __awaiter(this, void 0, void 0, function* () {
            const p = path_1.default.join(this.directory, this.bucketName, name);
            const s = (yield fs_1.default.promises.stat(p)).size;
            // console.log(p, s, options);
            return fs_1.default.createReadStream(p, options);
        });
    }
    removeFile(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const p = path_1.default.join(this.directory, this.bucketName, fileName);
            return fs_1.default.promises
                .unlink(p)
                .then(() => {
                return "";
            })
                .catch((err) => {
                // don't throw an error if the file has already been removed (or didn't exist at all)
                if (err.message.indexOf("no such file or directory") !== -1) {
                    return "";
                }
                throw new Error(err.message);
            });
        });
    }
    sizeOf(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.bucketName) {
                throw new Error("no bucket selected");
            }
            const p = path_1.default.join(this.directory, this.bucketName, name);
            const stat = yield fs_1.default.promises.stat(p);
            return stat.size;
        });
    }
    fileExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.default.promises.access(path_1.default.join(this.directory, this.bucketName, name));
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
}
exports.AdapterLocal = AdapterLocal;
//# sourceMappingURL=AdapterLocal.js.map