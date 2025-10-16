import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, _Object, PutObjectCommand, PutBucketAclCommand, } from "@aws-sdk/client-s3";
import { Options, Provider } from "./types/general";
import { ResultObject, ResultObjectBoolean, ResultObjectObject, } from "./types/result";
import { AdapterConfigAmazonS3 } from "./types/adapter_amazon_s3";
import { getErrorMessage } from "./util";
import { AdapterAmazonS3 } from "./AdapterAmazonS3";

export class AdapterCubbitS3 extends AdapterAmazonS3 {
  declare protected _config: AdapterConfigAmazonS3;
  declare protected _client: S3Client;
  protected _provider: Provider = Provider.CUBBIT;
  protected _configError: null | string = null;

  constructor(config: string | AdapterConfigAmazonS3) {
    super(config);
    this.parseConfig(config);
    this.createClient();
  }

  protected async makeBucketPublic(bucketName: string, _options: Options = {}): Promise<ResultObject> {
    try {
      await this._client.send(
        new PutBucketAclCommand({
          Bucket: bucketName,
          ACL: "public-read", // or "public-read-write"
        })
      );
      return { value: "ok", error: null };
    } catch (e: unknown) {
      return { value: null, error: `make bucket public: ${getErrorMessage(e)}` };
    }
  }

  protected async _bucketIsPublic(_bucketName: string): Promise<ResultObjectBoolean> {
    const error = `${this._provider} does not support checking if a bucket is public, please use the ${this._provider} web console`;
    return { value: null, error };
  }

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    if (options.noCheck !== true) {
      const error = `Cannot check if bucket ${bucketName} is public. Use the Cubbit web console to check this or pass {noCheck: true}`;
      return { value: null, error };
    }
    return { value: `https://${bucketName}.s3.cubbit.eu/${fileName}`, error: null };
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
}
