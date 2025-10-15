import { Readable } from "stream";
import {
  AnonymousCredential,
  BlobGenerateSasUrlOptions,
  BlobSASPermissions,
  BlobServiceClient,
  ContainerSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, Provider } from "./types/general";
import { FileBufferParams, FileStreamParams } from "./types/add_file_params";
import {
  ResultObject,
  ResultObjectBoolean,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  ResultObjectObject,
  ResultObjectStream,
} from "./types/result";
import { AdapterConfigAzureBlob } from "./types/adapter_azure_blob";
import { getErrorMessage, parseUrl } from "./util";

export class AdapterAzureBlob extends AbstractAdapter {
  protected _provider = Provider.AZURE;
  declare protected _config: AdapterConfigAzureBlob;
  declare protected _client: BlobServiceClient;
  declare private sharedKeyCredential: StorageSharedKeyCredential;
  protected _configError: string | null = null;

  constructor(config: string | AdapterConfigAzureBlob) {
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
          username: accountName,
          password: accountKey,
          host: bucketName,
          searchParams,
        } = value;
        if (searchParams !== null) {
          this._config = { provider, ...searchParams };
        } else {
          this._config = { provider };
        }
        if (accountName !== null) {
          this._config.accountName = accountName;
        }
        if (accountKey !== null) {
          this._config.accountKey = accountKey;
        }
        if (bucketName !== null) {
          this._config.bucketName = bucketName;
        }
      }
    }

    if (!this.config.accountName && !this.config.connectionString) {
      this._configError =
        '[configError] Please provide at least a value for "accountName" or for "connectionString';
      return;
    }
    if (typeof this.config.accountKey !== "undefined") {
      // option 1: accountName + accountKey
      try {
        this.sharedKeyCredential = new StorageSharedKeyCredential(
          this.config.accountName as string,
          this.config.accountKey as string
        );
      } catch (e: unknown) {
        this._configError = `[configError] ${JSON.parse((e as any).code)}`;
      }
      try {
        this._client = new BlobServiceClient(
          this.getBlobEndpoint(),
          this.sharedKeyCredential,
          this.config.options as object
        );
      } catch (e: unknown) {
        this._configError = `[configError] ${getErrorMessage(e)}`;
      }
    } else if (typeof this.config.sasToken !== "undefined") {
      // option 2: accountName + sasToken
      try {
        this._client = new BlobServiceClient(
          `${this.getBlobEndpoint()}?${this.config.sasToken}`,
          new AnonymousCredential(),
          this.config.options as object
        );
      } catch (e: unknown) {
        this._configError = `[configError] ${getErrorMessage(e)}`;
      }
    } else if (typeof this.config.connectionString !== "undefined") {
      // option 3: connection string
      try {
        this._client = BlobServiceClient.fromConnectionString(this.config.connectionString);
      } catch (e) {
        this._configError = `[configError] ${getErrorMessage(e)}`;
      }
    } else {
      // option 4: passwordless / Microsoft Entra
      // see: https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/local-development-environment-developer-account?tabs=azure-portal%2Csign-in-azure-powershell
      try {
        this._client = new BlobServiceClient(
          this.getBlobEndpoint(),
          new DefaultAzureCredential(),
          this.config.options as object
        );
      } catch (e) {
        this._configError = `[configError] ${getErrorMessage(e)}`;
      }
    }
    if (typeof this.config.bucketName !== "undefined") {
      this._bucketName = this.config.bucketName;
    }
  }

  private getBlobEndpoint(): string {
    let endpoint = "";
    let protocol = "";
    if (typeof this.config.blobDomain !== "undefined") {
      let blobDomain = this.config.blobDomain;
      if (blobDomain.indexOf("http") === 0) {
        protocol = blobDomain.substring(0, blobDomain.indexOf("://") + 3);
      }
      blobDomain = blobDomain.replace(/^(https?:\/\/)/i, "");
      // for local testing with Azurite
      if (blobDomain.indexOf("127.0.0.1") === 0 || blobDomain.indexOf("localhost") === 0) {
        endpoint = `${protocol === "" ? "http://" : protocol}${blobDomain}/${this.config.accountName}`;
      } else {
        endpoint = `${protocol === "" ? "https://" : protocol}${this.config.accountName}.${blobDomain}`;
      }
    } else {
      endpoint = `https://${this.config.accountName}.blob.core.windows.net`;
    }
    // console.log(endpoint);
    return endpoint;
  }

  // protected, called by methods of public API via AbstractAdapter

  protected async _listBuckets(): Promise<ResultObjectBuckets> {
    // let i = 0;
    try {
      const bucketNames = [];
      // let i = 0;
      for await (const container of this._client.listContainers()) {
        // console.log(`${i++} ${container.name}`);
        bucketNames.push(container.name);
      }
      return { value: bucketNames, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _createBucket(name: string, options: Options): Promise<ResultObject> {
    try {
      if (options.public === true && typeof options.access === "undefined") {
        options.access = "blob";
      }
      const res = await this._client.createContainer(name, options);
      // const containerClient = this._client.getContainerClient(name);
      // await containerClient.create();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions
  ): Promise<ResultObjectStream> {
    try {
      const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
      const { start, end } = options;
      let offset: number;
      let count: undefined | number;
      if (typeof start !== "undefined") {
        offset = start;
      } else {
        offset = 0;
      }
      if (typeof end !== "undefined") {
        count = end - offset + 1;
      }
      delete options.start;
      delete options.end;
      // console.log(offset, count, options);

      try {
        const stream = await file.download(offset, count, options as object);
        return { value: stream.readableStreamBody as Readable, error: null };
      } catch (e) {
        return { value: null, error: getErrorMessage(e) };
      }
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getPublicURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      if (options.noCheck !== true) {
        const result = await this._bucketIsPublic(bucketName);
        if (result.error !== null) {
          return { value: null, error: result.error };
        } else if (result.value === false) {
          return { value: null, error: `Bucket "${bucketName}" is not public!` };
        }
      }
      const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
      return { value: file.url, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getSignedURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      const file = this._client.getContainerClient(bucketName).getBlobClient(fileName);
      const exp = new Date();
      if (typeof options.expiresIn !== "number") {
        exp.setUTCDate(exp.getUTCDate() + 7);
      } else {
        exp.setSeconds(exp.getSeconds() + options.expiresIn);
      }
      // console.log(exp)
      const sasOptions: BlobGenerateSasUrlOptions = {
        permissions: options.permissions || BlobSASPermissions.parse("r"),
        expiresOn: exp,
      };
      const url = await file.generateSasUrl(sasOptions);
      return { value: url, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _clearBucket(name: string): Promise<ResultObject> {
    try {
      // const containerClient = this._client.getContainerClient(name);
      // const blobs = containerClient.listBlobsFlat();
      // for await (const blob of blobs) {
      //   console.log(blob.name);
      //   await containerClient.deleteBlob(blob.name);
      // }
      const containerClient = this._client.getContainerClient(name);
      const blobs = containerClient.listBlobsByHierarchy("/");
      for await (const blob of blobs) {
        if (blob.kind === "prefix") {
          // console.log("prefix", blob);
        } else {
          await containerClient.deleteBlob(blob.name);
        }
      }
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _deleteBucket(name: string): Promise<ResultObject> {
    try {
      const del = await this._client.deleteContainer(name);
      //console.log('deleting container: ', del);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
    try {
      let name = bucketName;
      let prefix = "";
      if (bucketName.indexOf("/") !== -1) {
        [name, prefix] = bucketName.split("/");
      }
      const listOptions = {
        includeMetadata: false,
        includeSnapshots: false,
        prefix, // Filter results by blob name prefix
      };
      const files: [string, number][] = [];
      const data = this._client.getContainerClient(name).listBlobsFlat(listOptions);
      for await (const blob of data) {
        if (typeof blob.properties.contentLength !== "undefined") {
          files.push([blob.name, blob.properties.contentLength]);
        }
      }
      return { value: files, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _addFile(params: FileBufferParams | FileStreamParams): Promise<ResultObject> {
    try {
      let readStream: undefined | Readable;
      if (typeof (params as FileBufferParams).buffer !== "undefined") {
        readStream = new Readable();
        readStream._read = (): void => { }; // _read is required but you can noop it
        readStream.push((params as FileBufferParams).buffer);
        readStream.push(null);
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        readStream = (params as FileStreamParams).stream;
      }
      if (typeof readStream === "undefined") {
        return { value: null, error: `could not read local file, buffer or stream` };
      }
      const file = this._client
        .getContainerClient(params.bucketName as string)
        .getBlobClient(params.targetPath)
        .getBlockBlobClient();
      const writeStream = await file.uploadStream(readStream, 64000, 20, params.options);
      if (writeStream.errorCode) {
        return { value: null, error: writeStream.errorCode };
      } else {
        return { value: "ok", error: null };
      }
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    try {
      const container = this._client.getContainerClient(bucketName);
      const file = await container.getBlobClient(fileName).deleteIfExists();
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    try {
      const blob = this._client.getContainerClient(bucketName).getBlobClient(fileName);
      const length = (await blob.getProperties()).contentLength;
      if (typeof length === "undefined") {
        return { value: null, error: `could not calculate filesize of ${fileName}` };
      }
      return { value: length, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _bucketIsPublic(bucketName: string): Promise<ResultObjectBoolean> {
    try {
      const containerClient = this._client.getContainerClient(bucketName);
      const response = await containerClient.getAccessPolicy();
      const accessLevel = response.blobPublicAccess; // "container", "blob", or undefined/null ("none")
      const value = accessLevel === "container" || accessLevel === "blob";
      return { value, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _bucketExists(name: string): Promise<ResultObjectBoolean> {
    try {
      const cont = this._client.getContainerClient(name);
      const exists = await cont.exists();
      return { value: exists, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    try {
      const exists = await this._client
        .getContainerClient(bucketName)
        .getBlobClient(fileName)
        .exists();
      return { value: exists, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected async _getPresignedUploadURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObjectObject> {
    try {
      let starts = new Date();
      let offset = 1 * -60;
      if (typeof options.startsAt !== "undefined") {
        offset = Number.parseInt(options.startsAt, 10);
      }
      starts.setSeconds(starts.getSeconds() + offset);

      let expires = new Date();
      offset = 5 * 60;
      if (typeof options.expiresIn !== "undefined") {
        offset = Number.parseInt(options.expiresIn, 10);
      }
      expires.setSeconds(expires.getSeconds() + offset);

      let permissions = { add: true, create: true, write: true };
      if (typeof options.permissions !== "undefined") {
        permissions = options.permissions;
      }

      const blockBlobClient = this._client
        .getContainerClient(bucketName)
        .getBlockBlobClient(fileName);
      const url = await blockBlobClient.generateSasUrl({
        permissions: BlobSASPermissions.from(permissions),
        expiresOn: expires,
        startsOn: starts,
      });
      return { value: { url }, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }

    /*
    // Set the permissions for the SAS token
    const permissions = new ContainerSASPermissions();
    permissions.write = true; // Allow write access

    // Set the expiry time for the SAS token
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 30); // Token valid for 30 minutes

    // Generate the SAS token
    const sasToken = generateBlobSASQueryParameters({
      containerName: bucketName,
      blobName: fileName,
      permissions: permissions,
      startsOn: new Date(Date.now() - 1 * 60 * 1000),
      expiresOn: expiryDate
    }, new StorageSharedKeyCredential(this.config.accountName, this.config.accountKey)).toString();

    console.log(this.config.accountName, this.config.accountKey, sasToken);
    // Construct the presigned URL
    const url = `${this._client.getContainerClient(bucketName).getBlobClient(fileName).url}?${sasToken}`;
    return { value: { url }, error: null };
    */
    // /*
  }

  // public

  get config(): AdapterConfigAzureBlob {
    return this._config as AdapterConfigAzureBlob;
  }

  getConfig(): AdapterConfigAzureBlob {
    return this._config as AdapterConfigAzureBlob;
  }

  get serviceClient(): BlobServiceClient {
    return this._client as BlobServiceClient;
  }

  getServiceClient(): BlobServiceClient {
    return this._client as BlobServiceClient;
  }
}
function generateContainerSASQueryParameters(
  arg0: {
    containerName: any;
    permissions: ContainerSASPermissions;
    startsOn: Date;
    expiresOn: Date;
    protocol: any;
  },
  credential: any
) {
  throw new Error("Function not implemented.");
}
