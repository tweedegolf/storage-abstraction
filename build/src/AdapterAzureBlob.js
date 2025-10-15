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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterAzureBlob = void 0;
const stream_1 = require("stream");
const storage_blob_1 = require("@azure/storage-blob");
const identity_1 = require("@azure/identity");
const AbstractAdapter_1 = require("./AbstractAdapter");
const general_1 = require("./types/general");
const util_1 = require("./util");
class AdapterAzureBlob extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._provider = general_1.Provider.AZURE;
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
                const { protocol: provider, username: accountName, password: accountKey, host: bucketName, searchParams, } = value;
                if (searchParams !== null) {
                    this._config = Object.assign({ provider }, searchParams);
                }
                else {
                    this._config = { provider };
                }
                if (accountName !== null) {
                    this._config.accountName = accountName;
                }
                if (accountKey !== null) {
                    this._config.accountKey = accountKey;
                }
                if (bucketName !== null) {
                    this._config.bucketName = bucketName;
                }
            }
        }
        if (!this.config.accountName && !this.config.connectionString) {
            this._configError =
                '[configError] Please provide at least a value for "accountName" or for "connectionString';
            return;
        }
        if (typeof this.config.accountKey !== "undefined") {
            // option 1: accountName + accountKey
            try {
                this.sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(this.config.accountName, this.config.accountKey);
            }
            catch (e) {
                this._configError = `[configError] ${JSON.parse(e.code)}`;
            }
            try {
                this._client = new storage_blob_1.BlobServiceClient(this.getBlobEndpoint(), this.sharedKeyCredential, this.config.options);
            }
            catch (e) {
                this._configError = `[configError] ${(0, util_1.getErrorMessage)(e)}`;
            }
        }
        else if (typeof this.config.sasToken !== "undefined") {
            // option 2: accountName + sasToken
            try {
                this._client = new storage_blob_1.BlobServiceClient(`${this.getBlobEndpoint()}?${this.config.sasToken}`, new storage_blob_1.AnonymousCredential(), this.config.options);
            }
            catch (e) {
                this._configError = `[configError] ${(0, util_1.getErrorMessage)(e)}`;
            }
        }
        else if (typeof this.config.connectionString !== "undefined") {
            // option 3: connection string
            try {
                this._client = storage_blob_1.BlobServiceClient.fromConnectionString(this.config.connectionString);
            }
            catch (e) {
                this._configError = `[configError] ${(0, util_1.getErrorMessage)(e)}`;
            }
        }
        else {
            // option 4: passwordless / Microsoft Entra
            // see: https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/local-development-environment-developer-account?tabs=azure-portal%2Csign-in-azure-powershell
            try {
                this._client = new storage_blob_1.BlobServiceClient(this.getBlobEndpoint(), new identity_1.DefaultAzureCredential(), this.config.options);
            }
            catch (e) {
                this._configError = `[configError] ${(0, util_1.getErrorMessage)(e)}`;
            }
        }
        if (typeof this.config.bucketName !== "undefined") {
            this._bucketName = this.config.bucketName;
        }
    }
    getBlobEndpoint() {
        let endpoint = "";
        let protocol = "";
        if (typeof this.config.blobDomain !== "undefined") {
            let blobDomain = this.config.blobDomain;
            if (blobDomain.indexOf("http") === 0) {
                protocol = blobDomain.substring(0, blobDomain.indexOf("://") + 3);
            }
            blobDomain = blobDomain.replace(/^(https?:\/\/)/i, "");
            // for local testing with Azurite
            if (blobDomain.indexOf("127.0.0.1") === 0 || blobDomain.indexOf("localhost") === 0) {
                endpoint = `${protocol === "" ? "http://" : protocol}${blobDomain}/${this.config.accountName}`;
            }
            else {
                endpoint = `${protocol === "" ? "https://" : protocol}${this.config.accountName}.${blobDomain}`;
            }
        }
        else {
            endpoint = `https://${this.config.accountName}.blob.core.windows.net`;
        }
        // console.log(endpoint);
        return endpoint;
    }
    // protected, called by methods of public API via AbstractAdapter
    _listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            // let i = 0;
            try {
                const bucketNames = [];
                try {
                    // let i = 0;
                    for (var _d = true, _e = __asyncValues(this._client.listContainers()), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const container = _c;
                        // console.log(`${i++} ${container.name}`);
                        bucketNames.push(container.name);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return { value: bucketNames, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _createBucket(name, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (options.public === true && typeof options.access === "undefined") {
                    options.access = "blob";
                }
                const res = yield this._client.createContainer(name, options);
                // const containerClient = this._client.getContainerClient(name);
                // await containerClient.create();
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
                const { start, end } = options;
                let offset;
                let count;
                if (typeof start !== "undefined") {
                    offset = start;
                }
                else {
                    offset = 0;
                }
                if (typeof end !== "undefined") {
                    count = end - offset + 1;
                }
                delete options.start;
                delete options.end;
                // console.log(offset, count, options);
                try {
                    const stream = yield file.download(offset, count, options);
                    return { value: stream.readableStreamBody, error: null };
                }
                catch (e) {
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getPublicURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (options.noCheck !== true) {
                    const result = yield this._bucketIsPublic(bucketName);
                    if (result.error !== null) {
                        return { value: null, error: result.error };
                    }
                    else if (result.value === false) {
                        return { value: null, error: `Bucket "${bucketName}" is not public!` };
                    }
                }
                const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
                return { value: file.url, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getSignedURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
                const exp = new Date();
                if (typeof options.expiresIn !== "number") {
                    exp.setUTCDate(exp.getUTCDate() + 7);
                }
                else {
                    exp.setSeconds(exp.getSeconds() + options.expiresIn);
                }
                // console.log(exp)
                const sasOptions = {
                    permissions: options.permissions || storage_blob_1.BlobSASPermissions.parse("r"),
                    expiresOn: exp,
                };
                const url = yield file.generateSasUrl(sasOptions);
                return { value: url, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _clearBucket(name) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            try {
                // const containerClient = this._client.getContainerClient(name);
                // const blobs = containerClient.listBlobsFlat();
                // for await (const blob of blobs) {
                //   console.log(blob.name);
                //   await containerClient.deleteBlob(blob.name);
                // }
                const containerClient = this._client.getContainerClient(name);
                const blobs = containerClient.listBlobsByHierarchy("/");
                try {
                    for (var _d = true, blobs_1 = __asyncValues(blobs), blobs_1_1; blobs_1_1 = yield blobs_1.next(), _a = blobs_1_1.done, !_a; _d = true) {
                        _c = blobs_1_1.value;
                        _d = false;
                        const blob = _c;
                        if (blob.kind === "prefix") {
                            // console.log("prefix", blob);
                        }
                        else {
                            yield containerClient.deleteBlob(blob.name);
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = blobs_1.return)) yield _b.call(blobs_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
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
                const del = yield this._client.deleteContainer(name);
                //console.log('deleting container: ', del);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _listFiles(bucketName, numFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_3, _b, _c;
            try {
                let name = bucketName;
                let prefix = "";
                if (bucketName.indexOf("/") !== -1) {
                    [name, prefix] = bucketName.split("/");
                }
                const listOptions = {
                    includeMetadata: false,
                    includeSnapshots: false,
                    prefix, // Filter results by blob name prefix
                };
                const files = [];
                const data = this._client.getContainerClient(name).listBlobsFlat(listOptions);
                try {
                    for (var _d = true, data_1 = __asyncValues(data), data_1_1; data_1_1 = yield data_1.next(), _a = data_1_1.done, !_a; _d = true) {
                        _c = data_1_1.value;
                        _d = false;
                        const blob = _c;
                        if (typeof blob.properties.contentLength !== "undefined") {
                            files.push([blob.name, blob.properties.contentLength]);
                        }
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = data_1.return)) yield _b.call(data_1);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                return { value: files, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
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
                if (typeof readStream === "undefined") {
                    return { value: null, error: `could not read local file, buffer or stream` };
                }
                const file = this._client
                    .getContainerClient(params.bucketName)
                    .getBlobClient(params.targetPath)
                    .getBlockBlobClient();
                const writeStream = yield file.uploadStream(readStream, 64000, 20, params.options);
                if (writeStream.errorCode) {
                    return { value: null, error: writeStream.errorCode };
                }
                else {
                    return { value: "ok", error: null };
                }
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const container = this._client.getContainerClient(bucketName);
                const file = yield container.getBlobClient(fileName).deleteIfExists();
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
                const blob = this._client.getContainerClient(bucketName).getBlobClient(fileName);
                const length = (yield blob.getProperties()).contentLength;
                if (typeof length === "undefined") {
                    return { value: null, error: `could not calculate filesize of ${fileName}` };
                }
                return { value: length, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const containerClient = this._client.getContainerClient(bucketName);
                const response = yield containerClient.getAccessPolicy();
                const accessLevel = response.blobPublicAccess; // "container", "blob", or undefined/null ("none")
                const value = accessLevel === "container" || accessLevel === "blob";
                return { value, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _bucketExists(name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cont = this._client.getContainerClient(name);
                const exists = yield cont.exists();
                return { value: exists, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const exists = yield this._client
                    .getContainerClient(bucketName)
                    .getBlobClient(fileName)
                    .exists();
                return { value: exists, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getPresignedUploadURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let starts = new Date();
                let offset = 1 * -60;
                if (typeof options.startsAt !== "undefined") {
                    offset = Number.parseInt(options.startsAt, 10);
                }
                starts.setSeconds(starts.getSeconds() + offset);
                let expires = new Date();
                offset = 5 * 60;
                if (typeof options.expiresIn !== "undefined") {
                    offset = Number.parseInt(options.expiresIn, 10);
                }
                expires.setSeconds(expires.getSeconds() + offset);
                let permissions = { add: true, create: true, write: true };
                if (typeof options.permissions !== "undefined") {
                    permissions = options.permissions;
                }
                const blockBlobClient = this._client
                    .getContainerClient(bucketName)
                    .getBlockBlobClient(fileName);
                const url = yield blockBlobClient.generateSasUrl({
                    permissions: storage_blob_1.BlobSASPermissions.from(permissions),
                    expiresOn: expires,
                    startsOn: starts,
                });
                return { value: { url }, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
            /*
            // Set the permissions for the SAS token
            const permissions = new ContainerSASPermissions();
            permissions.write = true; // Allow write access
        
            // Set the expiry time for the SAS token
            const expiryDate = new Date();
            expiryDate.setMinutes(expiryDate.getMinutes() + 30); // Token valid for 30 minutes
        
            // Generate the SAS token
            const sasToken = generateBlobSASQueryParameters({
              containerName: bucketName,
              blobName: fileName,
              permissions: permissions,
              startsOn: new Date(Date.now() - 1 * 60 * 1000),
              expiresOn: expiryDate
            }, new StorageSharedKeyCredential(this.config.accountName, this.config.accountKey)).toString();
        
            console.log(this.config.accountName, this.config.accountKey, sasToken);
            // Construct the presigned URL
            const url = `${this._client.getContainerClient(bucketName).getBlobClient(fileName).url}?${sasToken}`;
            return { value: { url }, error: null };
            */
            // /*
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
exports.AdapterAzureBlob = AdapterAzureBlob;
function generateContainerSASQueryParameters(arg0, credential) {
    throw new Error("Function not implemented.");
}
//# sourceMappingURL=AdapterAzureBlob.js.map