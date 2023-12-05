import "jasmine";
import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import uniquid from "uniquid";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";
import { getConfig } from "./config";
import { copyFile } from "./util";

const newBucketName1 = `bucket-${uniquid()}`;
const newBucketName2 = `bucket-${uniquid()}`;

let storage: Storage;
let bucketName: string;

function colorLog(s: string): string {
  return `\x1b[96m [${s}]\x1b[0m`;
}

async function init() {
  const config = getConfig(StorageType.B2);
  storage = new Storage(config);
  bucketName = storage.config.bucketName || newBucketName1;
  console.log(colorLog("init"), storage.config);

  await fs.promises.stat(path.join(process.cwd(), "tests", "test_directory")).catch(async (e) => {
    await fs.promises.mkdir(path.join(process.cwd(), "tests", "test_directory"));
  });
}

async function cleanup() {
  const p = path.normalize(path.join(process.cwd(), "tests", "test_directory"));
  await rimraf(p, {
    preserveRoot: false,
  });
}

async function listBuckets() {
  const r = await storage.listBuckets();
  console.log(colorLog("listBuckets"), r);
}

async function bucketExists() {
  const r = await storage.bucketExists(bucketName);
  console.log(colorLog("bucketExists"), r);
}

async function createBucket() {
  const r = await storage.createBucket(newBucketName2);
  console.log(colorLog("createBucket"), r);
}

async function clearBucket() {
  const r = await storage.clearBucket(newBucketName2);
  console.log(colorLog("clearBucket"), r);
}

async function deleteBucket() {
  const r = await storage.deleteBucket(newBucketName2);
  console.log(colorLog("deleteBucket"), r);
}

async function listFiles() {
  const r = await storage.listFiles(newBucketName2);
  console.log(colorLog("listFiles"), r);
}

async function addFileFromPath() {
  const r = await storage.addFileFromPath({
    bucketName: newBucketName2,
    origPath: "./tests/data/image1.jpg",
    targetPath: "image1-path.jpg",
  });
  console.log(colorLog("addFileFromPath"), r);
}

async function addFileFromBuffer() {
  const buffer = await fs.promises.readFile("./tests/data/image1.jpg");
  const r = await storage.addFileFromBuffer({
    bucketName: newBucketName2,
    buffer,
    targetPath: "image1-buffer.jpg",
  });
  console.log(colorLog("addFileFromPath"), r);
}

async function addFileFromStream() {
  const stream = fs.createReadStream("./tests/data/image1.jpg");
  const r = await storage.addFileFromStream({
    bucketName: newBucketName2,
    stream,
    targetPath: "image1-stream.jpg",
  });
  console.log(colorLog("addFileFromPath"), r);
}

async function getFileAsStream() {
  const r = await storage.getFileAsStream(newBucketName2, "image1-path.jpg");
  console.log(colorLog("getFileAsStream"), r.error);
}

async function getFileAsStreamPartial() {
  const { value, error } = await storage.getFileAsStream(newBucketName2, "image1-path.jpg", {
    start: 0,
    end: 2000,
  });
  console.log(colorLog("getFileAsStream"), error);
  if (value !== null) {
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getType()}-partial.jpg`
    );
    const writeStream = fs.createWriteStream(filePath);
    await copyFile(value, writeStream);
  }
}

async function run() {
  await init();
  await listBuckets();
  await bucketExists();
  await createBucket();
  await listBuckets();
  await addFileFromPath();
  await addFileFromBuffer();
  await addFileFromStream();
  await listFiles();
  await getFileAsStream();
  await getFileAsStreamPartial();
  await clearBucket();
  await listFiles();
  await deleteBucket();
  await listBuckets();

  // await cleanup();
}

run();
