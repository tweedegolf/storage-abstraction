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
exports.AdapterMinioS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const general_1 = require("./types/general");
const util_1 = require("./util");
const AdapterAmazonS3_1 = require("./AdapterAmazonS3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class AdapterMinioS3 extends AdapterAmazonS3_1.AdapterAmazonS3 {
    constructor(config) {
        super(config);
        this._provider = general_1.Provider.MINIO_S3;
        this._configError = null;
        this.parseConfig(config);
        this.checkConfig();
        this._config.forcePathStyle = true;
        // this._config.s3ForcePathStyle = true;
        this._config.signatureVersion = "v4";
        this.createClient();
    }
    makeBucketPublic(bucketName_1) {
        return __awaiter(this, arguments, void 0, function* (bucketName, _options = {}) {
            try {
                const policy = {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            // Sid: "AllowPublicRead",
                            Effect: "Allow",
                            // Principal: { AWS: ["*"] },
                            Principal: "*",
                            Action: ["s3:GetObject"],
                            Resource: [`arn:aws:s3:::${bucketName}/*`],
                        },
                    ],
                };
                yield this._client.send(new client_s3_1.PutBucketPolicyCommand({
                    Bucket: bucketName,
                    Policy: JSON.stringify(policy),
                }));
                return { value: "ok", error: null };
            }
            catch (e) {
                return { value: null, error: `makeBucketPublic: ${(0, util_1.getErrorMessage)(e)}` };
            }
        });
    }
    _bucketIsPublic(bucketName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let isPublic = false;
                const policy = yield this._client.send(new client_s3_1.GetBucketPolicyCommand({ Bucket: bucketName }));
                // console.log('Bucket policy:', policy);
                if (typeof policy.Policy !== "undefined") {
                    const p = JSON.parse(policy.Policy);
                    for (let i = 0; i < p.Statement.length; i++) {
                        const s = p.Statement[i];
                        if (s.Effect === "Allow" && s.Action.includes("s3:GetObject")) {
                            isPublic = true;
                            break;
                        }
                    }
                }
                return { value: isPublic, error: null };
            }
            catch (e) {
                if (e.Code === "NoSuchBucketPolicy") {
                    return { value: false, error: null };
                }
                return { value: null, error: (0, util_1.getErrorMessage)(e) };
            }
        });
    }
    _getPublicURL(bucketName, fileName, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            // let tmp = this._config.endpoint
            // url = `${tmp.substring(0, tmp.indexOf("://") + 3)}${bucketName}.${tmp.substring(tmp.indexOf("://") + 3)}/${fileName}`;
            const url = `${this._config.endpoint}/${bucketName}/${fileName}`;
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
    get config() {
        return this._config;
    }
    getConfig() {
        return this._config;
    }
}
exports.AdapterMinioS3 = AdapterMinioS3;
//# sourceMappingURL=AdapterMinioS3.js.map