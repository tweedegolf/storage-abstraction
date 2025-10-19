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
exports.AdapterCubbitS3 = void 0;
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const client_s3_1 = require("@aws-sdk/client-s3");
const general_1 = require("./types/general");
const util_1 = require("./util");
const AdapterAmazonS3_1 = require("./AdapterAmazonS3");
class AdapterCubbitS3 extends AdapterAmazonS3_1.AdapterAmazonS3 {
    constructor(config) {
        super(config);
        this._provider = general_1.Provider.CUBBIT;
        this._configError = null;
        this.parseConfig(config);
        this.checkConfig();
        this.createClient();
    }
    makeBucketPublic(bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, _options = {}) {
            try {
                yield this._client.send(new client_s3_1.PutBucketAclCommand({
                    Bucket: bucketName,
                    ACL: "public-read", // or "public-read-write"
                }));
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: `make bucket public: ${(0, util_1.getErrorMessage)(e)}` };
            }
        });
    }
    _bucketIsPublic(_bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            const error = "Cubbit does not support checking if a bucket is public, please use the Cubbit web console";
            return { value: null, error };
        });
    }
    _getPublicURL(bucketName, fileName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.noCheck !== true) {
                const error = `Cannot check if bucket '${bucketName}' is public. Use the Cubbit web console to check this or pass {noCheck: true}`;
                return { value: null, error };
            }
            return { value: `https://${bucketName}.s3.cubbit.eu/${fileName}`, error: null };
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
    get config() {
        return this._config;
    }
    getConfig() {
        return this._config;
    }
}
exports.AdapterCubbitS3 = AdapterCubbitS3;
//# sourceMappingURL=AdapterCubbitS3.js.map