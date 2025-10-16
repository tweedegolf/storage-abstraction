import { S3Client, _Object, GetBucketAclCommand, PutObjectCommand, DeleteObjectCommand, } from "@aws-sdk/client-s3";
import { Options, Provider } from "./types/general";
import { ResultObject, ResultObjectBoolean, ResultObjectObject, } from "./types/result";
import { AdapterConfigAmazonS3 } from "./types/adapter_amazon_s3";
import { getErrorMessage } from "./util";
import { AdapterAmazonS3 } from "./AdapterAmazonS3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class AdapterBackblazeS3 extends AdapterAmazonS3 {
  declare protected _config: AdapterConfigAmazonS3;
  declare protected _client: S3Client;
  protected _provider: Provider = Provider.BACKBLAZE_S3;
  protected _configError: null | string = null;

  constructor(config: string | AdapterConfigAmazonS3) {
    super(config);
    this.parseConfig(config)
    this.createClient();
  }

  protected async makeBucketPublic(bucketName: string, _options: Options = {}): Promise<ResultObject> {
    const msg = `Bucket '${bucketName}' created successfully but you can only make this bucket public using the ${this._provider} web console`;
    return { value: msg, error: null }
  }

  protected async _bucketIsPublic(bucketName: string): Promise<ResultObjectBoolean> {
    try {
      const aclResult = await this._client.send(new GetBucketAclCommand({ Bucket: bucketName }));
      // If one of the grants is for AllUsers with 'READ', it's public
      const isPublic = aclResult.Grants?.some(
        (grant) =>
          grant.Grantee?.Type === "Group" &&
          grant.Grantee?.URI === "http://acs.amazonaws.com/groups/global/AllUsers" &&
          grant.Permission === "READ"
      );
      return { value: typeof isPublic === "undefined" ? false : isPublic, error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _clearBucket(bucketName: string): Promise<ResultObject> {
    let versions: Array<{ Key: undefined | string; VersionId: undefined | string }> = [];
    const { value, error } = await this.getFileVersions(bucketName);
    if (error !== null) {
      return { value: null, error };
    } else if (Array.isArray(value)) {
      versions = value.map((value) => ({
        Key: value.Key,
        VersionId: value.VersionId,
      }));
    }
    // console.log(versions)
    if (versions.length > 0) {
      try {
        for (const v of versions) {
          await this._client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: v.Key,
              VersionId: v.VersionId,
            })
          );
        }
        return { value: "ok", error: null };
      } catch (e: unknown) {
        return { value: null, error: getErrorMessage(e) };
      }
    } else {
      return { value: "ok", error: null };
    }
  }

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    _options: Options
  ): Promise<ResultObject> {
    const url = `https://${bucketName}.s3.${this.config.region}.backblazeb2.com/${fileName}`;
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
}
