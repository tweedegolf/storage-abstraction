import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import { Storage } from "../src/Storage";
import { IAdapter, Options, S3Type, StorageType } from "../src/types/general";
import { getConfig } from "./config";
import { Color, colorLog, logResult, saveFile } from "./util";
import { fileTypeFromBuffer } from 'file-type';
import { ResultObject } from "../src/types/result";
import FormData from 'form-data';
import dotenv from "dotenv";

let type: string;
let storage: Storage;

export const privateBucket = "sab-test-private";
export const publicBucket = "sab-test-public";

dotenv.config();

export type TestFile = {
    name: string,
    path: string,
    size: number,
    ext: string,
};
const testFileNames = ["image1.jpg", "image2.jpg", "input.txt", "with space.jpg"];
const testFiles: { [id: string]: TestFile } = {};

export async function getTestFile(name: string, ...pathToFile: string[]): Promise<TestFile> {
    if (typeof testFiles[name] !== "undefined") {
        return testFiles[name];
    }
    const p = path.join(...pathToFile, name);
    const stats = await fs.promises.stat(p);
    testFiles[name] = {
        name,
        path: p,
        size: stats.size,
        ext: path.extname(p),
    }
    return testFiles[name];
}

export async function init(_type: string, bucketName?: string): Promise<string> {
    colorLog("init", Color.TEST);
    await cleanup();
    type = _type;
    storage = new Storage(getConfig(type));
    bucketName = storage.config.bucketName || bucketName || privateBucket;
    colorLog("init::type", Color.MESSAGE, storage.getType());
    colorLog("init::config", Color.MESSAGE, storage.getConfig());
    // colorLog("init::serviceClient", Color.MESSAGE, storage.getServiceClient());
    colorLog("init::selectedBucket", Color.MESSAGE, storage.getSelectedBucket());

    await fs.promises.stat(path.join(process.cwd(), "tests", "test_directory")).catch(async (e) => {
        await fs.promises.mkdir(path.join(process.cwd(), "tests", "test_directory"));
    });

    const r = await storage.listBuckets();
    // logResult("listBuckets", r);
    if (r.error !== null) {
        process.exit(1);
    }

    /**
     * Don't delete buckets at Minio, Backblaze S3 and Cubbit
     * - Minio: because there exist a zillion buckets in the public test environment
     * - Backblaze S3 and Cubbit: because you can only make a bucket public using the web console
    */
    const buckets = r.value;
    if (type !== StorageType.MINIO && type !== S3Type.CLOUDFLARE && type !== S3Type.BACKBLAZE) {
        if (buckets !== null && buckets.length > 0) {
            const r = await deleteAllBuckets(buckets, storage);
            if (r.error !== null) {
                process.exit(1);
            }
        }
    } else {
        // only delete the private bucket
        const r = await storage.bucketExists(privateBucket);
        if (r.value === true) {
            const r2 = await storage.deleteBucket(privateBucket);
            logResult("init::deleteBucket", r2);
            if (r2.error !== null) {
                process.exit(1);
            }
        }
    }

    // if (type === StorageType.AZURE) {
    //     await waitABit(10000);
    // }
    return Promise.resolve(bucketName);
}

export async function deleteAllBuckets(list: Array<string>, storage: IAdapter, delay: number = 500): Promise<ResultObject> {
    colorLog("init::deleteAllBuckets", Color.MESSAGE, list);
    for (let i = 0; i < list.length; i++) {
        const b = list[i];
        /*
        // It is not possible to delete the snapshots bucket on Backblaze!
        if (type === StorageType.B2 && b.indexOf("b2-snapshots") !== -1) {
            continue;
            }
            const r = await storage.deleteBucket(b);
            logResult("init::deleteBucket", r, b);
            if (r.error) {
                return { value: null, error: r.error };
            }
        */
        const r = await storage.deleteBucket(b);
        if (type === StorageType.B2 && b.indexOf("b2-snapshots") !== -1) {
            colorLog("init::deleteBucket", Color.OK, "Can't delete the snapshots bucket on B2, but that's okay!");
        } else {
            logResult("init::deleteBucket", r, b);
            if (r.error) {
                return { value: null, error: r.error };
            }
        }
    }
    return { value: "ok", error: null };
}

