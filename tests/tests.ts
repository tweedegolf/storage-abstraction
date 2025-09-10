import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import { Storage } from "../src/Storage";
import { IAdapter, Options, S3Type, StorageType } from "../src/types/general";
import { getConfig } from "./config";
import { Color, colorLog, logResult, saveFile } from "./util";
import { fileTypeFromBuffer } from 'file-type';
import { ResultObject } from "../src/types/result";

let type: string;
let storage: Storage;

export const privateBucket = "aap892";
export const publicBucket = "aap893";

export async function init(_type: string, bucketName?: string): Promise<string> {
    await cleanup();
    type = _type;
    storage = new Storage(getConfig(type));
    bucketName = storage.config.bucketName || bucketName || "sab-test-bucket";
    colorLog("init", Color.MESSAGE, storage.config);

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
    logResult("createBucket", r), options;
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
    logResult("deleteBucket", r);
}

export async function listFiles(bucketName?: string) {
    const r = typeof bucketName !== "string" ? await storage.listFiles() : await storage.listFiles(bucketName, 10000);
    logResult("listFiles", r);
}

export async function addFileFromPath(targetPath: string, options: Options, bucketName?: string) {
    const r = await storage.addFileFromPath({
        bucketName,
        origPath: "./tests/data/image1.jpg",
        targetPath,
        options,
        // options: {GrantRead: "true"}
        // options: { useSignedUrl: "false" }
    });
    logResult("addFileFromPath", r), options;
}

export async function addFileFromBuffer(targetPath: string, options: Options, bucketName?: string) {
    const buffer = await fs.promises.readFile("./tests/data/image1.jpg");
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

export async function addFileFromStream(targetPath: string, options: Options, bucketName?: string) {
    const stream = fs.createReadStream("./tests/data/image1.jpg");
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
            `${destName}-${storage.getType()}.jpg`
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

export async function getPublicURL(fileName: string, options: Options, bucketName?: string) {
    const r = typeof bucketName === "undefined" ?
        await storage.getPublicURL(fileName, options) :
        await storage.getPublicURL(bucketName, fileName, options);
    logResult("getPublicURL", r), options;
    if (r.value !== null && type !== StorageType.LOCAL) {
        const response = await fetch(new Request(r.value));
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
            await waitABit(1000);
            const response = await fetch(new Request(r.value));
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

// export async function getFileInfo(fileName: string, bucketName: string) {
//     const info = await (storage.getAdapter() as AdapterAmazonS3).getFileInfo(
//         bucketName,
//         fileName
//     );
// }