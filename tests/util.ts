import fs from "fs";
import crypto from "crypto";
import { Readable, Stream, Writable } from "stream";
import { ResultObject, ResultObjectBoolean, ResultObjectBuckets, ResultObjectFiles, ResultObjectNumber, ResultObjectObject, ResultObjectStream } from "../src/types/result";
import { Options, StorageType } from "../src/types/general";

/**
 * Utility function that connects a read-stream (from the storage) to a write-stream (to a local file)
 */
export const saveFile = (
  readStream: Readable,
  writeStream: Writable,
  log: boolean = false
): Promise<void> => {
  return new Promise((resolve, reject) => {
    readStream
      .pipe(writeStream)
      .on("error", (e) => {
        console.error("\x1b[31m", e, "\n");
        reject();
      })
      .on("finish", () => {
        if (log) {
          console.log("read finished");
        }
      });
    writeStream
      .on("error", (e) => {
        console.error("\x1b[31m", e, "\n");
        reject();
      })
      .on("finish", () => {
        if (log) {
          console.log("write finished");
        }
        resolve();
      });
  });
};

export function streamToString(stream: Readable) {
  const chunks: Array<Uint8Array> = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

export async function timeout(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve();
    }, millis);
  });
}

// credits: https://stackoverflow.com/questions/14269233/node-js-how-to-read-a-stream-into-a-buffer
export async function stream2buffer(stream: Stream): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const _buf = Array<any>(); // eslint-disable-line

    stream.on("data", (chunk) => _buf.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(_buf)));
    stream.on("error", (err) => reject(`error converting stream - ${err}`));
  });
}

export enum Color {
  MESSAGE = "96m",
  ERROR = "91m",
  TEST = "35m",
  OK = "32m",
}

export function colorLog(label: string, color: Color, ...msg: any[]): void {
  console.log(`\x1b[${color}[${label}]\x1b[0m`, ...msg);
}

export type ResultObjectType =
  ResultObject |
  ResultObjectBoolean |
  ResultObjectNumber |
  ResultObjectStream |
  ResultObjectBuckets |
  ResultObjectObject |
  ResultObjectFiles;

export function logResult(label: string, result: ResultObjectType, msg?: string, options?: Options): void {
  if (result.error !== null) {
    console.log(`\x1b[91m[${label}]\x1b[0m ${result.error}`, msg || "");
  } else {
    console.log(`\x1b[96m[${label}]\x1b[0m`, msg || result.value, options || "");
  }
}

export const getSha1ForFile = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      const sha1sum = hash.digest('hex');
      resolve(sha1sum);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

export const privateBucket = "sab-test-private";
export const publicBucket = "sab-test-public";

export function getPrivateBucketName(type: string) {
  // Azure needs more time to delete a bucket
  if (type === StorageType.AZURE) {
    return `${privateBucket}-${Date.now()}`
  }
  return privateBucket;
}

export function getPublicBucketName(type: string) {
  // Azure needs more time to delete a bucket
  if (type === StorageType.AZURE) {
    return `${publicBucket}-${Date.now()}`
  }
  return publicBucket;
}
