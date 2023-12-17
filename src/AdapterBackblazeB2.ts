import B2 from "backblaze-b2";
import fs from "fs";
import { AbstractAdapter } from "./AbstractAdapter";
import {
  StorageType,
  ResultObjectBoolean,
  ResultObject,
  ResultObjectStream,
  ResultObjectBucketsB2,
  ResultObjectFilesB2,
  ResultObjectBucketB2,
  ResultObjectFileB2,
  FileB2,
  FileBufferParams,
  FileStreamParams,
  FilePathParams,
  ResultObjectBuckets,
  ResultObjectFiles,
  ResultObjectNumber,
  BackblazeBucketOptions,
  Options,
  ResultObjectKeyValue,
  AdapterConfigB2,
} from "./types";
import { validateName } from "./util";

export class AdapterBackblazeB2 extends AbstractAdapter {
  protected _type = StorageType.B2;
  protected _config: AdapterConfigB2;
  protected _configError: string | null = null;
  protected _storage: B2 = null;
  private authorized: boolean = false;
  private versioning: boolean = true;

  constructor(config?: string | AdapterConfigB2) {
    super(config);
    if (this._configError === null) {
      if (
        typeof this._config.applicationKey === "undefined" ||
        typeof this._config.applicationKeyId === "undefined"
      ) {
        this._configError =
          'Please provide both a value for "applicationKey" and "applicationKeyId"';
      } else {
        try {
          this._storage = new B2(this._config);
        } catch (e) {
          this._configError = e.message;
        }
      }
    }
  }

  // util members

