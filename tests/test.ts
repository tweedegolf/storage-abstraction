import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import { Storage } from "../src/Storage";
import { AdapterAmazonS3 } from "../src/AdapterAmazonS3";
import { IAdapter, Options, StorageType } from "../src/types/general";
import { getConfig } from "./config";
import { saveFile, timeout } from "./util";
import { log } from "console";

let storage: Storage;

function colorLog(s: string): string {
  return `\x1b[96m [${s}]\x1b[0m`;
}

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

// cleanup test data from the Local Adapter
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
  console.log(colorLog("createBucket"), r);
}
async function createPublicBucket(bucketName?: string) {
  const r = await storage.createBucket(bucketName, { public: true });
  console.log(colorLog("createPublicBucket"), r);
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

async function addFileFromPath(bucketName?: string) {
  const r = await storage.addFileFromPath({
    bucketName,
    origPath: "./tests/data/image1.jpg",
    targetPath: "image1-path.jpg",
    // options: {GrantRead: "true"}
    options: { useSignedUrl: "false" }
  });
  console.log(colorLog("addFileFromPath"), r);
}

async function addFileFromBuffer(bucketName?: string) {
  const buffer = await fs.promises.readFile("./tests/data/image1.jpg");
  const r = await storage.addFileFromBuffer({
    bucketName,
    buffer,
    targetPath: "image1-buffer.jpg",
    // options: {
    //   ACL: "public-read"
    // }
  });
  console.log(colorLog("addFileFromBuffer"), r);
}

async function addFileFromStream(bucketName?: string) {
  const stream = fs.createReadStream("./tests/data/image1.jpg");
  const r = await storage.addFileFromStream({
    bucketName,
    stream,
    targetPath: "image1-stream.jpg",
  });
  console.log(colorLog("addFileFromStream"), r);
}

async function getFileAsStream(bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream("image1-path.jpg") :
    await storage.getFileAsStream(bucketName, "image1-path.jpg");

  console.log(colorLog("getFileAsStream"), error);
  if (value !== null) {
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getType()}-full.jpg`
    );
    const writeStream = fs.createWriteStream(filePath);
    await saveFile(value, writeStream);
  }
}

async function getFileAsStreamPartial(bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream("image1-path.jpg", { start: 0, end: 2000, }) :
    await storage.getFileAsStream(bucketName, "image1-path.jpg", { start: 0, end: 2000, });

  console.log(colorLog("getFileAsStream"), error);
  if (value !== null) {
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getType()}-partial.jpg`
    );
    const writeStream = fs.createWriteStream(filePath);
    await saveFile(value, writeStream);
  }
}

async function getFileAsStreamPartial2(bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream("image1-path.jpg", { end: 2000, }) :
    await storage.getFileAsStream(bucketName, "image1-path.jpg", { end: 2000, });

  console.log(colorLog("getFileAsStream"), error);
  if (value !== null) {
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getType()}-partial2.jpg`
    );
    const writeStream = fs.createWriteStream(filePath);
    await saveFile(value, writeStream);
  }
}
async function getFileAsStreamPartial3(bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream("image1-path.jpg", { start: 2000, }) :
    await storage.getFileAsStream(bucketName, "image1-path.jpg", { start: 2000, });

  console.log(colorLog("getFileAsStream"), error);
  if (value !== null) {
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getType()}-partial3.jpg`
    );
    const writeStream = fs.createWriteStream(filePath);
    await saveFile(value, writeStream);
  }
}

async function fileExists(bucketName?: string) {
  await storage.getAdapter().fileExists("image1-path.jpg")
  const r = typeof bucketName === "undefined" ? await storage.fileExists("image1-path.jpg") : await storage.fileExists(bucketName, "image1-path.jpg");
  console.log(colorLog("fileExists"), r);
}

async function sizeOf(bucketName?: string) {
  const r = typeof bucketName === "undefined" ? await storage.sizeOf("image1-path.jpg") : await storage.sizeOf(bucketName, "image1-path.jpg");
  console.log(colorLog("sizeOf"), r);
}

async function removeFile(bucketName?: string) {
  const r = typeof bucketName === "undefined" ? await storage.removeFile("image1-path.jpg") : await storage.removeFile(bucketName, "image1-path.jpg");
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
      console.error("\x1b[31m", "[Error removeAllBuckets]", b, e.message);
    }
  }
}

async function getFileInfo(bucketName: string) {
  const info = await (storage.getAdapter() as AdapterAmazonS3).getFileInfo(
    bucketName,
    "image1-path.jpg"
  );
}

async function run() {
  await init();

  let r;

  // const r = await storage.serviceClient.config.region();
  // console.log(r);

  // const buckets = await listBuckets();
  // if (buckets !== null && buckets.length > 0) {
  //   await deleteAllBuckets(buckets, storage);
  // }

  // console.log(storage.configError);
  // const b = getSelectedBucket();
  // await createBucket("aap890", { public: true });
  // await createBucket("aap891", { public: true });
  // setSelectedBucket(b);
  // setSelectedBucket("aap891");
  // await deleteBucket();
  // await bucketExists();
  // await bucketIsPublic("aap890");
  // await bucketIsPublic("aap889");
  // await addFileFromPath();
  // await addFileFromBuffer();
  // await listFiles();
  // r = await storage.getPublicURL("aap880", "image1-path.jpg");
  // r = await storage.getPublicURL("aap890", "image1-buffer.jpg");
  // console.log(r);
  r = await storage.getPublicURL("aap891", "image1-path.jpg", { noCheck: true });
  console.log(r);
  r = await storage.getPublicURL("aap891", "image1-buffer.jpg", { noCheck: true });
  console.log(r);
  // r = await storage.getPresignedURL("aap890", "image1-buffer.jpg");
  // console.log(r);
  // await getFileAsStream();

  // r = await storage.createBucket("aap8882", { public: true });
  // console.log(r);
  // r = await storage.bucketIsPublic("aap8882");
  // console.log(r);

  // await listBuckets();

  // await addFileFromPath();
  // await getFileInfo();

  // await addFileFromBuffer();
  // await addFileFromStream();
  // await addFileFromPath();
  // await addFileFromBuffer();
  // await addFileFromStream();
  // await listFiles();

  // await getFileAsStream();
  // await getFileAsStreamPartial();
  // await getFileAsStreamPartial2();
  // await getFileAsStreamPartial3();

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

  // await cleanup();

}

run();
