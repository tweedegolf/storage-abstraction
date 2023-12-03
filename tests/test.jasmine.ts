import "jasmine";
import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import dotenv from "dotenv";
import uniquid from "uniquid";
import { Storage } from "../src/Storage";
import { AdapterConfig, StorageType } from "../src/types";
import { copyFile } from "./util";
import { Readable } from "stream";

dotenv.config();

const type = process.env.TYPE || StorageType.LOCAL;

let config: AdapterConfig | string = "";
if (type === StorageType.LOCAL) {
  config = {
    type,
    bucketName: process.env.BUCKET_NAME,
    directory: process.env.LOCAL_DIRECTORY,
  };
} else if (type === StorageType.GCS) {
  config = {
    type: StorageType.GCS,
    bucketName: process.env.BUCKET_NAME,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILENAME,
  };
} else if (type === StorageType.S3) {
  config = {
    type,
    bucketName: process.env.BUCKET_NAME,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  };
} else if (type === StorageType.B2) {
  config = {
    type,
    bucketName: process.env.BUCKET_NAME,
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
  };
} else if (type === StorageType.AZURE) {
  config = {
    type,
    bucketName: process.env.BUCKET_NAME,
    storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
    accessKey: process.env.AZURE_STORAGE_ACCOUNT_KEY,
  };
} else {
  config = process.env.CONFIG_URL || `local://${process.cwd()}/the-buck`;
}

const newBucketName = `bucket-${uniquid()}}`;
const newBucketName2 = `bucket-${uniquid()}}`;
const newBucketName3 = `bucket-${uniquid()}}`;

let storage: Storage;
let bucketName: string;

const waitABit = async (millis = 100): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      // console.log(`just wait a bit (${millis}ms)`);
      resolve();
    }, millis);
  });

