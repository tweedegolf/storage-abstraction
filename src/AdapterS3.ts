import { Readable } from "stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { Conditions } from "@aws-sdk/s3-presigned-post/dist-types/types";
import { S3Client, _Object, ListObjectsCommand, ObjectVersion, ListObjectVersionsCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommandInput, CreateBucketCommand, DeleteObjectsCommand, DeleteBucketCommand, ListBucketsCommand, PutObjectCommand, HeadObjectCommand, GetObjectAttributesCommand, GetObjectAttributesRequest, waitUntilBucketExists, PutBucketPolicyCommand, PutPublicAccessBlockCommand, GetBucketPolicyStatusCommand, GetPublicAccessBlockCommand, GetBucketAclCommand, PutBucketAclCommand, ObjectCannedACL, GetBucketPolicyCommand, } from "@aws-sdk/client-s3";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, Provider } from "./types/general";
import { FileBufferParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectObject, ResultObjectStream, } from "./types/result";
import { AdapterConfigAmazonS3 } from "./types/adapter_amazon_s3";
import { getErrorMessage, parseUrl } from "./util";

export class AdapterS3 extends AbstractAdapter {
  declare protected _provider: Provider;
  declare protected _config: AdapterConfigAmazonS3;
  declare protected _client: S3Client;
  protected _configError: null | string = null;

