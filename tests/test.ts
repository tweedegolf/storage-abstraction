import "jasmine";
import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import uniquid from "uniquid";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";
import { getConfig } from "./config";

const newBucketName1 = `bucket-${uniquid()}`;
const newBucketName2 = `bucket-${uniquid()}`;

let storage: Storage;
let bucketName: string;

function colorLog(s: string): string {
  return `\x1b[96m [${s}]\x1b[0m`;
}

async function init() {
  const config = getConfig();
  storage = new Storage(config);
  bucketName = storage.config.bucketName || newBucketName1;

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

async function run() {
  await init();
  await listBuckets();
  await bucketExists();
  await createBucket();
  await listBuckets();
  await addFileFromPath();
  await addFileFromBuffer();
  await listFiles();
  await clearBucket();
  await listFiles();

  // await cleanup();
}

run();
