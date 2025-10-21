import B2 from "backblaze-b2";
import { AbstractAdapter } from "./AbstractAdapter";
import { Options, StreamOptions, Provider } from "./types/general";
import { FileBufferParams, FileStreamParams } from "./types/add_file_params";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectObject, ResultObjectStream, } from "./types/result";
import { AdapterConfigBackblazeB2, BackblazeB2Bucket, BucketB2, FileB2, ResultObjectBucketB2, ResultObjectFileB2, ResultObjectFilesB2, } from "./types/adapter_backblaze_b2";
import { getErrorMessage, parseUrl } from "./util";

export class AdapterBackblazeB2 extends AbstractAdapter {
  protected _provider = Provider.B2;
  declare protected _config: AdapterConfigBackblazeB2;
  declare protected _client: B2;
  protected _configError: string | null = null;
  private authorized: boolean = false;
  private versioning: boolean = false;

  constructor(config: string | AdapterConfigBackblazeB2) {
    super(config);
    if (typeof config !== "string") {
      this._config = { ...config };
    } else {
      const { value, error } = parseUrl(config);
      if (value === null) {
        this._configError = `[configError] ${error}`;
      } else {
        const {
          protocol: type,
          username: applicationKeyId,
          password: applicationKey,
          host: bucketName,
          searchParams,
        } = value;
        if (applicationKey === null || applicationKeyId === null) {
          this._configError =
            'Please provide both a value for "applicationKey" and "applicationKeyId"';
          return;
        }

        if (searchParams !== null) {
          this._config = { type, applicationKeyId, applicationKey, ...searchParams };
        } else {
          this._config = { type, applicationKeyId, applicationKey };
        }
        if (bucketName !== null) {
          this._config.bucketName = bucketName;
        }
      }
      // console.log(this._config);
    }

    try {
      this._client = new B2(this._config);
    } catch (e) {
      this._configError = `[configError] ${getErrorMessage(e)}`;
    }

    if (typeof this.config.bucketName !== "undefined") {
      this._bucketName = this.config.bucketName;
    }
  }

  // util members

