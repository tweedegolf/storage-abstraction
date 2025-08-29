import fs from "fs";
import { Readable } from "stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  _Object,
  ListObjectsCommand,
  ObjectVersion,
  ListObjectVersionsCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommandInput,
  CreateBucketCommand,
  DeleteObjectsCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectAttributesCommand,
  GetObjectAttributesRequest,
  waitUntilBucketExists,
  PutBucketPolicyCommand,
  PutPublicAccessBlockCommand,
  GetBucketPolicyStatusCommand,
  GetPublicAccessBlockCommand,
  GetBucketAclCommand,
  PutBucketAclCommand,
  ObjectCannedACL,
  OutputLocationFilterSensitiveLog,
} from "@aws-sdk/client-s3";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, StorageType, S3Type } from "./types/general";
import { FileBufferParams, FilePathParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectStream,
} from "./types/result";
import { AdapterConfigAmazonS3 } from "./types/adapter_amazon_s3";
import { parseUrl } from "./util";

export class AdapterAmazonS3 extends AbstractAdapter {
  protected _type = StorageType.S3;
  protected _config: AdapterConfigAmazonS3;
  protected _configError: string | null = null;
  protected _client: S3Client;
  private _s3Type: S3Type;

  constructor(config?: string | AdapterConfigAmazonS3) {
    super(config);
    if (typeof config !== "string") {
      this._config = { ...config };
    } else {
      const { value, error } = parseUrl(config);
      if (error !== null) {
        this._configError = `[configError] ${error}`;
      } else {
        const {
          protocol: type,
          username: accessKeyId,
          password: secretAccessKey,
          host: bucketName,
          searchParams,
        } = value;
        if (searchParams !== null) {
          this._config = { type, ...searchParams };
        } else {
          this._config = { type };
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
    // console.log(this._config);

    try {
      if (this.config.accessKeyId && this.config.secretAccessKey) {
        const o: { [id: string]: any } = { ...this.config }; // eslint-disable-line
        delete o.credentials;
        delete o.accessKeyId;
        delete o.secretAccessKey;
        this._client = new S3Client({
          credentials: {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          },
          ...o,
        });
      } else {
        const o: { [id: string]: any } = { ...this.config }; // eslint-disable-line
        delete o.accessKeyId;
        delete o.secretAccessKey;
        this._client = new S3Client(o);
      }
    } catch (e) {
      this._configError = `[configError] ${e.message}`;
    }

    if (typeof this.config.bucketName !== "undefined") {
      this._bucketName = this.config.bucketName;
    }

    if (typeof this._config.endpoint === "undefined") {
      this._s3Type = S3Type.AWS;
    } else if (this._config.endpoint.indexOf("amazonaws") !== -1) {
      this._s3Type = S3Type.AWS;
    } else if (this._config.endpoint.indexOf("backblaze") !== -1) {
      this._s3Type = S3Type.BACKBLAZE;
    } else if (this._config.endpoint.indexOf("cloudflare") !== -1) {
      this._s3Type = S3Type.CLOUDFLARE;
    } else if (this._config.endpoint.indexOf("cubbit") !== -1) {
      this._s3Type = S3Type.CUBBIT;
      if (typeof this._config.region === "undefined") {
        this._config.region = "eu";
      }
    }
    // console.log(this._config.endpoint, this._s3Type);
  }


  private async getFiles(
    bucketName: string,
    maxFiles: number = 10000
  ): Promise<{ value: Array<_Object> | null; error: string | null }> {
    try {
      const input = {
        Bucket: bucketName,
        MaxKeys: maxFiles,
      };
      const command = new ListObjectsCommand(input);
      const { Contents } = await this._client.send(command);
      // console.log("Contents", Contents);
      return { value: Contents, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  private async getFileVersions(
    bucketName: string,
    maxFiles: number = 10000
  ): Promise<{ value: Array<ObjectVersion> | null; error: string | null }> {
    try {
      const input = {
        Bucket: bucketName,
        MaxKeys: maxFiles,
      };
      const command = new ListObjectVersionsCommand(input);
      const { Versions } = await this._client.send(command);
      // console.log("Versions", Versions);
      return { value: Versions, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  // protected methods, called by public methods of the API via AbstractAdapter

  protected async _listBuckets(): Promise<ResultObjectBuckets> {
    try {
      const input = {};
      const command = new ListBucketsCommand(input);
      const response = await this._client.send(command);
      const bucketNames = response.Buckets?.map((b) => b?.Name);
      return { value: bucketNames, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _createBucket(bucketName: string, options: Options = {}): Promise<ResultObject> {
    let okMsg = "ok";
    try {
      const input: CreateBucketCommandInput = {
        Bucket: bucketName,
        ...options,
      };
      const command = new CreateBucketCommand(input);
      await this._client.send(command);
    } catch (e) {
      return { value: null, error: e.message };
    }

    try {
      await waitUntilBucketExists({
        client: this._client, maxWaitTime: 120
      }, { Bucket: bucketName });
    } catch (e) {
      return { value: null, error: `waitUntilBucketExists: ${e.message}` };
    }

    try {
      if (options.public === true) {
        if (this._s3Type === S3Type.AWS) {
          await this._client.send(
            new PutPublicAccessBlockCommand({
              Bucket: bucketName,
              PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,
                IgnorePublicAcls: false,
                BlockPublicPolicy: false,       // DISABLE BlockPublicPolicy
                RestrictPublicBuckets: false,
              },
            })
          );
          const publicReadPolicy = {
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "AllowPublicRead",
                Effect: "Allow",
                Principal: "*",
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucketName}/*`]
              }
            ]
          };
          await this._client.send(new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(publicReadPolicy)
          }));
        } else if (this._s3Type === S3Type.CUBBIT) {
          await this._client.send(
            new PutBucketAclCommand({
              Bucket: bucketName,
              ACL: "public-read", // or "public-read-write"
            })
          );
        } else if (this._s3Type === S3Type.CLOUDFLARE || this._s3Type === S3Type.BACKBLAZE) {
          okMsg = `Bucket '${bucketName}' created successfully but you can only make this bucket public using the ${this._s3Type} web console`;
        }
      }
      // const response = await this._client.send(command);
      // console.log(response.Location, response.Location.indexOf(bucketName));
      /*
      console.log(response);
      // not sure if this is necessary
      if (response.$metadata.httpStatusCode === 200) {
        return { value: "ok", error: null };
      } else {
        return {
          value: null,
          error: `Error http status code ${response.$metadata.httpStatusCode}`,
        };
      }
      */
      return { value: okMsg, error: null };
    } catch (e) {
      return { value: null, error: `make bucket public: ${e.message}` };
    }
  }

  protected async _clearBucket(bucketName: string): Promise<ResultObject> {
    let objects: Array<{ Key: string; VersionId?: string }>;

    // first try to remove the versioned files
    const { value, error } = await this.getFileVersions(bucketName);
    if (error === "no versions" || error === "ListObjectVersions not implemented") {
      // if that fails remove non-versioned files
      const { value, error } = await this.getFiles(bucketName);
      if (error === "no contents") {
        return { value: null, error: "Could not remove files" };
      } else if (error !== null) {
        return { value: null, error };
      } else if (typeof value !== "undefined") {
        objects = value.map((value) => ({ Key: value.Key }));
      }
    } else if (error !== null) {
      return { value: null, error };
    } else if (typeof value !== "undefined") {
      objects = value.map((value) => ({
        Key: value.Key,
        VersionId: value.VersionId,
      }));
    }

    if (typeof objects !== "undefined") {
      try {
        const input = {
          Bucket: bucketName,
          Delete: {
            Objects: objects,
            Quiet: false,
          },
        };
        const command = new DeleteObjectsCommand(input);
        await this._client.send(command);
        return { value: "ok", error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    }

    return { value: "ok", error: null };
  }

  protected async _deleteBucket(bucketName: string): Promise<ResultObject> {
    try {
      await this.clearBucket(bucketName);
      const input = {
        Bucket: bucketName,
      };
      const command = new DeleteBucketCommand(input);
      const response = await this._client.send(command);
      // console.log(response);
      return { value: "ok", error: null };
    } catch (e) {
      // error message Cubbit
      if (e.message === "NoSuchBucket") {
        return { value: null, error: `The specified bucket does not exist: ${bucketName}` };
      }
      return { value: null, error: e.message };
    }
  }

  protected async _bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    try {
      const input = {
        Bucket: bucketName,
      };
      const command = new HeadBucketCommand(input);
      await this._client.send(command);
      return { value: true, error: null };
    } catch (e) {
      return { value: false, error: null };
    }
  }

  protected async _bucketIsPublic(bucketName: string): Promise<ResultObjectBoolean> {
    if (this._s3Type === S3Type.CLOUDFLARE) {
      return { value: null, error: "Cloudflare does not support checking if a bucket is public, please use the Cloudflare Control" };
    } else if (this._s3Type === S3Type.CUBBIT) {
      return { value: null, error: "Cloudflare does not support checking if a bucket is public, please use the Cubbit Control" };
    }

    try {
      // 1. Check bucket policy status
      const policyStatusResponse = await this._client.send(
        new GetBucketPolicyStatusCommand({ Bucket: bucketName })
      );
      const isPolicyPublic = policyStatusResponse.PolicyStatus?.IsPublic || false;

      // 2. Check public access block settings
      const pabResponse = await this._client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      const pabConfig = pabResponse.PublicAccessBlockConfiguration || {};
      const blocksPublicPolicy = pabConfig.BlockPublicPolicy ?? true; // default true if undefined

      // 3. Check bucket ACL for public grants
      const aclResponse = await this._client.send(new GetBucketAclCommand({ Bucket: bucketName }));
      const publicGrantUris = [
        "http://acs.amazonaws.com/groups/global/AllUsers",
        "http://acs.amazonaws.com/groups/global/AuthenticatedUsers",
      ];
      const hasPublicAcl = aclResponse.Grants.some((grant) =>
        grant.Grantee.URI && publicGrantUris.includes(grant.Grantee.URI) &&
        (grant.Permission === "READ" || grant.Permission === "WRITE")
      );

      // Bucket is effectively public if:
      // - Policy allows public
      // - BlockPublicPolicy is disabled (false)
      // - OR ACL grants public permissions
      const isBucketPublic = (isPolicyPublic && !blocksPublicPolicy) || hasPublicAcl;
      return { value: isBucketPublic, error: null };
    } catch (e) {
      if (e.name === "NoSuchPublicAccessBlockConfiguration") {
        // No Public Access Block means no restrictions by default, check policy and ACL anyway
        return { value: true, error: null }; // potential public, or run further checks
      }
      if (e.name === "NoSuchBucketPolicy") {
        // No bucket policy means no public policy, but could still have public ACL
        const aclResponse = await this._client.send(new GetBucketAclCommand({ Bucket: bucketName }));
        const publicGrantUris = [
          "http://acs.amazonaws.com/groups/global/AllUsers",
          "http://acs.amazonaws.com/groups/global/AuthenticatedUsers",
        ];
        const hasPublicAcl = aclResponse.Grants.some((grant) =>
          grant.Grantee.URI && publicGrantUris.includes(grant.Grantee.URI) &&
          (grant.Permission === "READ" || grant.Permission === "WRITE")
        );
        return { value: hasPublicAcl, error: null };
      }
      return { value: null, error: `bucketIsPublic: ${e.message}` };
    }
  }

  protected async _addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    try {
      let fileData: Readable | Buffer;
      if (typeof (params as FilePathParams).origPath !== "undefined") {
        const f = (params as FilePathParams).origPath;
        if (!fs.existsSync(f)) {
          return {
            value: null,
            error: `File with given path: ${f}, was not found`,
          };
        }
        fileData = fs.createReadStream(f);
      } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
        fileData = (params as FileBufferParams).buffer;
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        fileData = (params as FileStreamParams).stream;
      }

      if (typeof params.options.ACL === "string") {
        params.options.ACL = params.options.ACL as ObjectCannedACL;
      }

      const input = {
        Bucket: params.bucketName,
        Key: params.targetPath,
        Body: fileData,
        ...params.options,
      };
      const command = new PutObjectCommand(input);
      const response = await this._client.send(command);
      if (params.options.signedURL === true || params.options.useSignedURL === true) {
        return this._getSignedURL(params.bucketName, params.targetPath, params.options)
      }
      // return this._getPublicURL(params.bucketName, params.targetPath, params.options)
      return this._getFileAsURL(params.bucketName, params.targetPath, params.options)
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
    const { start, end } = options;
    let range = `bytes=${start}-${end}`;
    if (typeof start === "undefined" && typeof end === "undefined") {
      range = undefined;
    } else if (typeof start === "undefined") {
      range = `bytes=0-${end}`;
    } else if (typeof end === "undefined") {
      range = `bytes=${start}-`;
    }

    try {
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Range: range,
      };
      const command = new GetObjectCommand(params);
      const response = await this._client.send(command);
      return { value: response.Body as Readable, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _removeFile(
    bucketName: string,
    fileName: string,
    allVersions: boolean
  ): Promise<ResultObject> {
    try {
      const input = {
        Bucket: bucketName,
        Key: fileName,
      };
      const command = new DeleteObjectCommand(input);
      const response = await this._client.send(command);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  /**
   * @deprecated: use getPublicURL or getSignedURL
   */
  protected async _getFileAsURL(
    bucketName: string,
    fileName: string,
    options: Options // e.g. { expiresIn: 3600 }
  ): Promise<ResultObject> {
    try {
      let url = "";
      if (options.useSignedUrl === true || (this._s3Type !== S3Type.AWS && this._s3Type !== S3Type.CUBBIT)) {
        url = await getSignedUrl(
          this._client,
          new GetObjectCommand({
            Bucket: bucketName,
            Key: fileName,
          }),
          options
        );
      } else if (this._s3Type === S3Type.AWS) {
        url = `https://${bucketName}.s3.${this.config.region}.amazon.com/${fileName}`;
      } else if (this._s3Type === S3Type.CUBBIT) {
        url = `https://${bucketName}.s3.cubbit.eu/${fileName}`;
      }
      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    if (this._s3Type === S3Type.CLOUDFLARE) {
      return { value: null, error: "Please use the Cloudflare web console to get the public URL." };
    }

    if (this._s3Type === S3Type.AWS) {
      let response = { value: `https://${bucketName}.s3.${this.config.region}.amazonaws.com/${fileName}`, error: null };
      if (options.noCheck !== true) {
        const result = await this._bucketIsPublic(bucketName);
        if (result.error !== null) {
          response = { value: null, error: result.error };
        } else if (result.value === false) {
          response = { value: null, error: `Bucket "${bucketName}" is not public!` };
        }
      }
      return response;
    }

    if (this._s3Type === S3Type.CUBBIT) {
      if (options.noCheck === true) {
        return { value: `https://${bucketName}.s3.cubbit.eu/${fileName}`, error: null };
      }
      return { value: null, error: "Please use the Cubbit web console to get the public URL." };
    }

    if (this._s3Type === S3Type.BACKBLAZE) {
      if (options.noCheck === true) {
        return { value: `https://${bucketName}.s3.${this.config.region}.backblazeb2.com/${fileName}`, error: null };
      }
      return { value: null, error: "Please use the Backblaze web console to get the public URL." };
    }
  }

  protected async _getSignedURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      const url = await getSignedUrl(
        this._client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: fileName,
        }),
        options
      );
      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
    try {
      const { value, error } = await this.getFiles(bucketName, numFiles);
      if (error !== null) {
        return { value: null, error };
      }
      if (typeof value === "undefined") {
        return { value: [], error: null };
      }
      return { value: value.map((o) => [o.Key, o.Size]), error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    try {
      const input = {
        Bucket: bucketName,
        Key: fileName,
      };
      const command = new HeadObjectCommand(input);
      const response = await this._client.send(command);
      return { value: response.ContentLength, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  protected async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    try {
      const input = {
        Bucket: bucketName,
        Key: fileName,
      };
      const command = new HeadObjectCommand(input);
      await this._client.send(command);
      return { value: true, error: null };
    } catch (e) {
      return { value: false, error: null };
    }
  }

  // public

  public async getFileInfo(bucketName: string, fileName: string): Promise<ResultObject> {
    try {
      const input: GetObjectAttributesRequest = {
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
      const command = new GetObjectAttributesCommand(input);
      const response = await this._client.send(command);
      console.log(response);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  get config(): AdapterConfigAmazonS3 {
    return this._config as AdapterConfigAmazonS3;
  }

  getConfig(): AdapterConfigAmazonS3 {
    return this._config as AdapterConfigAmazonS3;
  }

  get serviceClient(): S3Client {
    return this._client as S3Client;
  }

  getServiceClient(): S3Client {
    return this._client as S3Client;
  }
}
