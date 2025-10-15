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
        this._provider = general_1.Provider.LOCAL;
        this._configError = null;
        if (typeof config !== "string") {
            this._config = Object.assign({}, config);
        }
        else {
            const { value, error } = (0, util_1.parseUrl)(config);
            if (value === null) {
                this._configError = `[configError] ${error}`;
            }
            else {
                const { protocol: type, username: directory, host: bucketName, searchParams } = value;
                if (directory === null) {
                    this._configError = `[configError] please specify a directory`;
                    return;
                }
                if (searchParams !== null) {
                    this._config = Object.assign({ type, directory }, searchParams);
                }
                else {
                    this._config = { type, directory };
                }
                if (bucketName !== null) {
                    this._config.bucketName = bucketName;
                }
            }
            // console.log(this._config);
        }
        if (typeof this.config.mode !== "undefined") {
            this._config.mode = 0o777;
            const { value, error } = (0, util_1.parseMode)(this.config.mode);
            if (error !== null) {
                this._configError = `[configError] ${error}`;
            }
            else if (value !== null) {
                this._config.mode = value;
            }
        }
        if (typeof this.config.directory !== "string") {
            this._configError =
                "[configError] You must specify a value for 'directory' for storage type 'local'";
        }
        if (typeof this.config.bucketName !== "undefined") {
            this._bucketName = this.config.bucketName;
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
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
            }
        });
    }
    globFiles(folder_1) {
        return __awaiter(this, arguments, void 0, function* (folder, pattern = "**/*.*") {
            try {
                const files = yield (0, glob_1.glob)(`${folder}/${pattern}`, {});
                return { value: files, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    // protected, called by methods of public API via AbstractAdapter
    _listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
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
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _createBucket(name, _options) {
        return __awaiter(this, void 0, void 0, function* () {
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
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const dest = path_1.default.join(this._config.directory, params.bucketName, params.targetPath);
            const { error } = yield this.createDirectory(path_1.default.dirname(dest));
            if (error !== null) {
                return { value: null, error };
            }
            try {
                let readStream;
                if (typeof params.buffer !== "undefined") {
                    readStream = new stream_1.Readable();
                    readStream._read = () => { }; // _read is required but you can noop it
                    readStream.push(params.buffer);
                    readStream.push(null);
                }
                else if (typeof params.stream !== "undefined") {
                    readStream = params.stream;
                }
                // console.time();
                const writeStream = fs_1.default.createWriteStream(dest, params.options);
                return new Promise((resolve) => {
                    readStream
                        .pipe(writeStream)
                        .on("error", (e) => {
                        resolve({ value: null, error: `[readStream error] ${e.message}` });
                    })
                        .on("finish", () => {
                        resolve({ value: "ok", error: null });
                    });
                    writeStream.on("error", (e) => {
                        resolve({ value: null, error: `[writeStream error] ${e.message}` });
                    });
                });
                // console.timeEnd();
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // remove all files and folders inside bucket directory, but not the directory itself
                const p = path_1.default.join(this._config.directory, name);
                yield (0, rimraf_1.rimraf)(p, { preserveRoot: false });
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const p = path_1.default.join(this._config.directory, name);
                yield (0, rimraf_1.rimraf)(p);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _listFiles(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const storagePath = path_1.default.join(this._config.directory, bucketName);
                const { value: files, error } = yield this.globFiles(storagePath);
                if (files === null) {
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
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const p = path_1.default.join(this._config.directory, bucketName, fileName);
                yield fs_1.default.promises.access(p);
                const stream = fs_1.default.createReadStream(p, options);
                return { value: stream, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getPublicURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const p = path_1.default.join(this._config.directory, bucketName, fileName);
                try {
                    yield fs_1.default.promises.access(p);
                }
                catch (e) {
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
                if (options.withoutDirectory) {
                    return { value: path_1.default.join(bucketName, fileName), error: null };
                }
                // public url is actually just a local path
                return { value: p, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getSignedURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // signed urls are not available for the local adapter, return the public url
            return this._getPublicURL(bucketName, fileName, options);
        });
    }
    _removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const p = path_1.default.join(this._config.directory, bucketName, fileName);
                yield fs_1.default.promises.unlink(p);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _sizeOf(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const p = path_1.default.join(this._config.directory, bucketName, fileName);
                const { size } = yield fs_1.default.promises.stat(p);
                return { value: size, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
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
    _bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            // always true
            return { value: true, error: null };
        });
    }
    _fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_1.default.promises.access(path_1.default.join(this._config.directory, bucketName, fileName));
                return { value: true, error: null };
            }
            catch (e) {
                return { value: false, error: null };
            }
        });
    }
    _getPresignedUploadURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return { value: { url: "" }, error: null };
        });
    }
    // public
    get config() {
        return this._config;
    }
    getConfig() {
        return this.config;
    }
}
exports.AdapterLocal = AdapterLocal;
//# sourceMappingURL=AdapterLocal.js.map