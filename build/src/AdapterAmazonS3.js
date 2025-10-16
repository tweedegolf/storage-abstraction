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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterAmazonS3 = void 0;
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const client_s3_1 = require("@aws-sdk/client-s3");
const AbstractAdapter_1 = require("./AbstractAdapter");
const general_1 = require("./types/general");
const util_1 = require("./util");
class AdapterAmazonS3 extends AbstractAdapter_1.AbstractAdapter {
    constructor(config) {
        super(config);
        this._provider = general_1.Provider.AWS;
        this._configError = null;
        this.parseConfig(config);
        this.createClient();
    }
    // protected helper functions
    parseConfig(config) {
        if (typeof config !== "string") {
            this._config = Object.assign({}, config);
        }
        else {
            const { value, error } = (0, util_1.parseUrl)(config);
            if (value === null) {
                this._configError = `[configError] ${error}`;
            }
            else {
                const { protocol: provider, username: accessKeyId, password: secretAccessKey, host: bucketName, searchParams, } = value;
                if (searchParams !== null) {
                    this._config = Object.assign({ provider }, searchParams);
                }
                else {
                    this._config = { provider };
                }
                if (accessKeyId !== null) {
                    this._config.accessKeyId = accessKeyId;
                }
                if (secretAccessKey !== null) {
                    this._config.secretAccessKey = secretAccessKey;
                }
                if (bucketName !== null) {
                    this._config.bucketName = bucketName;
                }
            }
        }
        if (typeof this.config.bucketName !== "undefined") {
            this._bucketName = this.config.bucketName;
        }
    }
    createClient() {
        try {
            if (this.config.accessKeyId && this.config.secretAccessKey) {
                const o = Object.assign({}, this.config); // eslint-disable-line
                delete o.credentials;
                delete o.accessKeyId;
                delete o.secretAccessKey;
                this._client = new client_s3_1.S3Client(Object.assign({ credentials: {
                        accessKeyId: this.config.accessKeyId,
                        secretAccessKey: this.config.secretAccessKey,
                    } }, o));
            }
            else {
                console.log("Do we ever get here?");
                const o = Object.assign({}, this.config); // eslint-disable-line
                delete o.accessKeyId;
                delete o.secretAccessKey;
                this._client = new client_s3_1.S3Client(o);
            }
        }
        catch (e) {
            this._configError = `[configError] ${(0, util_1.getErrorMessage)(e)}`;
        }
    }
    getFiles(bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, maxFiles = 10000) {
            try {
                const input = {
                    Bucket: bucketName,
                    MaxKeys: maxFiles,
                };
                const command = new client_s3_1.ListObjectsCommand(input);
                const { Contents } = yield this._client.send(command);
                // console.log("Contents", Contents);
                return { value: typeof Contents === "undefined" ? [] : Contents, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    getFileVersions(bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, maxFiles = 10000) {
            try {
                const input = {
                    Bucket: bucketName,
                    MaxKeys: maxFiles,
                };
                const command = new client_s3_1.ListObjectVersionsCommand(input);
                const { Versions } = yield this._client.send(command);
                // console.log("Versions", Versions);
                return { value: typeof Versions === "undefined" ? [] : Versions, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    makeBucketPublic(bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, _options = {}) {
            try {
                yield this._client.send(new client_s3_1.PutPublicAccessBlockCommand({
                    Bucket: bucketName,
                    PublicAccessBlockConfiguration: {
                        BlockPublicAcls: false,
                        IgnorePublicAcls: false,
                        BlockPublicPolicy: false, // DISABLE BlockPublicPolicy
                        RestrictPublicBuckets: false,
                    },
                }));
                const publicReadPolicy = {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Sid: "AllowPublicRead",
                            Effect: "Allow",
                            // Principal: "*",
                            Principal: { AWS: ["*"] },
                            Action: ["s3:GetObject"],
                            Resource: [`arn:aws:s3:::${bucketName}/*`],
                        },
                    ],
                };
                yield this._client.send(new client_s3_1.PutBucketPolicyCommand({
                    Bucket: bucketName,
                    Policy: JSON.stringify(publicReadPolicy),
                }));
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: `makeBucketPublic: ${(0, util_1.getErrorMessage)(e)}` };
            }
        });
    }
    // protected methods, called by public methods of the API via AbstractAdapter
    _listBuckets() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = {};
                const command = new client_s3_1.ListBucketsCommand(input);
                const response = yield this._client.send(command);
                let bucketNames = [];
                if (typeof response.Buckets !== "undefined") {
                    const tmp = response.Buckets.map((b) => b.Name);
                    bucketNames = tmp.filter((name) => typeof name !== "undefined");
                }
                return { value: bucketNames, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _createBucket(bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, options = {}) {
            try {
                const input = Object.assign({ Bucket: bucketName }, options);
                const command = new client_s3_1.CreateBucketCommand(input);
                yield this._client.send(command);
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
            try {
                yield (0, client_s3_1.waitUntilBucketExists)({
                    client: this._client,
                    maxWaitTime: 120,
                }, { Bucket: bucketName });
            }
            catch (e) {
                return { value: null, error: `waitUntilBucketExists: ${(0, util_1.getErrorMessage)(e)}` };
            }
            if (options.public === true) {
                return this.makeBucketPublic(bucketName, options);
            }
            // if (options.versioning === true) {
            //   try {
            //     const input = {
            //       Bucket: bucketName,
            //       VersioningConfiguration: {
            //         Status: BucketVersioningStatus.Enabled,
            //       },
            //     };
            //     const command = new PutBucketVersioningCommand(input);
            //     await this._client.send(command);
            //   } catch (e) {
            //     return { value: null, error: `enable versioning: ${e.message}` };
            //   }
            // }
            return { value: "ok", error: null };
        });
    }
    _clearBucket(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            let objects = [];
            const { value, error } = yield this.getFiles(bucketName);
            if (error !== null) {
                return { value: null, error };
            }
            else if (value !== null && value.length > 0) {
                objects = value.map((value) => ({ Key: value.Key }));
            }
            if (objects.length > 0) {
                try {
                    const input = {
                        Bucket: bucketName,
                        Delete: {
                            Objects: objects,
                            Quiet: false,
                        },
                    };
                    const command = new client_s3_1.DeleteObjectsCommand(input);
                    yield this._client.send(command);
                    // return { value: `${objects.length} files removed from '${bucketName}'`, error: null };
                    return { value: "ok", error: null };
                }
                catch (e) {
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
            }
            else {
                // return { value: `No files removed; ${bucketName} contained no files`, error: null };
                return { value: "ok", error: null };
            }
        });
    }
    _deleteBucket(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = {
                    Bucket: bucketName,
                };
                const command = new client_s3_1.DeleteBucketCommand(input);
                const response = yield this._client.send(command);
                // console.log(response);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _bucketExists(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = {
                    Bucket: bucketName,
                };
                const command = new client_s3_1.HeadBucketCommand(input);
                yield this._client.send(command);
                return { value: true, error: null };
            }
            catch (e) {
                return { value: false, error: null };
            }
        });
    }
    _bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                // 1. Check bucket policy status
                const policyStatusResponse = yield this._client.send(new client_s3_1.GetBucketPolicyStatusCommand({ Bucket: bucketName }));
                // console.log("policyStatusResponse", policyStatusResponse);
                const isPolicyPublic = ((_a = policyStatusResponse.PolicyStatus) === null || _a === void 0 ? void 0 : _a.IsPublic) || false;
                // 2. Check public access block settings
                const pabResponse = yield this._client.send(new client_s3_1.GetPublicAccessBlockCommand({ Bucket: bucketName }));
                // console.log("pabResponse", pabResponse);
                const pabConfig = pabResponse.PublicAccessBlockConfiguration || {};
                const blocksPublicPolicy = (_b = pabConfig.BlockPublicPolicy) !== null && _b !== void 0 ? _b : true; // default true if undefined
                // 3. Check bucket ACL for public grants
                const aclResponse = yield this._client.send(new client_s3_1.GetBucketAclCommand({ Bucket: bucketName }));
                // console.log("aclResponse", aclResponse);
                const publicGrantUris = [
                    "http://acs.amazonaws.com/groups/global/AllUsers",
                    "http://acs.amazonaws.com/groups/global/AuthenticatedUsers",
                ];
                let hasPublicAcl = (_c = aclResponse.Grants) === null || _c === void 0 ? void 0 : _c.some((grant) => {
                    var _a;
                    return ((_a = grant.Grantee) === null || _a === void 0 ? void 0 : _a.URI) &&
                        publicGrantUris.includes(grant.Grantee.URI) &&
                        (grant.Permission === "READ" || grant.Permission === "WRITE");
                });
                hasPublicAcl = typeof hasPublicAcl === "undefined" ? false : hasPublicAcl;
                // Bucket is effectively public if:
                // - Policy allows public
                // - BlockPublicPolicy is disabled (false)
                // - OR ACL grants public permissions
                const isBucketPublic = (isPolicyPublic && !blocksPublicPolicy) || hasPublicAcl;
                return { value: isBucketPublic, error: null };
            }
            catch (e) {
                if (e.name === "NoSuchPublicAccessBlockConfiguration") {
                    // No Public Access Block means no restrictions by default, check policy and ACL anyway
                    return { value: true, error: null }; // potential public, or run further checks
                }
                if (e.name === "NoSuchBucketPolicy") {
                    // No bucket policy means no public policy, but could still have public ACL
                    const aclResponse = yield this._client.send(new client_s3_1.GetBucketAclCommand({ Bucket: bucketName }));
                    const publicGrantUris = [
                        "http://acs.amazonaws.com/groups/global/AllUsers",
                        "http://acs.amazonaws.com/groups/global/AuthenticatedUsers",
                    ];
                    const hasPublicAcl = (_d = aclResponse.Grants) === null || _d === void 0 ? void 0 : _d.some((grant) => {
                        var _a;
                        return ((_a = grant.Grantee) === null || _a === void 0 ? void 0 : _a.URI) &&
                            publicGrantUris.includes(grant.Grantee.URI) &&
                            (grant.Permission === "READ" || grant.Permission === "WRITE");
                    });
                    return { value: typeof hasPublicAcl === "undefined" ? false : hasPublicAcl, error: null };
                }
                return { value: null, error: `bucketIsPublic: ${(0, util_1.getErrorMessage)(e)}` };
            }
        });
    }
    _addFile(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                let fileData = undefined;
                if (typeof params.buffer !== "undefined") {
                    fileData = params.buffer;
                }
                else if (typeof params.stream !== "undefined") {
                    fileData = params.stream;
                }
                if (typeof ((_a = params.options) === null || _a === void 0 ? void 0 : _a.ACL) === "string") {
                    params.options.ACL = params.options.ACL;
                }
                const input = Object.assign({ Bucket: params.bucketName, Key: params.targetPath, Body: fileData }, params.options);
                const command = new client_s3_1.PutObjectCommand(input);
                const response = yield this._client.send(command);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getFileAsStream(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
            try {
                const params = {
                    Bucket: bucketName,
                    Key: fileName,
                    Range: range,
                };
                const command = new client_s3_1.GetObjectCommand(params);
                const response = yield this._client.send(command);
                return { value: response.Body, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _removeFile(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this._client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: fileName,
                }));
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _removeFileVersions(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            let versions = [];
            // first check if there are any versioned files
            const { value, error } = yield this.getFileVersions(bucketName);
            if (error !== null) {
                return { value: null, error };
            }
            else if (value !== null) {
                versions = value.map((value) => ({ Key: value.Key }));
            }
            if (versions.length > 0) {
                try {
                    for (const v of versions) {
                        yield this._client.send(new client_s3_1.DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: fileName,
                            VersionId: v.VersionId,
                        }));
                    }
                    return { value: "ok", error: null };
                }
                catch (e) {
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
            }
            else {
                try {
                    yield this._client.send(new client_s3_1.DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: fileName,
                    }));
                    return { value: "ok", error: null };
                }
                catch (e) {
                    return { value: null, error: (0, util_1.getErrorMessage)(e) };
                }
            }
        });
    }
    _getPublicURL(bucketName, fileName, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${bucketName}.s3.${this.config.region}.amazonaws.com/${fileName}`;
            return { value: url, error: null };
        });
    }
    _getSignedURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (typeof options.expiresIn !== "number") {
                    options.expiresIn = 604800; // one week: 7*24*60*60
                }
                // console.log(options.expiresIn);
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(this._client, new client_s3_1.GetObjectCommand({
                    Bucket: bucketName,
                    Key: fileName,
                }), options);
                return { value: url, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _listFiles(bucketName, numFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { value, error } = yield this.getFiles(bucketName, numFiles);
                if (error !== null) {
                    return { value: null, error };
                }
                if (value === null) {
                    return { value: [], error: null };
                }
                const tmp = value.map((o) => {
                    if (typeof o.Key === "undefined" || typeof o.Size === "undefined") {
                        return null;
                    }
                    return [o.Key, o.Size];
                });
                return { value: tmp.filter((o) => o !== null), error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _sizeOf(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = {
                    Bucket: bucketName,
                    Key: fileName,
                };
                const command = new client_s3_1.HeadObjectCommand(input);
                const response = yield this._client.send(command);
                if (typeof response.ContentLength === "undefined") {
                    return { value: null, error: `could not calculate filesize of ${fileName}` };
                }
                return { value: response.ContentLength, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _fileExists(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = {
                    Bucket: bucketName,
                    Key: fileName,
                };
                const command = new client_s3_1.HeadObjectCommand(input);
                yield this._client.send(command);
                return { value: true, error: null };
            }
            catch (e) {
                return { value: false, error: null };
            }
        });
    }
    _getPresignedUploadURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let expiresIn = 300; // 5 * 60
            if (typeof options.expiresIn !== "undefined") {
                expiresIn = Number.parseInt(options.expiresIn, 10);
            }
            let conditions = [
                ["starts-with", "$key", fileName],
                // ["content-length-range", 1, 25 * 1024 * 1024],
                // ["starts-with", "$Content-Type", ""], // or "image/" to restrict
                { "x-amz-server-side-encryption": "AES256" },
                // { "acl": "private" },                 // if using ACLs
                // ["starts-with", "$x-amz-meta-user", ""], // force certain metadata fields
            ];
            if (typeof options.conditions !== "undefined") {
                conditions = options.conditions;
            }
            let fields = {
                "x-amz-server-side-encryption": "AES256",
                acl: "bucket-owner-full-control",
            };
            if (typeof options.fields !== "undefined") {
                fields = options.fields;
            }
            try {
                let data;
                data = yield (0, s3_presigned_post_1.createPresignedPost)(this._client, {
                    Bucket: bucketName,
                    Key: fileName,
                    Expires: expiresIn,
                    Conditions: conditions,
                    Fields: fields,
                });
                return { value: data, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    // public
    getFileInfo(bucketName, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const input = {
                    Bucket: bucketName, // required
                    Key: fileName, // required
                    // VersionId: "STRING_VALUE",
                    // MaxParts: Number("int"),
                    // PartNumberMarker: "STRING_VALUE",
                    // SSECustomerAlgorithm: "STRING_VALUE",
                    // SSECustomerKey: "STRING_VALUE",
                    // SSECustomerKeyMD5: "STRING_VALUE",
                    // RequestPayer: "requester",
                    // ExpectedBucketOwner: "STRING_VALUE",
                    ObjectAttributes: ["ETag", "Checksum", "ObjectParts", "StorageClass", "ObjectSize"],
                };
                const command = new client_s3_1.GetObjectAttributesCommand(input);
                const response = yield this._client.send(command);
                console.log(response);
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
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
exports.AdapterAmazonS3 = AdapterAmazonS3;
//# sourceMappingURL=AdapterAmazonS3.js.map