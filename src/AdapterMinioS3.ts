import { S3Client, _Object, PutBucketPolicyCommand, PutObjectCommand, GetBucketPolicyCommand, } from "@aws-sdk/client-s3";
import { Options, Provider } from "./types/general";
import { ResultObject, ResultObjectBoolean, ResultObjectObject, } from "./types/result";
import { AdapterConfigS3 } from "./types/adapter_amazon_s3";
import { getErrorMessage } from "./util";
import { AdapterAmazonS3 } from "./AdapterAmazonS3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class AdapterMinioS3 extends AdapterAmazonS3 {
  declare protected _config: AdapterConfigS3;
  declare protected _client: S3Client;
  protected _provider: Provider = Provider.MINIO_S3;
  protected _configError: null | string = null;

  constructor(config: string | AdapterConfigS3) {
    super(config);
    this.parseConfig(config);
    this.checkConfig();
    this._config.forcePathStyle = true;
    // this._config.s3ForcePathStyle = true;
    this._config.signatureVersion = "v4";
    this.createClient();
  }

  protected async makeBucketPublic(bucketName: string, _options: Options = {}): Promise<ResultObject> {
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
      await this._client.send(
        new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: JSON.stringify(policy),
        })
      );
      return { value: "ok", error: null };
    } catch (e: unknown) {
      return { value: null, error: `makeBucketPublic: ${getErrorMessage(e)}` };
    }
  }

  protected async _bucketIsPublic(bucketName: string): Promise<ResultObjectBoolean> {
    try {
      let isPublic = false;
      const policy = await this._client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
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
    } catch (e: unknown) {
      if ((e as any).Code === "NoSuchBucketPolicy") {
        return { value: false, error: null };
      }
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    _options: Options
  ): Promise<ResultObject> {
    // let tmp = this._config.endpoint
    // url = `${tmp.substring(0, tmp.indexOf("://") + 3)}${bucketName}.${tmp.substring(tmp.indexOf("://") + 3)}/${fileName}`;
    const url = `${this._config.endpoint}/${bucketName}/${fileName}`;
    return { value: url, error: null };
  }

  protected async _getPresignedUploadURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObjectObject> {
    let expiresIn = 300; // 5 * 60
    if (typeof options.expiresIn !== "undefined") {
      expiresIn = Number.parseInt(options.expiresIn, 10);
    }

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        ACL: "public-read",
      });
      const url = await getSignedUrl(this._client, command, { expiresIn });
      return { value: { url }, error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  get config(): AdapterConfigS3 {
    return this._config as AdapterConfigS3;
  }

  getConfig(): AdapterConfigS3 {
    return this._config as AdapterConfigS3;
  }
}