  constructor(config: string | AdapterConfigAmazonS3) {
    super(config);
    if (typeof config !== "string") {
      this._config = { ...config };
    } else {
      const { value, error } = parseUrl(config);
      if (value === null) {
        this._configError = `[configError] ${error}`;
      } else {
        const {
          protocol: provider,
          username: accessKeyId,
          password: secretAccessKey,
          host: bucketName,
          searchParams,
        } = value;
        if (searchParams !== null) {
          this._config = { provider, ...searchParams };
        } else {
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

    this._provider = this.config.provider as Provider;

    if (
      this._provider !== Provider.S3 &&
      this._provider !== Provider.AWS &&
      typeof this._config.endpoint === "undefined"
    ) {
      this._configError = `[configError] No endpoint specified for ${this._provider}`;
    }

    if (this._provider === Provider.MINIO_S3) {
      if (typeof this._config.region === "undefined") {
        this._config.region = "us-east-1";
      }
      // necessary for Minio S3 support!
      this._config.forcePathStyle = true;
      // this._config.s3ForcePathStyle = true;
      this._config.signatureVersion = "v4";
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
        console.log("Do we ever get here?");
        const o: { [id: string]: any } = { ...this.config }; // eslint-disable-line
        delete o.accessKeyId;
        delete o.secretAccessKey;
        this._client = new S3Client(o);
      }
    } catch (e: unknown) {
      this._configError = `[configError] ${getErrorMessage(e)}`;
    }

    if (typeof this.config.bucketName !== "undefined") {
      this._bucketName = this.config.bucketName;
    }
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
      return { value: typeof Contents === "undefined" ? [] : Contents, error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
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
      return { value: typeof Versions === "undefined" ? [] : Versions, error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  // protected methods, called by public methods of the API via AbstractAdapter

  protected async _listBuckets(): Promise<ResultObjectBuckets> {
    try {
      const input = {};
      const command = new ListBucketsCommand(input);
      const response = await this._client.send(command);
      let bucketNames: Array<string> = [];
      if (typeof response.Buckets !== "undefined") {
        const tmp: Array<undefined | string> = response.Buckets.map((b) => b.Name);
        bucketNames = tmp.filter((name) => typeof name !== "undefined");
      }
      return { value: bucketNames, error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
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
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
    }

    try {
      await waitUntilBucketExists(
        {
          client: this._client,
          maxWaitTime: 120,
        },
        { Bucket: bucketName }
      );
    } catch (e: unknown) {
      return { value: null, error: `waitUntilBucketExists: ${getErrorMessage(e)}` };
    }

    if (options.public === true) {
      try {
        if (this._provider === Provider.S3 || this._provider === Provider.AWS) {
          await this._client.send(
            new PutPublicAccessBlockCommand({
              Bucket: bucketName,
              PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,
                IgnorePublicAcls: false,
                BlockPublicPolicy: false, // DISABLE BlockPublicPolicy
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
                // Principal: "*",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
              },
            ],
          };
          await this._client.send(
            new PutBucketPolicyCommand({
              Bucket: bucketName,
              Policy: JSON.stringify(publicReadPolicy),
            })
          );
        } else if (this._provider === Provider.MINIO_S3) {
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
        } else if (this._provider === Provider.CUBBIT) {
          await this._client.send(
            new PutBucketAclCommand({
              Bucket: bucketName,
              ACL: "public-read", // or "public-read-write"
            })
          );
        } else if (
          this._provider === Provider.CLOUDFLARE ||
          this._provider === Provider.BACKBLAZE_S3
        ) {
          okMsg = `Bucket '${bucketName}' created successfully but you can only make this bucket public using the ${this._provider} web console`;
        }
      } catch (e: unknown) {
        return { value: null, error: `make bucket public: ${getErrorMessage(e)}` };
      }
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

    return { value: okMsg, error: null };
  }

  protected async _clearBucket(bucketName: string): Promise<ResultObject> {
    if (this._provider === Provider.BACKBLAZE_S3) {
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
    } else {
      let objects: Array<{ Key: undefined | string }> = [];
      const { value, error } = await this.getFiles(bucketName);
      if (error !== null) {
        return { value: null, error };
      } else if (value !== null && value.length > 0) {
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
          const command = new DeleteObjectsCommand(input);
          await this._client.send(command);
          // return { value: `${objects.length} files removed from '${bucketName}'`, error: null };
          return { value: "ok", error: null };
        } catch (e: unknown) {
          return { value: null, error: getErrorMessage(e) };
        }
      } else {
        // return { value: `No files removed; ${bucketName} contained no files`, error: null };
        return { value: "ok", error: null };
      }
    }
  }

  protected async _deleteBucket(bucketName: string): Promise<ResultObject> {
    try {
      const input = {
        Bucket: bucketName,
      };
      const command = new DeleteBucketCommand(input);
      const response = await this._client.send(command);
      // console.log(response);
      return { value: "ok", error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
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
    if (this._provider === Provider.CLOUDFLARE || this._provider === Provider.CUBBIT) {
      return {
        value: null,
        error: `${this._provider} does not support checking if a bucket is public, please use the ${this._provider} web console`,
      };
    }

    if (this._provider === Provider.BACKBLAZE_S3) {
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

    if (this._provider === Provider.MINIO_S3) {
      try {
        let isPublic = false;
        const policy = await this._client.send(new GetBucketPolicyCommand({ Bucket: bucketName }));
        if (typeof policy.Policy !== "undefined") {
          const p = JSON.parse(policy.Policy);
          // console.log('Bucket policy:', policy);
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

    try {
      // 1. Check bucket policy status
      const policyStatusResponse = await this._client.send(
        new GetBucketPolicyStatusCommand({ Bucket: bucketName })
      );
      // console.log("policyStatusResponse", policyStatusResponse);
      const isPolicyPublic = policyStatusResponse.PolicyStatus?.IsPublic || false;

      // 2. Check public access block settings
      const pabResponse = await this._client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      // console.log("pabResponse", pabResponse);
      const pabConfig = pabResponse.PublicAccessBlockConfiguration || {};
      const blocksPublicPolicy = pabConfig.BlockPublicPolicy ?? true; // default true if undefined

      // 3. Check bucket ACL for public grants
      const aclResponse = await this._client.send(new GetBucketAclCommand({ Bucket: bucketName }));
      // console.log("aclResponse", aclResponse);
      const publicGrantUris = [
        "http://acs.amazonaws.com/groups/global/AllUsers",
        "http://acs.amazonaws.com/groups/global/AuthenticatedUsers",
      ];
      let hasPublicAcl = aclResponse.Grants?.some(
        (grant) =>
          grant.Grantee?.URI &&
          publicGrantUris.includes(grant.Grantee.URI) &&
          (grant.Permission === "READ" || grant.Permission === "WRITE")
      );
      hasPublicAcl = typeof hasPublicAcl === "undefined" ? false : hasPublicAcl;

      // Bucket is effectively public if:
      // - Policy allows public
      // - BlockPublicPolicy is disabled (false)
      // - OR ACL grants public permissions
      const isBucketPublic = (isPolicyPublic && !blocksPublicPolicy) || hasPublicAcl;
      return { value: isBucketPublic, error: null };
    } catch (e: unknown) {
      if ((e as any).name === "NoSuchPublicAccessBlockConfiguration") {
        // No Public Access Block means no restrictions by default, check policy and ACL anyway
        return { value: true, error: null }; // potential public, or run further checks
      }
      if ((e as any).name === "NoSuchBucketPolicy") {
        // No bucket policy means no public policy, but could still have public ACL
        const aclResponse = await this._client.send(
          new GetBucketAclCommand({ Bucket: bucketName })
        );
        const publicGrantUris = [
          "http://acs.amazonaws.com/groups/global/AllUsers",
          "http://acs.amazonaws.com/groups/global/AuthenticatedUsers",
        ];
        const hasPublicAcl = aclResponse.Grants?.some(
          (grant) =>
            grant.Grantee?.URI &&
            publicGrantUris.includes(grant.Grantee.URI) &&
            (grant.Permission === "READ" || grant.Permission === "WRITE")
        );
        return { value: typeof hasPublicAcl === "undefined" ? false : hasPublicAcl, error: null };
      }
      return { value: null, error: `bucketIsPublic: ${getErrorMessage(e)}` };
    }
  }

  protected async _addFile(params: FileBufferParams | FileStreamParams): Promise<ResultObject> {
    try {
      let fileData: undefined | Readable | Buffer = undefined;
      if (typeof (params as FileBufferParams).buffer !== "undefined") {
        fileData = (params as FileBufferParams).buffer;
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        fileData = (params as FileStreamParams).stream;
      }

      if (typeof params.options?.ACL === "string") {
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
      return { value: "ok", error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
    const { start, end } = options;
    let range: undefined | string = `bytes=${start}-${end}`;
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
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    try {
      await this._client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: fileName,
        })
      );
      return { value: "ok", error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _removeFileVersions(bucketName: string, fileName: string): Promise<ResultObject> {
    let versions: Array<{ Key?: string; VersionId?: string }> = [];
    // first check if there are any versioned files
    const { value, error } = await this.getFileVersions(bucketName);
    if (error !== null) {
      return { value: null, error };
    } else if (value !== null) {
      versions = value.map((value) => ({ Key: value.Key }));
    }

    if (versions.length > 0) {
      try {
        for (const v of versions) {
          await this._client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: fileName,
              VersionId: v.VersionId,
            })
          );
        }
        return { value: "ok", error: null };
      } catch (e: unknown) {
        return { value: null, error: getErrorMessage(e) };
      }
    } else {
      try {
        await this._client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: fileName,
          })
        );
        return { value: "ok", error: null };
      } catch (e: unknown) {
        return { value: null, error: getErrorMessage(e) };
      }
    }
  }

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    if (this._provider === Provider.CLOUDFLARE) {
      return { value: null, error: "Please use the Cloudflare web console to get the public URL." };
    }

    if (this._provider === Provider.CUBBIT) {
      if (options.noCheck === true) {
        return { value: `https://${bucketName}.s3.cubbit.eu/${fileName}`, error: null };
      }
      return {
        value: null,
        error: `Cannot check if bucket ${bucketName} is public. Use the Cubbit web console to check this or pass {noCheck: true}`,
      };
    }

    let url = "";
    if (this._provider === Provider.S3 || this._provider === Provider.AWS) {
      url = `https://${bucketName}.s3.${this.config.region}.amazonaws.com/${fileName}`;
    } else if (this._provider === Provider.BACKBLAZE_S3) {
      url = `https://${bucketName}.s3.${this.config.region}.backblazeb2.com/${fileName}`;
    } else if (this._provider === Provider.MINIO_S3) {
      // let tmp = this._config.endpoint
      // url = `${tmp.substring(0, tmp.indexOf("://") + 3)}${bucketName}.${tmp.substring(tmp.indexOf("://") + 3)}/${fileName}`;
      url = `${this._config.endpoint}/${bucketName}/${fileName}`;
    }

    if (options.noCheck !== true) {
      const result = await this._bucketIsPublic(bucketName);
      if (result.error !== null) {
        return { value: null, error: result.error };
      }
      if (result.value === false) {
        return { value: null, error: `Bucket "${bucketName}" is not public!` };
      }
    }
    return { value: url, error: null };
  }

  protected async _getSignedURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      if (typeof options.expiresIn !== "number") {
        options.expiresIn = 604800; // one week: 7*24*60*60
      }
      // console.log(options.expiresIn);
      const url = await getSignedUrl(
        this._client,
        new GetObjectCommand({
          Bucket: bucketName,
          Key: fileName,
        }),
        options
      );
      return { value: url, error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
    try {
      const { value, error } = await this.getFiles(bucketName, numFiles);
      if (error !== null) {
        return { value: null, error };
      }
      if (value === null) {
        return { value: [], error: null };
      }
      const tmp: Array<null | [string, number]> = value.map((o) => {
        if (typeof o.Key === "undefined" || typeof o.Size === "undefined") {
          return null;
        }
        return [o.Key as string, o.Size as number];
      });
      return { value: tmp.filter((o) => o !== null), error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
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
      if (typeof response.ContentLength === "undefined") {
        return { value: null, error: `could not calculate filesize of ${fileName}` };
      }
      return { value: response.ContentLength, error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
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

  protected async _getPresignedUploadURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObjectObject> {
    let expiresIn = 300; // 5 * 60
    if (typeof options.expiresIn !== "undefined") {
      expiresIn = Number.parseInt(options.expiresIn, 10);
    }

    let conditions: Array<Conditions> = [
      ["starts-with", "$key", fileName],
      // ["content-length-range", 1, 25 * 1024 * 1024],
      // ["starts-with", "$Content-Type", ""], // or "image/" to restrict
      { "x-amz-server-side-encryption": "AES256" },
      // { "acl": "private" },                 // if using ACLs
      // ["starts-with", "$x-amz-meta-user", ""], // force certain metadata fields
    ];
    if (typeof options.conditions !== "undefined") {
      conditions = options.conditions as Array<Conditions>;
    }

    let fields = {
      "x-amz-server-side-encryption": "AES256",
      acl: "bucket-owner-full-control",
    };
    if (typeof options.fields !== "undefined") {
      fields = options.fields;
    }

    try {
      let data: any;
      console.log(this.provider);
      if (this.provider === Provider.S3 || this.provider === Provider.AWS) {
        data = await createPresignedPost(this._client, {
          Bucket: bucketName,
          Key: fileName,
          Expires: expiresIn,
          Conditions: conditions,
          Fields: fields,
        });
      } else {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          ACL: "public-read",
        });
        const url = await getSignedUrl(this._client, command, { expiresIn });
        data = { url };
      }
      return { value: data, error: null };
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
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
    } catch (e: unknown) {
      return { value: null, error: getErrorMessage(e) };
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