function streamToString(stream: Readable) {
  const chunks: Array<Uint8Array> = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

describe(`[testing ${type} storage]`, async () => {
  beforeAll(async () => {
    // create a temporary working directory
    await fs.promises.stat(path.join(process.cwd(), "tests", "tmp")).catch(async (e) => {
      await fs.promises.mkdir(path.join(process.cwd(), "tests", "tmp"));
      console.log(e);
    });
    try {
      storage = new Storage(config);
      bucketName = storage.config.bucketName || newBucketName;
      console.log("beforeAll");
      console.log(storage.config);
    } catch (e) {
      console.error(e);
    }
  });

  beforeEach(() => {
    // increase this value if you experience a lot of timeouts
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  afterAll(async () => {
    // await fs.promises.rm(path.join(process.cwd(), "tests", "tmp"), { force: true });
    let p = path.normalize(path.join(process.cwd(), "tests", "tmp"));
    await rimraf(p, {
      preserveRoot: false,
    });
    p = path.normalize(path.join(process.cwd(), "tests", "test_directory"));
    await rimraf(p, {
      preserveRoot: false,
    });
    p = path.normalize(path.join(process.cwd(), "the-buck"));
    await rimraf(p, {
      preserveRoot: false,
    });
    p = path.normalize(path.join(process.cwd(), "new-bucket"));
    await rimraf(p, {
      preserveRoot: false,
    });
  });

  it("create bucket", async () => {
    await expectAsync(storage.createBucket(bucketName, {})).toBeResolved();
  });

  // it("wait it bit", async () => {
  //   await expectAsync(waitABit(2000)).toBeResolved();
  // });

  it("clear bucket", async () => {
    await expectAsync(storage.clearBucket(bucketName)).toBeResolved();
  });

  it("check if bucket is empty", async () => {
    await expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({ value: [], error: null });
  });

  it("add file success", async () => {
    if (storage.getType() === StorageType.S3) {
      await expectAsync(
        storage.addFileFromPath({
          bucketName,
          origPath: "./tests/data/image1.jpg",
          targetPath: "image1.jpg",
          options: {
            Expires: new Date(2025, 11, 17),
          },
        })
      ).toBeResolvedTo({ value: "ok", error: null });
    } else {
      await expectAsync(
        storage.addFileFromPath({
          bucketName,
          origPath: "./tests/data/image1.jpg",
          targetPath: "image1.jpg",
        })
      ).toBeResolvedTo({ value: "ok", error: null });
    }
  });

  it("add file error", async () => {
    const { value, error } = await storage.addFileFromPath({
      bucketName,
      origPath: "./tests/data/non-existent.jpg",
      targetPath: "non-existent.jpg",
    });
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("add with new name and directory/prefix", async () => {
    await expectAsync(
      storage.addFileFromPath({
        bucketName,
        origPath: "./tests/data/image1.jpg",
        targetPath: "subdir/renamed.jpg",
      })
    ).toBeResolved();
  });

  it("list files 1", async () => {
    const expectedResult: [string, number][] = [
      ["image1.jpg", 32201],
      ["subdir/renamed.jpg", 32201],
    ];
    await expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({
      value: expectedResult,
      error: null,
    });
  });

  it("remove file success", async () => {
    await expectAsync(storage.removeFile(bucketName, "subdir/renamed.jpg")).toBeResolved();
  });

  it("remove file again", async () => {
    const { value, error } = await storage.removeFile(bucketName, "subdir/renamed.jpg");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("list files 2", async () => {
    const expectedResult: [string, number][] = [["image1.jpg", 32201]];
    await expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({
      value: expectedResult,
      error: null,
    });
  });

  it("get readable stream", async () => {
    await expectAsync(storage.getFileAsStream(bucketName, "image1.jpg")).toBeResolved();
  });

  it("get readable stream error", async () => {
    const { value, error } = await storage.getFileAsStream(bucketName, "image2.jpg");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("get readable stream and save file", async () => {
    // try {
    const { value, error } = await storage.getFileAsStream(bucketName, "image1.jpg");
    const filePath = path.join(process.cwd(), "tests", "tmp", `test-${storage.getType()}.jpg`);
    const writeStream = fs.createWriteStream(filePath);

    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      // value is a readstream
      await copyFile(value, writeStream);
    }
    // } catch (e) {
    //   throw e;
    // }
  });

  it("get readable stream partially and save file", async () => {
    const filePath = path.join(process.cwd(), "tests", "tmp", `test-${storage.getType()}-part.jpg`);
    // try {
    const readStream = await storage.getFileAsReadable("image1.jpg", { end: 2999 });
    const writeStream = fs.createWriteStream(filePath);
    await copyFile(readStream, writeStream);
    // } catch (e) {
    //   throw e;
    // }
    const size = (await fs.promises.stat(filePath)).size;
    // console.log(size);
    expect(size).toBe(3000);
  });

  it("add file from stream", async () => {
    const stream = fs.createReadStream("./tests/data/image2.jpg");
    await expectAsync(storage.addFileFromReadable(stream, "image2.jpg")).toBeResolved();
  });

  it("add file from buffer", async () => {
    const buffer = await fs.promises.readFile("./tests/data/image2.jpg");
    await expectAsync(storage.addFileFromBuffer(buffer, "image3.jpg")).toBeResolved();
  });

  it("list files 3", async () => {
    const files = await storage.listFiles();
    expect(files.findIndex(([a, b]) => a === "image1.jpg" && b === 32201) !== -1).toBeTrue();
    expect(files.findIndex(([a, b]) => a === "image2.jpg" && b === 42908) !== -1).toBeTrue();
    expect(files.findIndex(([a, b]) => a === "image3.jpg" && b === 42908) !== -1).toBeTrue();
  });

  it("add & read file from storage", async () => {
    const buffer = await fs.promises.readFile("./tests/data/input.txt");
    await expectAsync(storage.addFileFromBuffer(buffer, "input.txt")).toBeResolved();

    const fileReadable = await storage.getFileAsReadable("input.txt");
    const data = await streamToString(fileReadable);

    expect(data).toEqual("hello world");
  });

  it("sizeOf", async () => {
    await expectAsync(storage.sizeOf(bucketName, "image1.jpg")).toBeResolvedTo({
      value: 32201,
      error: null,
    });
  });

  it("check if file exists: yes", async () => {
    await expectAsync(storage.fileExists(bucketName, "image1.jpg")).toBeResolvedTo({
      value: true,
      error: null,
    });
  });

  it("check if file exists: nope", async () => {
    await expectAsync(storage.fileExists(bucketName, "image10.jpg")).toBeResolvedTo({
      value: false,
      error: null,
    });
  });

  it("create bucket error", async () => {
    const { value, error } = await storage.createBucket("");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("create bucket error", async () => {
    const { value, error } = await storage.createBucket("null");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("create bucket error", async () => {
    const { value, error } = await storage.createBucket("undefined");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("create bucket", async () => {
    try {
      await storage.createBucket(newBucketName);
    } catch (e) {
      console.error("\x1b[31m", e, "\n");
    }
  });

  it("check created bucket", async () => {
    const buckets = await storage.listBuckets();
    const index = buckets.indexOf(newBucketName);
    expect(index).toBeGreaterThan(-1);
  });

  it("select bucket", async () => {
    await storage.selectBucket(newBucketName);
    expect(storage.getSelectedBucket()).toBe(newBucketName);
  });

  it("add file to new bucket", async () => {
    await expectAsync(
      storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg")
    ).toBeResolved();
  });

  it("list files in new bucket", async () => {
    const expectedResult: [string, number][] = [["image1.jpg", 32201]];
    await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
  });

  it("delete bucket currently selected non-empty bucket", async () => {
    // S3 doesn't allow you to delete a non-empty bucket
    if (storage.getType() !== StorageType.S3) {
      const msg = await storage.deleteBucket();
      expect(storage.getSelectedBucket()).toBe("");
      const buckets = await storage.listBuckets();
      const index = buckets.indexOf(newBucketName);
      expect(index).toBe(-1);
    }
  });

  it("create bucket", async () => {
    // expectAsync(storage.createBucket(newBucketName)).toBeResolved();
    try {
      const msg = await storage.createBucket(newBucketName2);
      //console.log('create bucket msg: ',msg);
    } catch (e) {
      console.error("\x1b[31m", e, "\n");
    }
  });

  it("check created bucket", async () => {
    const buckets = await storage.listBuckets();
    //console.log(buckets);

    const index = buckets.indexOf(newBucketName2);
    expect(index).not.toBe(-1);
  });

  it("clear bucket by providing a bucket name", async () => {
    await expectAsync(storage.clearBucket(newBucketName2)).toBeResolved();
  });

  it("bucket should contain no files", async () => {
    const buckets = await storage.listBuckets();
    // await expectAsync(storage.selectBucket(newBucketName)).toBeResolvedTo("bucket selected");
    const b = await storage.selectBucket(newBucketName2);
    await expectAsync(storage.listFiles()).toBeResolvedTo([]);
  });

  it("delete bucket by providing a bucket name", async () => {
    const msg = await storage.deleteBucket(newBucketName2);
    //console.log(msg);
    const buckets = await storage.listBuckets();
    const index = buckets.indexOf(newBucketName2);
    expect(index).toBe(-1);
  });
});