export async function cleanup() {
    const p = path.normalize(path.join(process.cwd(), "tests", "test_directory"));
    await rimraf(p, {
        preserveRoot: false,
    });
}

export async function waitABit(millis = 100): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            colorLog("waitABit", Color.MESSAGE, `${millis}ms`);
            resolve();
        }, millis);
    });
}

export async function listBuckets(): Promise<Array<string> | null> {
    const r = await storage.listBuckets();
    logResult("listBuckets", r);
    return r.value;
}

export async function bucketExists(bucketName?: string) {
    const r = await storage.bucketExists(bucketName);
    logResult("bucketExists", r);
}

export async function bucketIsPublic(bucketName?: string) {
    const r = await storage.bucketIsPublic(bucketName);
    logResult("bucketIsPublic", r);
}

export async function createBucket(bucketName?: string, options?: Options) {
    const r = await storage.createBucket(bucketName, options);
    logResult("createBucket", r, r.value as string, options);
}

export function getSelectedBucket(): string | null {
    const r = storage.getSelectedBucket();
    if (r === null) {
        colorLog("getSelectedBucket", Color.MESSAGE, "no bucket selected");
    } else {
        colorLog("getSelectedBucket", Color.MESSAGE, r);
    }
    return r;
}

export function setSelectedBucket(b: string | null) {
    const r = storage.setSelectedBucket(b);
    if (b === null) {
        colorLog("setSelectedBucket", Color.MESSAGE, "no bucket selected");
    } else {
        colorLog("setSelectedBucket", Color.MESSAGE, b);
    }
}

export async function clearBucket(bucketName?: string) {
    const r = await storage.clearBucket(bucketName);
    logResult("clearBucket", r);
}

export async function deleteBucket(bucketName?: string) {
    const r = await storage.deleteBucket(bucketName);
    logResult("deleteBucket", r, bucketName);
}

export async function listFiles(...args:
    [bucketName: string, numFiles?: number] |
    [numFiles?: number]) {
    const [arg1, arg2] = args;
    const r = typeof arg1 !== "string" ? await storage.listFiles(arg2) : await storage.listFiles(arg1, arg2);
    logResult("listFiles", r);
}

export async function addFileFromPath(origPath: string, targetPath: string, options: Options, bucketName?: string) {
    const r = await storage.addFileFromPath({
        bucketName,
        origPath,
        targetPath,
        options,
        // options: {GrantRead: "true"}
        // options: { useSignedUrl: "false" }
    });
    logResult("addFileFromPath", r), options;
}

export async function addFileFromBuffer(origPath: string, targetPath: string, options: Options, bucketName?: string) {
    const buffer = await fs.promises.readFile(origPath);
    const r = await storage.addFileFromBuffer({
        bucketName,
        buffer,
        targetPath,
        options,
        // options: {
        //   ACL: "public-read"
        // }
    });
    logResult("addFileFromBuffer", r), options;
}

export async function addFileFromStream(origPath: string, targetPath: string, options: Options, bucketName?: string) {
    const stream = fs.createReadStream(origPath);
    const r = await storage.addFileFromStream({
        bucketName,
        stream,
        targetPath,
        options,
    });
    logResult("addFileFromStream", r), options;
}

export async function getFileAsStream(fileName: string, destName: string, options?: Options, bucketName?: string) {
    const r = typeof bucketName === "undefined" ?
        await storage.getFileAsStream(fileName, options) :
        await storage.getFileAsStream(bucketName, fileName, options);
    logResult("getFileAsStream", r, "ok");
    if (r.value !== null) {
        const filePath = path.join(
            process.cwd(),
            "tests",
            "test_directory",
            destName
        );
        const writeStream = fs.createWriteStream(filePath);
        await saveFile(r.value, writeStream);
    }
}

