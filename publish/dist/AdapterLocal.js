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
const general_1 = require("./types/general");
const AbstractAdapter_1 = require("./AbstractAdapter");
const util_1 = require("./util");
class AdapterLocal extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._type = general_1.StorageType.LOCAL;
        this._configError = null;
        if (typeof this._config.mode !== "undefined") {
            const { value, error } = (0, util_1.parseMode)(this._config.mode);
            if (error !== null) {
                this._configError = `[configError] ${error}`;
            }
            else {
                this._config.mode = value;
            }
        }
        else {
            this._config.mode = 0o777;
        }
        if (typeof this._config.directory !== "string") {
            this._configError =
                "[configError] You must specify a value for 'directory' for storage type 'local'";
        }
    }
    /**
     * @param path
     * creates a directory if it doesn't exist
     */
    createDirectory(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.default.promises.access(path, this._config.mode);
                // return { value: false, error: `directory ${path} already exists` };
                return { value: true, error: null };
            }
            catch (e) {
                try {
                    yield fs_1.default.promises.mkdir(path, {
                        recursive: true,
                        mode: this._config.mode,
                    });
                    // const m = (await fs.promises.stat(path)).mode;
                    // console.log(m, this.options.mode);
                    return { value: true, error: null };
                }
                catch (e) {
                    return { value: null, error: e.message };
                }
            }
        });
    }
    globFiles(folder, pattern = "**/*.*") {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = yield (0, glob_1.glob)(`${folder}/${pattern}`, {});
                return { value: files, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    // Public API
    addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            let { options } = params;
            if (typeof options !== "object") {
                options = {};
            }
            const dest = path_1.default.join(this._config.directory, params.bucketName, params.targetPath);
            const { error } = yield this.createDirectory(path_1.default.dirname(dest));
            if (error !== null) {
                return { value: null, error };
            }
            try {
                let readStream;
                if (typeof params.origPath === "string") {
                    yield fs_1.default.promises.copyFile(params.origPath, dest);
                    return { value: dest, error: null };
                }
                else if (typeof params.buffer !== "undefined") {
                    readStream = new stream_1.Readable();
                    readStream._read = () => { }; // _read is required but you can noop it
                    readStream.push(params.buffer);
                    readStream.push(null);
                }
                else if (typeof params.stream !== "undefined") {
                    readStream = params.stream;
                }
                // console.time();
                const writeStream = fs_1.default.createWriteStream(dest, options);
                return new Promise((resolve) => {
                    readStream
                        .pipe(writeStream)
                        .on("error", (e) => {
                        resolve({ value: null, error: `[readStream error] ${e.message}` });
                    })
                        .on("finish", () => {
                        resolve({ value: dest, error: null });
                    });
                    writeStream.on("error", (e) => {
                        resolve({ value: null, error: `[writeStream error] ${e.message}` });
                    });
                });
                // console.timeEnd();
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    createBucket(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            const error = (0, util_1.validateName)(name);
            if (error !== null) {
                return { value: null, error };
            }
            try {
                const p = path_1.default.join(this._config.directory, name);
                const created = yield this.createDirectory(p);
                if (created) {
                    return { value: "ok", error: null };
                }
                else {
                    return { value: null, error: `Could not create bucket ${p}` };
                }
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                // remove all files and folders inside bucket directory, but not the directory itself
                const p = path_1.default.join(this._config.directory, name);
                yield (0, rimraf_1.rimraf)(p, { preserveRoot: false });
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const p = path_1.default.join(this._config.directory, name);
                yield (0, rimraf_1.rimraf)(p);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const dirents = yield fs_1.default.promises.readdir(this._config.directory, { withFileTypes: true });
                const files = dirents
                    .filter((dirent) => dirent.isFile() === false)
                    .map((dirent) => dirent.name);
                // const stats = await Promise.all(
                //   files.map((f) => fs.promises.stat(path.join(this._config.directory, f)))
                // );
                return { value: files, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    listFiles(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const storagePath = path_1.default.join(this._config.directory, bucketName);
                const { value: files, error } = yield this.globFiles(storagePath);
                if (error !== null) {
                    return { value: null, error };
                }
                const result = [];
                for (let i = 0; i < files.length; i += 1) {
                    const f = files[i];
                    const stat = yield fs_1.default.promises.stat(f);
                    // result.push([path.basename(f), stat.size])
                    result.push([f.replace(`${storagePath}/`, ""), stat.size]);
                }
                return { value: result, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const p = path_1.default.join(this._config.directory, bucketName, fileName);
                yield fs_1.default.promises.access(p);
                const stream = fs_1.default.createReadStream(p, options);
                return { value: stream, error: null };
            }
            catch (e) {
                return { value: null, error: e };
            }
        });
    }
    getFileAsURL(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const p = path_1.default.join(this._config.directory, bucketName, fileName);
                yield fs_1.default.promises.access(p);
                return { value: p, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const p = path_1.default.join(this._config.directory, bucketName, fileName);
                if (!fs_1.default.existsSync(p)) {
                    return { value: "ok", error: null };
                }
                yield fs_1.default.promises.unlink(p);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    sizeOf(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const p = path_1.default.join(this._config.directory, bucketName, fileName);
                const { size } = yield fs_1.default.promises.stat(p);
                return { value: size, error: null };
            }
            catch (e) {
                return { value: null, error: e.message };
            }
        });
    }
    bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                const p = path_1.default.join(this._config.directory, bucketName);
                // const r = fs.existsSync(p);
                const m = yield fs_1.default.promises.stat(p);
                return { value: true, error: null };
            }
            catch (e) {
                // console.log(e);
                // error only means that the directory does not exist
                return { value: false, error: null };
            }
        });
    }
    fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.configError !== null) {
                return { value: null, error: this.configError };
            }
            try {
                yield fs_1.default.promises.access(path_1.default.join(this._config.directory, bucketName, fileName));
                return { value: true, error: null };
            }
            catch (e) {
                return { value: false, error: null };
            }
        });
    }
}
exports.AdapterLocal = AdapterLocal;
//# sourceMappingURL=AdapterLocal.js.map