  private async authorize(): Promise<ResultObject> {
    if (this.authorized) {
      return { value: "ok", error: null };
    }

    try {
      const { data: _data } = await this._client.authorize();
      this.authorized = true;
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  private async getBucket(name: string): Promise<ResultObjectBucketB2> {
    try {
      const { data } = await this._client.getBucket({ bucketName: name });
      if (data.buckets.length > 0) {
        const { bucketId, bucketName } = data.buckets[0];
        return { value: { id: bucketId, name: bucketName }, error: null };
      }
      return { value: null, error: `Could not find bucket "${name}"` };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  private async getUploadUrl(bucketId: string): Promise<ResultObjectObject> {
    try {
      const { data } = await this._client.getUploadUrl({ bucketId });
      if (typeof data.uploadUrl === "undefined") {
        return { value: null, error: data.message };
      }
      return { value: data, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  private async getFiles(
    bucketName: string,
    versioning: boolean = this.versioning,
    numFiles = 1000
  ): Promise<ResultObjectFilesB2> {
    const { value: bucket, error } = await this.getBucket(bucketName);
    if (error !== null) {
      return { value: null, error };
    }
    if (bucket === null) {
      return { value: null, error: `can't find bucket '${bucketName}'` };
    }

    try {
      let data: {
        files: Array<{
          fileId: string;
          fileName: string;
          contentType: string;
          contentLength: number;
        }>;
      };
      // const options: ListFileVersionsOpts = {
      const options = {
        bucketId: bucket.id,
        maxFileCount: numFiles,
      };
      if (versioning) {
        ({ data } = await this._client.listFileVersions(options));
      } else {
        ({ data } = await this._client.listFileNames(options));
      }
      return {
        value: data.files.map(({ fileId, fileName, contentType, contentLength }) => {
          return {
            id: fileId,
            name: fileName,
            contentType,
            contentLength,
          };
        }),
        error: null,
      };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  private async getFile(bucketName: string, name: string): Promise<ResultObjectFileB2> {
    const { value: files, error } = await this.getFiles(bucketName, false);
    if (error !== null) {
      return { value: null, error };
    }
    if (files === null) {
      return { value: null, error: `Could not find file '${name}' in bucket '${bucketName}'.` };
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name === name) {
        return { value: file, error: null };
      }
    }
    return { value: null, error: `Could not find file '${name}' in bucket '${bucketName}'.` };
  }

  // protected, called by methods of public API via AbstractAdapter

  protected override async _listBuckets(): Promise<ResultObjectBuckets> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    try {
      const { data }: { data: { buckets: Array<{ bucketName: string }> } } =
        await this._client.listBuckets();
      const value = data.buckets.map(({ bucketName }) => bucketName);
      return { value, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected override async _createBucket(name: string, options: Options): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    let bucketType = "allPrivate";

    if (options.public === true) {
      options.bucketType = "allPublic";
    }

    if (typeof options.bucketType !== "undefined") {
      bucketType = options.bucketType;
    }

    if (bucketType !== "allPrivate" && bucketType !== "allPublic") {
      return {
        value: null,
        error: `Bucket type '${options.bucketType}' is not valid: must be either 'allPrivate' or 'allPublic'`,
      };
    }

    try {
      const { data } = await this._client.createBucket({
        ...options,
        bucketName: name,
        bucketType,
      });
      const { bucketType: _type } = data;
      // console.log(_type);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: (e as any).response.data.message };
    }
  }

  protected override async _addFile(params: FileBufferParams | FileStreamParams): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const { bucketName, targetPath } = params;
    const data1 = await this.getBucket(bucketName as string);
    if (data1.error !== null) {
      return { value: null, error: data1.error };
    }
    const { value: bucket } = data1;
    const { id: bucketId } = bucket as BucketB2;
    const data2 = await this.getUploadUrl(bucketId);
    if (data2.error !== null) {
      return { value: null, error: data2.error };
    }
    const {
      value: { uploadUrl, authorizationToken },
    } = data2 as any;

    let { options } = params;
    if (typeof options === "undefined") {
      options = {};
    }

    try {
      let buffer: undefined | Buffer;
      if (typeof (params as FileBufferParams).buffer !== "undefined") {
        buffer = (params as FileBufferParams).buffer;
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        const buffers: Array<any> = []; // eslint-disable-line
        for await (const data of (params as FileStreamParams).stream) {
          buffers.push(data);
        }
        buffer = Buffer.concat(buffers);
      }

      if (typeof buffer === "undefined") {
        return { value: null, error: "Could get file buffer" };
      }

      const { data: _data } = await this._client.uploadFile({
        uploadUrl,
        uploadAuthToken: authorizationToken,
        fileName: targetPath,
        data: buffer,
        ...options,
      });
      // console.log(_data);
      return { value: "ok", error: null };
    } catch (e) {
      // console.log(e.toJSON());
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected override async _getFileAsStream(
    bucketName: string,
    fileName: string,
    options: StreamOptions = { start: 0 }
  ): Promise<ResultObjectStream> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getFile(bucketName, fileName);
    if (data.error !== null) {
      return { value: null, error: data.error };
    }
    const { value: file } = data;

    if (file === null) {
      return { value: null, error: `Could not find file '${fileName}' in bucket '${bucketName}'.` };
    }

    const { start, end } = options;
    let range: undefined | string = `bytes=${start}-${end}`;
    if (typeof start === "undefined" && typeof end === "undefined") {
      range = undefined;
    } else if (typeof start === "undefined") {
      range = `bytes=0-${end}`;
    } else if (typeof end === "undefined") {
      range = `bytes=${start}-`;
    }

    delete options.start;
    delete options.end;

    try {
      const { data } = await this._client.downloadFileById({
        fileId: file.id,
        responseType: "stream",
        axios: {
          headers: {
            "Content-Type": file.contentType,
            Range: range,
          },
          ...options,
        },
      });
      return { value: data, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected override async _getPublicURL(
    bucketName: string,
    fileName: string,
    _options: Options
  ): Promise<ResultObject> {
    return {
      value: `${this._client.downloadUrl}/file/${bucketName}/${fileName}`,
      error: null,
    };
  }

  protected override async _getSignedURL(
    bucketName: string,
    fileName: string,
    options: Options
  ): Promise<ResultObject> {
    try {
      const data = await this.getBucket(bucketName);
      if (data.error !== null) {
        return { value: null, error: data.error };
      }
      const { value: bucket } = data;
      const { id: bucketId } = bucket as BucketB2;

      let expiresIn = 300; // 5 * 60
      if (typeof options.expiresIn !== "undefined") {
        expiresIn = Number.parseInt(options.expiresIn, 10);
      }

      const r = await this._client.getDownloadAuthorization({
        bucketId,
        fileNamePrefix: fileName,
        validDurationInSeconds: expiresIn,
      });
      const {
        data: { authorizationToken },
      } = r;

      return {
        value: `${this._client.downloadUrl}/file/${bucketName}/${fileName}?Authorization=${authorizationToken}`,
        error: null,
      };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected override async _removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getFiles(bucketName, true);
    if (data.value === null) {
      return { value: null, error };
    }

    const { value: files } = data;
    const index = files.findIndex(({ name }) => name === fileName);
    if (index === -1) {
      return { value: null, error: `No file '${fileName}' found in bucket '${bucketName}'` };
    }

    if (this.versioning) {
      // delete the file, if the file has more versions, delete the most recent version
      const file = files[index];
      try {
        await this._client.deleteFileVersion({
          fileId: file.id,
          fileName: file.name,
        });
        return { value: "ok", error: null };
      } catch (e) {
        return { value: null, error: getErrorMessage(e) };
      }
    } else {
      // delete all versions of the file
      try {
        await Promise.all(
          files
            .filter((f: FileB2) => f.name === fileName)
            .map(({ id: fileId, name: fileName }) => {
              // console.log(fileName, fileId);
              return this._client.deleteFileVersion({
                fileId,
                fileName,
              });
            })
        );
        return { value: "ok", error: null };
      } catch (e) {
        return { value: null, error: getErrorMessage(e) };
      }
    }
  }

  protected override async _clearBucket(name: string): Promise<ResultObject> {
    const { value, error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getFiles(name, true);
    if (data.value === null) {
      return { value: null, error: data.error };
    }
    const { value: files } = data;

    try {
      const _data = await Promise.all(
        files.map((file: FileB2) =>
          this._client.deleteFileVersion({
            fileId: file.id,
            fileName: file.name,
          })
        )
      );
      // console.log("[clearBucket]", _data);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected override async _deleteBucket(name: string): Promise<ResultObject> {
    const { error, value: bucket } = await this.getBucket(name);
    if (bucket === null) {
      return { value: null, error: error };
    }

    try {
      await this._client.deleteBucket({ bucketId: bucket.id });
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected override async _listFiles(bucketName: string, numFiles: number): Promise<ResultObjectFiles> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getFiles(bucketName, this.versioning, numFiles);
    if (data.value !== null) {
      const { value: files } = data;
      return {
        value: files.map((f) => {
          return [f.name, f.contentLength];
        }),
        error: null,
      };
    } else {
      return { value: null, error: data.error };
    }
  }

  protected override async _sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getFile(bucketName, fileName);
    if (data.value !== null) {
      const { value: file } = data;
      return { value: file.contentLength, error: null };
    } else {
      return { value: null, error: data.error };
    }
  }

  protected override async _bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getBucket(bucketName);
    if (data.error === null) {
      return { value: true, error: null };
    } else if (data.error.startsWith("Could not find bucket")) {
      return { value: false, error: null };
    } else {
      return { value: null, error: data.error };
    }
  }

  protected override async _bucketIsPublic(bucketName?: string): Promise<ResultObjectBoolean> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    try {
      const { data } = await this._client.listBuckets();
      const index = data.buckets.findIndex(
        (bucket: BackblazeB2Bucket) => bucket.bucketName === bucketName
      );
      if (index === -1) {
        return { value: null, error: `Could not find the bucket "${bucketName}"` };
      }
      const bucket: BackblazeB2Bucket = data.buckets[index];
      return { value: bucket.bucketType === "allPublic", error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  protected override async _fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    const { error, value } = await this._sizeOf(bucketName, fileName);
    if (error === null) {
      return { value: true, error: null };
    } else {
      return { value: false, error: null };
    }
  }

  protected override async _getPresignedUploadURL(
    bucketName: string,
    _fileName: string,
    _options: Options
  ): Promise<ResultObjectObject> {
    try {
      const data = await this.getBucket(bucketName);
      if (data.error !== null) {
        return { value: null, error: data.error };
      }
      const { value: bucket } = data;
      const { id: bucketId } = bucket as BucketB2;
      const {
        value: { uploadUrl, authorizationToken },
      } = (await this.getUploadUrl(bucketId)) as any;
      return { value: { url: uploadUrl, authToken: authorizationToken }, error: null };
    } catch (e) {
      return { value: null, error: getErrorMessage(e) };
    }
  }

  // public

  override get config(): AdapterConfigBackblazeB2 {
    return this._config as AdapterConfigBackblazeB2;
  }

  override getConfig(): AdapterConfigBackblazeB2 {
    return this._config as AdapterConfigBackblazeB2;
  }

  override get serviceClient(): B2 {
    return this._client as B2;
  }

  override getServiceClient(): B2 {
    return this._client as B2;
  }
}