  private async authorize(): Promise<ResultObject> {
    if (this.configError !== null) {
      return { value: null, error: this.configError };
    }
    if (this.authorized) {
      return { value: "ok", error: null };
    }

    try {
      const { data: _data } = await this.storage.authorize();
      // console.log(_data.allowed.capabilities);
      this.authorized = true;
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  private async getBuckets(): Promise<ResultObjectBucketsB2> {
    try {
      const { data } = await this.storage.listBuckets();
      const value = data.buckets.map(({ bucketId, bucketName }) => {
        return {
          id: bucketId,
          name: bucketName,
        };
      });
      return { value, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  private async getBucket(name: string): Promise<ResultObjectBucketB2> {
    try {
      const { data } = await this.storage.getBucket({ bucketName: name });
      if (data.buckets.length > 0) {
        const { bucketId, bucketName } = data.buckets[0];
        return { value: { id: bucketId, name: bucketName }, error: null };
      }
      return { value: null, error: `Could not find bucket "${name}"` };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  private async getUploadUrl(bucketId: string): Promise<ResultObjectKeyValue> {
    try {
      const { data } = await this.storage.getUploadUrl(bucketId);
      if (typeof data.uploadUrl === "undefined") {
        return { value: null, error: data.message };
      }
      const { uploadUrl, authorizationToken: uploadAuthToken } = data;
      return { value: { uploadUrl, uploadAuthToken }, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  private async getFiles(
    bucketName: string,
    versioning: boolean,
    numFiles = 1000
  ): Promise<ResultObjectFilesB2> {
    const { value: bucket, error } = await this.getBucket(bucketName);
    if (error !== null) {
      return { error, value: null };
    }

    try {
      let data: any; //eslint-disable-line
      const options = {
        bucketId: bucket.id,
        maxFileCount: numFiles,
      };
      if (versioning) {
        ({ data } = await this.storage.listFileVersions(options));
      } else {
        ({ data } = await this.storage.listFileNames(options));
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
      return {
        value: null,
        error: e.message,
      };
    }
  }

  private async getFile(bucketName: string, name: string): Promise<ResultObjectFileB2> {
    const { value: files, error } = await this.getFiles(bucketName, false);
    if (error !== null) {
      return { error, value: null };
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name === name) {
        return { value: file, error: null };
      }
    }
    return { value: null, error: `Could not find file "${name}" in bucket "${bucketName}".` };
  }

  // public API

  get config(): AdapterConfigB2 {
    return this._config as AdapterConfigB2;
  }

  get storage(): B2 {
    return this._storage as B2;
  }

  public async addFile(
    params: FilePathParams | FileBufferParams | FileStreamParams
  ): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const { bucketName, targetPath } = params;
    const data1 = await this.getBucket(bucketName);
    if (data1.error !== null) {
      return { error: data1.error, value: null };
    }
    const {
      value: { id: bucketId },
    } = data1;

    const data2 = await this.getUploadUrl(bucketId);
    if (data2.error !== null) {
      return { error: data2.error, value: null };
    }
    const {
      value: { uploadUrl, uploadAuthToken },
    } = data2;

    let { options } = params;
    if (typeof options === "undefined") {
      options = {};
    }

    try {
      let buffer: Buffer;
      if (typeof (params as FilePathParams).origPath !== "undefined") {
        buffer = await fs.promises.readFile((params as FilePathParams).origPath);
      } else if (typeof (params as FileBufferParams).buffer !== "undefined") {
        buffer = (params as FileBufferParams).buffer;
      } else if (typeof (params as FileStreamParams).stream !== "undefined") {
        const buffers: Array<any> = []; // eslint-disable-line
        for await (const data of (params as FileStreamParams).stream) {
          buffers.push(data);
        }
        buffer = Buffer.concat(buffers);
      }

      const { data: _data } = await this.storage.uploadFile({
        uploadUrl,
        uploadAuthToken,
        fileName: targetPath,
        data: buffer,
      });
      // console.log(_data);
      return {
        error: null,
        value: `${this.storage.downloadUrl}/file/${bucketName}/${targetPath}`,
      };
    } catch (e) {
      // console.log(e.toJSON());
      return { value: null, error: e.message };
    }
  }

  public async getFileAsStream(
    bucketName: string,
    fileName: string,
    options: Options = { start: 0 }
  ): Promise<ResultObjectStream> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getFile(bucketName, fileName);
    if (data.error !== null) {
      return { error: data.error, value: null };
    }
    const { value: file } = data;
    const { start, end } = options;

    delete options.start;
    delete options.end;

    try {
      const { data } = await this.storage.downloadFileById({
        fileId: file.id,
        responseType: "stream",
        axios: {
          headers: {
            "Content-Type": file.contentType,
            Range: `bytes=${start}-${end}`,
          },
          ...options,
        },
      });
      return { value: data, error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async getFileAsURL(bucketName: string, fileName: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const url = `${this.storage.downloadUrl}/file/${bucketName}/${fileName}`;
    return { value: url, error: null };
  }

  public async removeFile(bucketName: string, fileName: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getFiles(bucketName, !this.versioning);
    if (error !== null) {
      return { value: null, error };
    }

    const { value: files } = data;
    const index = files.findIndex(({ name }) => name === fileName);
    if (index === -1) {
      return { value: null, error: `Could not find file "${fileName}"` };
    }

    if (this.versioning) {
      // delete the file, if the file has more versions, delete the most recent version
      const file = files[index];
      try {
        await this.storage.deleteFileVersion({
          fileId: file.id,
          fileName: file.name,
        });
        return { value: "ok", error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    } else {
      // delete all versions of the file
      try {
        await Promise.all(
          files
            .filter((f: FileB2) => f.name === fileName)
            .map(({ id: fileId, name: fileName }) => {
              console.log(fileName, fileId);
              return this.storage.deleteFileVersion({
                fileId,
                fileName,
              });
            })
        );
        return { value: "ok", error: null };
      } catch (e) {
        return { value: null, error: e.message };
      }
    }
  }

  public async createBucket(
    name: string,
    options: BackblazeBucketOptions = { bucketType: "allPrivate" }
  ): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const msg = validateName(name);
    if (msg !== null) {
      return { value: null, error: msg };
    }

    if (typeof options.bucketType === "undefined") {
      options.bucketType = "allPrivate";
    }

    try {
      const { data } = await this.storage.createBucket({
        ...options,
        bucketName: name,
      });
      const { bucketType: _type } = data;
      // console.log(_type);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.response.data.message };
    }
  }

  public async clearBucket(name: string): Promise<ResultObject> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getFiles(name, true);
    if (data.error !== null) {
      return { value: null, error: data.error };
    }
    const { value: files } = data;

    try {
      const _data = await Promise.all(
        files.map((file: FileB2) =>
          this.storage.deleteFileVersion({
            fileId: file.id,
            fileName: file.name,
          })
        )
      );
      // console.log("[clearBucket]", _data);
      return { value: "ok", error: null };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async deleteBucket(name: string): Promise<ResultObject> {
    const data = await this.clearBucket(name);
    if (data.error !== null) {
      return { error: data.error, value: null };
    }

    const { error, value: bucket } = await this.getBucket(name);
    if (error !== null) {
      return { error: error, value: null };
    }

    try {
      await this.storage.deleteBucket({ bucketId: bucket.id });
      return { error: null, value: "ok" };
    } catch (e) {
      return { value: null, error: e.message };
    }
  }

  public async listBuckets(): Promise<ResultObjectBuckets> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getBuckets();
    if (data.error === null) {
      const { value: buckets } = data;
      return {
        error: null,
        value: buckets.map((b) => {
          return b.name;
        }),
      };
    } else {
      return { value: null, error: data.error };
    }
  }

  public async listFiles(bucketName: string, numFiles: number = 1000): Promise<ResultObjectFiles> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { value: null, error };
    }

    const data = await this.getFiles(bucketName, this.versioning, numFiles);
    if (data.error === null) {
      const { value: files } = data;
      return {
        error: null,
        value: files.map((f) => {
          return [f.name, f.contentLength];
        }),
      };
    } else {
      return { value: null, error: data.error };
    }
  }

  public async sizeOf(bucketName: string, fileName: string): Promise<ResultObjectNumber> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
    }

    const data = await this.getFile(bucketName, fileName);
    if (data.error === null) {
      const { value: file } = data;
      return { error: null, value: file.contentLength };
    } else {
      return { error: data.error, value: null };
    }
  }

  async bucketExists(bucketName: string): Promise<ResultObjectBoolean> {
    const { error } = await this.authorize();
    if (error !== null) {
      return { error, value: null };
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

  async fileExists(bucketName: string, fileName: string): Promise<ResultObjectBoolean> {
    const { error, value } = await this.sizeOf(bucketName, fileName);
    if (error === null) {
      return { error: null, value: true };
    } else {
      return { error: null, value: false };
    }
  }
}