export async function fileExists(fileName: string, bucketName?: string) {
    await storage.getAdapter().fileExists(fileName);
    const r = typeof bucketName === "undefined" ? await storage.fileExists(fileName) : await storage.fileExists(bucketName, fileName);
    logResult("fileExists", r);
}

export async function sizeOf(fileName: string, bucketName?: string) {
    const r = typeof bucketName === "undefined" ? await storage.sizeOf(fileName) : await storage.sizeOf(bucketName, fileName);
    logResult("sizeOf", r);
}

export async function removeFile(fileName: string, bucketName?: string) {
    const r = typeof bucketName === "undefined" ? await storage.removeFile(fileName) : await storage.removeFile(bucketName, fileName);
    logResult("removeFile", r);
}

export async function getPublicURL(fileName: string, options: Options = {}, bucketName?: string) {
    const r = typeof bucketName === "undefined" ?
        await storage.getPublicURL(fileName, options) :
        await storage.getPublicURL(bucketName, fileName, options);
    logResult("getPublicURL", r), options;
    if (r.value !== null && type !== StorageType.LOCAL) {
        const response = await fetch(r.value);
        if (!response.ok) {
            colorLog("checkPublicURL", Color.ERROR, `HTTP status: ${response.status}`, options);
        } else {
            colorLog("checkPublicURL", Color.OK, "public url is valid!", options);
        }
    }
}

export async function getSignedURL(fileName: string, dest: string, options: Options, bucketName?: string) {
    const r = typeof bucketName === "undefined" ?
        await storage.getSignedURL(fileName, options) :
        await storage.getSignedURL(bucketName, fileName, options);
    logResult("getSignedURL", r), options;

    if (type !== StorageType.LOCAL) {
        if (r.value !== null) {
            if (options.waitUntilExpired === true) {
                await waitABit((options.expiresIn * 1000) + 700); // milliseconds
            }
            const response = await fetch(r.value);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileType = await fileTypeFromBuffer(buffer);
            if (!response.ok) {
                colorLog("checkSignedURL", Color.ERROR, `HTTP status: ${response.status}`, options);
            } else {
                if (fileType?.ext !== "jpg") {
                    colorLog("checkSignedURL", Color.ERROR, "not an image, probably an error message", options);
                } else {
                    colorLog("checkSignedURL", Color.OK, "signed url is valid!", options);
                }
            }
            const outputFile = `${dest}.${fileType?.ext}`;
            const filePath = path.join(
                process.cwd(),
                "tests",
                "test_directory",
                outputFile
            );
            fs.createWriteStream(filePath).write(buffer);
        }
    }
}

export async function getFileSize(p: string): Promise<number> {
    const stats = await fs.promises.stat(p);
    return stats.size;
}

export async function getPresignedUploadURL(fileName: string, options: Options = {}, bucketName?: string): Promise<void> {
    const r = typeof bucketName === "undefined" ?
        await storage.getPresignedUploadURL(fileName, options) :
        await storage.getPresignedUploadURL(bucketName, fileName, options);
    logResult("getPresignedUploadURL", r, "ok"), options;

    if (r.error === null) {
        const { url, fields } = r.value as any;
        const form = new FormData();
        Object.entries(fields).forEach(([field, value]) => {
            form.append(field, value);
        });
        form.append("file", fs.createReadStream("./tests/data/image1.jpg"));
        new Promise(() => {
            form.submit(url, (err, res) => {
                if (err) {
                    colorLog("checkPresignedUploadURL", Color.ERROR, err);
                    return;
                }
                if (res.statusCode !== 200 && res.statusCode !== 204) {
                    colorLog("checkPresignedUploadURL", Color.ERROR, res.statusCode);
                    return;
                }
                colorLog("checkPresignedUploadURL", Color.OK, res.statusCode);
                return;
            });
        })
    }
}

export function getStorage(): Storage {
    return storage;
}

// export async function getFileInfo(fileName: string, bucketName: string) {
//     const info = await (storage.getAdapter() as AdapterAmazonS3).getFileInfo(
//         bucketName,
//         fileName
//     );
// }