import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import { Storage } from "../src/Storage";
import { AdapterAmazonS3 } from "../src/AdapterAmazonS3";
import { IAdapter, Options, StorageType } from "../src/types/general";
import { getConfig } from "./config";
import { colorLog, saveFile, timeout, waitABit } from "./util";
import { fileTypeFromBuffer } from 'file-type';

let storage: Storage;

const types = [
  StorageType.LOCAL, // 0
  StorageType.S3, // 1
  StorageType.B2, // 2
  StorageType.GCS, // 3
  StorageType.AZURE, // 4
  StorageType.MINIO, // 5
  "S3-Cubbit", // 6
  "S3-Cloudflare-R2", // 7
  "S3-Backblaze-B2", // 8
];

let index = 0;
// console.log(process.argv);
if (process.argv[2]) {
  index = parseInt(process.argv[2], 10);
}

async function init(bucketName?: string): Promise<string> {
  // select the type of storage you want to test or pass it on the command line
  storage = new Storage(getConfig(types[index]));
  bucketName = storage.config.bucketName || bucketName || "sab-test-bucket";
  console.log(colorLog("init"), storage.config);

  await fs.promises.stat(path.join(process.cwd(), "tests", "test_directory")).catch(async (e) => {
    await fs.promises.mkdir(path.join(process.cwd(), "tests", "test_directory"));
  });

  return Promise.resolve(bucketName);
}

async function cleanup() {
  const p = path.normalize(path.join(process.cwd(), "tests", "test_directory"));
  await rimraf(p, {
    preserveRoot: false,
  });
}

async function listBuckets(): Promise<Array<string> | null> {
  const r = await storage.listBuckets();
  console.log(colorLog("listBuckets"), r);
  return r.value;
}

async function bucketExists(bucketName?: string) {
  const r = await storage.bucketExists(bucketName);
  console.log(colorLog("bucketExists"), r);
}

async function bucketIsPublic(bucketName?: string) {
  const r = await storage.bucketIsPublic(bucketName);
  console.log(colorLog("bucketIsPublic"), r);
}

async function createBucket(bucketName?: string, options?: Options) {
  const r = await storage.createBucket(bucketName, options);
  console.log(colorLog("createBucket"), r, options);
}

function getSelectedBucket(): string | null {
  const r = storage.getSelectedBucket();
  console.log(colorLog("getSelectedBucket"), r);
  return r;
}

function setSelectedBucket(b: string | null) {
  const r = storage.setSelectedBucket(b);
  console.log(colorLog("setSelectedBucket"), b);
}

async function clearBucket(bucketName?: string) {
  const r = await storage.clearBucket(bucketName);
  console.log(colorLog("clearBucket"), r);
}

async function deleteBucket(bucketName?: string) {
  const r = await storage.deleteBucket(bucketName);
  console.log(colorLog("deleteBucket"), r);
}

async function listFiles(bucketName?: string) {
  const r = typeof bucketName !== "string" ? await storage.listFiles() : await storage.listFiles(bucketName, 10000);
  console.log(colorLog("listFiles"), r);
}

async function addFileFromPath(targetPath: string, options: Options, bucketName?: string) {
  const r = await storage.addFileFromPath({
    bucketName,
    origPath: "./tests/data/image1.jpg",
    targetPath,
    options,
    // options: {GrantRead: "true"}
    // options: { useSignedUrl: "false" }
  });
  console.log(colorLog("addFileFromPath"), r, options);
}

async function addFileFromBuffer(targetPath: string, options: Options, bucketName?: string) {
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
  console.log(colorLog("addFileFromBuffer"), r, options);
}

async function addFileFromStream(targetPath: string, options: Options, bucketName?: string) {
  const stream = fs.createReadStream("./tests/data/image1.jpg");
  const r = await storage.addFileFromStream({
    bucketName,
    stream,
    targetPath,
    options,
  });
  console.log(colorLog("addFileFromStream"), r, options);
}

async function getFileAsStream(fileName: string, destName: string, options?: Options, bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream(fileName, options) :
    await storage.getFileAsStream(bucketName, fileName, options);

  if (error !== null) {
    console.log(colorLog("getFileAsStream", "91m"), error);
  } else {
    console.log(colorLog("getFileAsStream"), "ok");
  }

  if (value !== null) {
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `${destName}-${storage.getType()}.jpg`
    );
    const writeStream = fs.createWriteStream(filePath);
    await saveFile(value, writeStream);
  }
}

async function fileExists(fileName: string, bucketName?: string) {
  await storage.getAdapter().fileExists(fileName);
  const r = typeof bucketName === "undefined" ? await storage.fileExists(fileName) : await storage.fileExists(bucketName, fileName);
  console.log(colorLog("fileExists"), r);
}

async function sizeOf(fileName: string, bucketName?: string) {
  const r = typeof bucketName === "undefined" ? await storage.sizeOf(fileName) : await storage.sizeOf(bucketName, fileName);
  console.log(colorLog("sizeOf"), r);
}

