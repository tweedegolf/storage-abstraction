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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterBackblazeB2 = void 0;
const backblaze_b2_1 = __importDefault(require("backblaze-b2"));
const AbstractAdapter_1 = require("./AbstractAdapter");
const general_1 = require("./types/general");
const util_1 = require("./util");
class AdapterBackblazeB2 extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._provider = general_1.Provider.B2;
        this._configError = null;
        this.authorized = false;
        this.versioning = false;
        if (typeof config !== "string") {
            this._config = Object.assign({}, config);
        }
        else {
            const { value, error } = (0, util_1.parseUrl)(config);
            if (value === null) {
                this._configError = `[configError] ${error}`;
            }
            else {
                const { protocol: type, username: applicationKeyId, password: applicationKey, host: bucketName, searchParams, } = value;
                if (applicationKey === null || applicationKeyId === null) {
                    this._configError =
                        'Please provide both a value for "applicationKey" and "applicationKeyId"';
                    return;
                }
                if (searchParams !== null) {
                    this._config = Object.assign({ type, applicationKeyId, applicationKey }, searchParams);
                }
                else {
                    this._config = { type, applicationKeyId, applicationKey };
                }
                if (bucketName !== null) {
                    this._config.bucketName = bucketName;
                }
            }
            // console.log(this._config);
        }
        try {
            this._client = new backblaze_b2_1.default(this._config);
        }
        catch (e) {
            this._configError = `[configError] ${(0, util_1.getErrorMessage)(e)}`;
        }
        if (typeof this.config.bucketName !== "undefined") {
            this._bucketName = this.config.bucketName;
        }
    }
    // util members
    authorize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.authorized) {
                return { value: "ok", error: null };
            }
            try {
                const { data: _data } = yield this._client.authorize();
                this.authorized = true;
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    getBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this._client.getBucket({ bucketName: name });
                if (data.buckets.length > 0) {
                    const { bucketId, bucketName } = data.buckets[0];
                    return { value: { id: bucketId, name: bucketName }, error: null };
                }
                return { value: null, error: `Could not find bucket "${name}"` };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    getUploadUrl(bucketId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this._client.getUploadUrl({ bucketId });
                if (typeof data.uploadUrl === "undefined") {
                    return { value: null, error: data.message };
                }
                return { value: data, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    getFiles(bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, versioning = this.versioning, numFiles = 1000) {
            const { value: bucket, error } = yield this.getBucket(bucketName);
            if (error !== null) {
                return { value: null, error };
            }
            if (bucket === null) {
                return { value: null, error: `can't find bucket '${bucketName}'` };
            }
            try {
                let data;
                // const options: ListFileVersionsOpts = {
                const options = {
                    bucketId: bucket.id,
                    maxFileCount: numFiles,
                };
                if (versioning) {
                    ({ data } = yield this._client.listFileVersions(options));
                }
                else {
                    ({ data } = yield this._client.listFileNames(options));
                }
                return {
                    value: data.files.map(({ fileId, fileName, contentType, contentLength }) => {
                        return {
                            id: fileId,
                            name: fileName,
                            contentType,
                            contentLength,
                        };
                    }),
                    error: null,
                };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    getFile(bucketName, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const { value: files, error } = yield this.getFiles(bucketName, false);
            if (error !== null) {
                return { value: null, error };
            }
            if (files === null) {
                return { value: null, error: `Could not find file '${name}' in bucket '${bucketName}'.` };
            }
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name === name) {
                    return { value: file, error: null };
                }
            }
            return { value: null, error: `Could not find file '${name}' in bucket '${bucketName}'.` };
        });
    }
    // protected, called by methods of public API via AbstractAdapter
    _listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            try {
                const { data } = yield this._client.listBuckets();
                const value = data.buckets.map(({ bucketName }) => bucketName);
                return { value, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _createBucket(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            let bucketType = "allPrivate";
            if (options.public === true) {
                options.bucketType = "allPublic";
            }
            if (typeof options.bucketType !== "undefined") {
                bucketType = options.bucketType;
            }
            if (bucketType !== "allPrivate" && bucketType !== "allPublic") {
                return {
                    value: null,
                    error: `Bucket type '${options.bucketType}' is not valid: must be either 'allPrivate' or 'allPublic'`,
                };
            }
            try {
                const { data } = yield this._client.createBucket(Object.assign(Object.assign({}, options), { bucketName: name, bucketType }));
                const { bucketType: _type } = data;
                // console.log(_type);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: e.response.data.message };
            }
        });
    }
    _addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            const { bucketName, targetPath } = params;
            const data1 = yield this.getBucket(bucketName);
            if (data1.error !== null) {
                return { value: null, error: data1.error };
            }
            const { value: bucket } = data1;
            const { id: bucketId } = bucket;
            const data2 = yield this.getUploadUrl(bucketId);
            if (data2.error !== null) {
                return { value: null, error: data2.error };
            }
            const { value: { uploadUrl, authorizationToken }, } = data2;
            let { options } = params;
            if (typeof options === "undefined") {
                options = {};
            }
            try {
                let buffer;
                if (typeof params.buffer !== "undefined") {
                    buffer = params.buffer;
                }
                else if (typeof params.stream !== "undefined") {
                    const buffers = []; // eslint-disable-line
                    try {
                        for (var _d = true, _e = __asyncValues(params.stream), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                            _c = _f.value;
                            _d = false;
                            const data = _c;
                            buffers.push(data);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    buffer = Buffer.concat(buffers);
                }
                if (typeof buffer === "undefined") {
                    return { value: null, error: "Could get file buffer" };
                }
                const { data: _data } = yield this._client.uploadFile(Object.assign({ uploadUrl, uploadAuthToken: authorizationToken, fileName: targetPath, data: buffer }, options));
                // console.log(_data);
                return { value: "ok", error: null };
            }
            catch (e) {
                // console.log(e.toJSON());
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getFileAsStream(bucketName_1, fileName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, fileName, options = { start: 0 }) {
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            const data = yield this.getFile(bucketName, fileName);
            if (data.error !== null) {
                return { value: null, error: data.error };
            }
            const { value: file } = data;
            if (file === null) {
                return { value: null, error: `Could not find file '${fileName}' in bucket '${bucketName}'.` };
            }
            const { start, end } = options;
            let range = `bytes=${start}-${end}`;
            if (typeof start === "undefined" && typeof end === "undefined") {
                range = undefined;
            }
            else if (typeof start === "undefined") {
                range = `bytes=0-${end}`;
            }
            else if (typeof end === "undefined") {
                range = `bytes=${start}-`;
            }
            delete options.start;
            delete options.end;
            try {
                const { data } = yield this._client.downloadFileById({
                    fileId: file.id,
                    responseType: "stream",
                    axios: Object.assign({ headers: {
                            "Content-Type": file.contentType,
                            Range: range,
                        } }, options),
                });
                return { value: data, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getPublicURL(bucketName, fileName, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                value: `${this._client.downloadUrl}/file/${bucketName}/${fileName}`,
                error: null,
            };
        });
    }
    _getSignedURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.getBucket(bucketName);
                if (data.error !== null) {
                    return { value: null, error: data.error };
                }
                const { value: bucket } = data;
                const { id: bucketId } = bucket;
                let expiresIn = 300; // 5 * 60
                if (typeof options.expiresIn !== "undefined") {
                    expiresIn = Number.parseInt(options.expiresIn, 10);
                }
                const r = yield this._client.getDownloadAuthorization({
                    bucketId,
                    fileNamePrefix: fileName,
                    validDurationInSeconds: expiresIn,
                });
                const { data: { authorizationToken }, } = r;
                return {
                    value: `${this._client.downloadUrl}/file/${bucketName}/${fileName}?Authorization=${authorizationToken}`,
                    error: null,
                };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            const data = yield this.getFiles(bucketName, true);
            if (data.value === null) {
                return { value: null, error };
            }
            const { value: files } = data;
            const index = files.findIndex(({ name }) => name === fileName);
            if (index === -1) {
                return { value: null, error: `No file '${fileName}' found in bucket '${bucketName}'` };
            }
            if (this.versioning) {
                // delete the file, if the file has more versions, delete the most recent version
                const file = files[index];
                try {
                    yield this._client.deleteFileVersion({
                        fileId: file.id,
                        fileName: file.name,
                    });
                    return { value: "ok", error: null };
                }
                catch (e) {
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
            }
            else {
                // delete all versions of the file
                try {
                    yield Promise.all(files
                        .filter((f) => f.name === fileName)
                        .map(({ id: fileId, name: fileName }) => {
                        // console.log(fileName, fileId);
                        return this._client.deleteFileVersion({
                            fileId,
                            fileName,
                        });
                    }));
                    return { value: "ok", error: null };
                }
                catch (e) {
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
            }
        });
    }
    _clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const { value, error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            const data = yield this.getFiles(name, true);
            if (data.value === null) {
                return { value: null, error: data.error };
            }
            const { value: files } = data;
            try {
                const _data = yield Promise.all(files.map((file) => this._client.deleteFileVersion({
                    fileId: file.id,
                    fileName: file.name,
                })));
                // console.log("[clearBucket]", _data);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _deleteBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error, value: bucket } = yield this.getBucket(name);
            if (bucket === null) {
                return { value: null, error: error };
            }
            try {
                yield this._client.deleteBucket({ bucketId: bucket.id });
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _listFiles(bucketName, numFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            const data = yield this.getFiles(bucketName, this.versioning, numFiles);
            if (data.value !== null) {
                const { value: files } = data;
                return {
                    value: files.map((f) => {
                        return [f.name, f.contentLength];
                    }),
                    error: null,
                };
            }
            else {
                return { value: null, error: data.error };
            }
        });
    }
    _sizeOf(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            const data = yield this.getFile(bucketName, fileName);
            if (data.value !== null) {
                const { value: file } = data;
                return { value: file.contentLength, error: null };
            }
            else {
                return { value: null, error: data.error };
            }
        });
    }
    _bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            const data = yield this.getBucket(bucketName);
            if (data.error === null) {
                return { value: true, error: null };
            }
            else if (data.error.startsWith("Could not find bucket")) {
                return { value: false, error: null };
            }
            else {
                return { value: null, error: data.error };
            }
        });
    }
    _bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error } = yield this.authorize();
            if (error !== null) {
                return { value: null, error };
            }
            try {
                const { data } = yield this._client.listBuckets();
                const index = data.buckets.findIndex((bucket) => bucket.bucketName === bucketName);
                if (index === -1) {
                    return { value: null, error: `Could not find the bucket "${bucketName}"` };
                }
                const bucket = data.buckets[index];
                return { value: bucket.bucketType === "allPublic", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { error, value } = yield this._sizeOf(bucketName, fileName);
            if (error === null) {
                return { value: true, error: null };
            }
            else {
                return { value: false, error: null };
            }
        });
    }
    _getPresignedUploadURL(bucketName, _fileName, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.getBucket(bucketName);
                if (data.error !== null) {
                    return { value: null, error: data.error };
                }
                const { value: bucket } = data;
                const { id: bucketId } = bucket;
                const { value: { uploadUrl, authorizationToken }, } = (yield this.getUploadUrl(bucketId));
                return { value: { url: uploadUrl, authToken: authorizationToken }, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    // public
    get config() {
        return this._config;
    }
    getConfig() {
        return this._config;
    }
    get serviceClient() {
        return this._client;
    }
    getServiceClient() {
        return this._client;
    }
}
exports.AdapterBackblazeB2 = AdapterBackblazeB2;
//# sourceMappingURL=AdapterBackblazeB2.js.map