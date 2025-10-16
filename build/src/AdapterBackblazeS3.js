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
exports.AdapterBackblazeS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const general_1 = require("./types/general");
const util_1 = require("./util");
const AdapterAmazonS3_1 = require("./AdapterAmazonS3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class AdapterBackblazeS3 extends AdapterAmazonS3_1.AdapterAmazonS3 {
    constructor(config) {
        super(config);
        this._provider = general_1.Provider.BACKBLAZE_S3;
        this._configError = null;
        this.parseConfig(config);
        this.createClient();
    }
    makeBucketPublic(bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, _options = {}) {
            const msg = `Bucket '${bucketName}' created successfully but you can only make this bucket public using the Backblaze B2 web console`;
            return { value: msg, error: null };
        });
    }
    _bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const aclResult = yield this._client.send(new client_s3_1.GetBucketAclCommand({ Bucket: bucketName }));
                // If one of the grants is for AllUsers with 'READ', it's public
                const isPublic = (_a = aclResult.Grants) === null || _a === void 0 ? void 0 : _a.some((grant) => {
                    var _a, _b;
                    return ((_a = grant.Grantee) === null || _a === void 0 ? void 0 : _a.Type) === "Group" &&
                        ((_b = grant.Grantee) === null || _b === void 0 ? void 0 : _b.URI) === "http://acs.amazonaws.com/groups/global/AllUsers" &&
                        grant.Permission === "READ";
                });
                return { value: typeof isPublic === "undefined" ? false : isPublic, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _clearBucket(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            let versions = [];
            const { value, error } = yield this.getFileVersions(bucketName);
            if (error !== null) {
                return { value: null, error };
            }
            else if (Array.isArray(value)) {
                versions = value.map((value) => ({
                    Key: value.Key,
                    VersionId: value.VersionId,
                }));
            }
            // console.log(versions)
            if (versions.length > 0) {
                try {
                    for (const v of versions) {
                        yield this._client.send(new client_s3_1.DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: v.Key,
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
                return { value: "ok", error: null };
            }
        });
    }
    _getPublicURL(bucketName, fileName, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://${bucketName}.s3.${this.config.region}.backblazeb2.com/${fileName}`;
            return { value: url, error: null };
        });
    }
    _getPresignedUploadURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let expiresIn = 300; // 5 * 60
            if (typeof options.expiresIn !== "undefined") {
                expiresIn = Number.parseInt(options.expiresIn, 10);
            }
            try {
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: bucketName,
                    Key: fileName,
                    ACL: "public-read",
                });
                const url = yield (0, s3_request_presigner_1.getSignedUrl)(this._client, command, { expiresIn });
                return { value: { url }, error: null };
            }
            catch (e) {
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
}
exports.AdapterBackblazeS3 = AdapterBackblazeS3;
//# sourceMappingURL=AdapterBackblazeS3.js.map