async function removeFile(fileName: string, bucketName?: string) {
  const r = typeof bucketName === "undefined" ? await storage.removeFile(fileName) : await storage.removeFile(bucketName, fileName);
  console.log(colorLog("removeFile"), r);
}

async function deleteAllBuckets(list: Array<string>, storage: IAdapter, delay: number = 500) {
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    console.log(colorLog("remove bucket"), b);
    try {
      await storage.clearBucket(b);
      if (delay) {
        await timeout(delay);
      }
      // const files = await storage.listFiles();
      // console.log(`\tfiles: ${files}`);
      await storage.deleteBucket(b);
    } catch (e) {
      console.log(colorLog("removeAllBuckets", "91m"), b, e.message);
    }
  }
}

async function getPublicURL(fileName: string, options: Options, bucketName?: string) {
  const r = typeof bucketName === "undefined" ?
    await storage.getPublicURL(fileName, options) :
    await storage.getPublicURL(bucketName, fileName, options);
  console.log(colorLog("getPublicURL"), r, options);
  if (index !== 0) {
    if (r.value !== null) {
      const response = await fetch(new Request(r.value));
      if (!response.ok) {
        console.log(colorLog("getPublicURL", "91m"), `HTTP status: ${response.status}`);
      } else {
        console.log(colorLog("getPublicURL"), "public url is valid!");
      }
    }
  }
}

async function getSignedURL(fileName: string, dest: string, options: Options, bucketName?: string) {
  const r = typeof bucketName === "undefined" ?
    await storage.getSignedURL(fileName, options) :
    await storage.getSignedURL(bucketName, fileName, options);
  console.log(colorLog("getSignedURL"), r, options);
  if (index !== 0) {
    if (r.value !== null) {
      await waitABit(1000);
      const response = await fetch(new Request(r.value));
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileType = await fileTypeFromBuffer(buffer);
      if (!response.ok) {
        console.log(colorLog("getSignedURL", "91m"), `HTTP status: ${response.status}`);
      } else {
        if (fileType?.ext !== "jpg") {
          console.log(colorLog("getSignedURL", "91m"), "not an image, probably an error message");
        } else {
          console.log(colorLog("getSignedURL"), "signed url is valid!");
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

async function getFileInfo(fileName: string, bucketName: string) {
  const info = await (storage.getAdapter() as AdapterAmazonS3).getFileInfo(
    bucketName,
    fileName
  );
}

async function run() {
  const b1 = "aap892";
  const b2 = "aap893";

  await cleanup();
  await init();
  getSelectedBucket();
  // console.log(storage.configError);

  const buckets = await listBuckets();
  /**
   * Don't delete buckets at Minio, Backblaze S3 and Cubbit
   * - Minio: because there exist a zillion buckets in the public test environment
   * - Backblaze S3 and Cubbit: because you can only make a bucket public using the web console
   */
  if (index !== 5 && index !== 7 && index !== 8) {
    if (buckets !== null && buckets.length > 0) {
      await deleteAllBuckets(buckets, storage);
    }
  } else {
    // only delete the private bucket
    storage.deleteBucket(b1);
  }

  // if (index === 4) {
  //   await waitABit(10000);
  // }


  await createBucket(b1, { public: false });
  await bucketIsPublic(b1);
  setSelectedBucket(b1)
  await addFileFromPath('file1.jpg', {});
  await listFiles();
  await getPublicURL('file1.jpg', { noCheck: true });
  await getPublicURL('file1.jpg', { noCheck: false });
  await getSignedURL("file1.jpg", "file1", {});

  await createBucket(b2, { public: true });
  await bucketIsPublic(b2);
  setSelectedBucket(b2)

  /**
   * To make a file publicly accessible in Cubbit you need to set ACL per file.
   * Note that this also makes files in a private bucket publicly accessible!
   */
  const options = index === 6 ? { ACL: "public-read" } : {};

  await addFileFromPath('file2.jpg', options);
  await listFiles();
  await getPublicURL('file2.jpg', { noCheck: true });
  await getSignedURL('file2.jpg', "expired", { expiresIn: 1 });
  await getSignedURL('file2.jpg', "valid", {});


  setSelectedBucket(b1)
  await deleteBucket();
  await bucketExists();

  setSelectedBucket(b2);
  await addFileFromBuffer("file-from-buffer.jpg", {});
  await addFileFromStream("file-from-stream.jpg", {});
  await listFiles();

  // await getFileAsStream("file-from-stream.jpg", "full");
  // await getFileAsStream("file-from-stream.jpg", "partial1", { start: 0, end: 2000 });
  // await getFileAsStream("file-from-stream.jpg", "partial2", { end: 2000 });
  // await getFileAsStream("file-from-stream.jpg", "partial3", { start: 2000 });

  // process.exit();

  // await fileExists();
  // await sizeOf();
  // await removeFile();
  // await removeFile();
  // await removeFile();
  // await fileExists();
  // await clearBucket();
  // await listFiles();
  // await deleteBucket();
  // await listBuckets();

  if (index === 0) {
    await cleanup();
  }

}

run();

