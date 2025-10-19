import { Readable } from "stream";
import { Options } from "./general";
/**
 * @param bucketName name of the bucket you want to use
 * @param origPath path of the file to be copied
 * @param targetPath path to copy the file to, folders will be created automatically
 * @param options additional option such as access rights
 **/
export type FilePathParams = {
    bucketName?: string;
    origPath: string;
    targetPath: string;
    options?: Options;
};
/**
 * @param bucketName name of the bucket you want to use
 * @param buffer file as buffer
 * @param targetPath path to the file to save the buffer to, folders will be created automatically
 * @param options additional option such as access rights
 **/
export type FileBufferParams = {
    bucketName?: string;
    buffer: Buffer;
    targetPath: string;
    options?: Options;
};
/**
 * @param bucketName name of the bucket you want to use
 * @param stream a read stream
 * @param targetPath path to the file to save the stream to, folders will be created automatically
 * @param options additional option such as access rights
 **/
export type FileStreamParams = {
    bucketName?: string;
    stream: Readable;
    targetPath: string;
    options?: Options;
};
