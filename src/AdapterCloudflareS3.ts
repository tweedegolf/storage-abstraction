import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, _Object, PutObjectCommand, } from "@aws-sdk/client-s3";
import { Options, Provider } from "./types/general";
import { ResultObject, ResultObjectBoolean, ResultObjectObject, } from "./types/result";
import { AdapterConfigS3 } from "./types/adapter_amazon_s3";
import { getErrorMessage } from "./util";
import { AdapterAmazonS3 } from "./AdapterAmazonS3";

export class AdapterCloudflareS3 extends AdapterAmazonS3 {
  declare protected _config: AdapterConfigS3;
  declare protected _client: S3Client;
  protected _provider: Provider = Provider.CLOUDFLARE;
  protected _configError: null | string = null;

  constructor(config: string | AdapterConfigS3) {
    super(config);
    this.parseConfig(config);
    this.checkConfig();
    this.createClient();
  }

  protected override async makeBucketPublic(bucketName: string, _options: Options = {}): Promise<ResultObject> {
    const msg = `Bucket '${bucketName}' created successfully but you can only make this bucket public using the Cloudflare R2 web console`;
    return { value: msg, error: null }
  }

  protected override async _bucketIsPublic(_bucketName: string): Promise<ResultObjectBoolean> {
    const error = "Cloudflare does not support checking if a bucket is public, please use the Cloudflare R2 web console";
    return { value: null, error };
  }

  protected override async _getPublicURL(
    _bucketName: string,
    _fileName: string,
    _options: Options
  ): Promise<ResultObject> {
    return { value: null, error: "Please use the Cloudflare web console to get the public URL." };
  }

  protected override async _getPresignedUploadURL(
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

  override get config(): AdapterConfigS3 {
    return this._config as AdapterConfigS3;
  }

  override getConfig(): AdapterConfigS3 {
    return this._config as AdapterConfigS3;
  }
}
