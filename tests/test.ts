import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import { Storage } from "../src/Storage";
import { AdapterAmazonS3 } from "../src/AdapterAmazonS3";
import { IAdapter, Options, StorageType } from "../src/types/general";
import { getConfig } from "./config";
import { saveFile, timeout, waitABit } from "./util";

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
  console.log(colorLog("addFileFromPath"), r);
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
  console.log(colorLog("addFileFromBuffer"), r);
}

async function addFileFromStream(targetPath: string, options: Options, bucketName?: string) {
  const stream = fs.createReadStream("./tests/data/image1.jpg");
  const r = await storage.addFileFromStream({
    bucketName,
    stream,
    targetPath,
    options,
  });
  console.log(colorLog("addFileFromStream"), r);
}

async function getFileAsStream(fileName: string, bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream(fileName) :
    await storage.getFileAsStream(bucketName, fileName);

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

async function getFileAsStreamPartial(fileName: string, bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream(fileName, { start: 0, end: 2000, }) :
    await storage.getFileAsStream(bucketName, fileName, { start: 0, end: 2000, });

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

async function getFileAsStreamPartial2(fileName: string, bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream(fileName, { end: 2000, }) :
    await storage.getFileAsStream(bucketName, fileName, { end: 2000, });

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
async function getFileAsStreamPartial3(fileName: string, bucketName?: string) {
  const { value, error } = typeof bucketName === "undefined" ?
    await storage.getFileAsStream(fileName, { start: 2000, }) :
    await storage.getFileAsStream(bucketName, fileName, { start: 2000, });

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
      console.error("\x1b[31m", "[Error removeAllBuckets]", b, e.message);
    }
  }
}

async function getPublicURL(fileName: string, options: Options, bucketName?: string) {
  const r = typeof bucketName === "undefined" ? await storage.getPublicURL(
    fileName,
    options,
  ) : await storage.getPublicURL(
    bucketName,
    fileName,
    options,
  );
  console.log(colorLog("getPublicURL"), r);
  if (index !== 0) {
    if (r.value !== null) {
      fetch(new Request(r.value))
        .then((response) => {
          if (!response.ok) {
            console.log(`HTTP error! Status: ${response.status}`);
          }
        })
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
  await init();
  const b1 = "aap892";
  const b2 = "aap893";

  let r;

  const buckets = await listBuckets();
  if (index !== 5) {
    if (buckets !== null && buckets.length > 0) {
      await deleteAllBuckets(buckets, storage);
    }
  }

  // if (index === 4) {
  //   await waitABit(10000);
  // }

  // console.log(storage.configError);
  const b = getSelectedBucket();

  await createBucket(b1, { public: true });
  await bucketIsPublic(b1);
  setSelectedBucket(b1)
  await addFileFromPath('file1.jpg', {});
  await listFiles();
  await getPublicURL('file1.jpg', { noCheck: true });

  await createBucket(b2, { public: false });
  await bucketIsPublic(b2);
  setSelectedBucket(b2)
  const options = index === 6 ? { ACL: "public-read" } : {};
  await addFileFromPath('file1.jpg', options);
  await listFiles();
  await getPublicURL('file1.jpg', { noCheck: true });

  // await deleteBucket();
  // await bucketExists();
  // await deleteBucket("aap891");
  // await bucketExists("aap891");

  // setSelectedBucket(b);
  // await addFileFromBuffer();
  // await listFiles();
  // r = await storage.getPublicURL("aap880", "image1-path.jpg");
  // r = await storage.getPublicURL("aap890", "image1-buffer.jpg");
  // console.log(r);
  // r = await storage.getPublicURL("aap891", "image1-path.jpg", { noCheck: true });
  // console.log(r);
  // r = await storage.getPublicURL("aap891", "image1-buffer.jpg", { noCheck: true });
  // console.log(r);
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

  if (index === 0) {
    await cleanup();
  }

}

run();
