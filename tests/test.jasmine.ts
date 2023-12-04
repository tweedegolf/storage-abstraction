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

const newBucketName1 = `bucket-${uniquid()}}`;
const newBucketName2 = `bucket-${uniquid()}}`;

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
    if (type !== StorageType.LOCAL) {
      await fs.promises
        .stat(path.join(process.cwd(), "tests", "test_directory"))
        .catch(async (e) => {
          await fs.promises.mkdir(path.join(process.cwd(), "tests", "test_directory"));
          console.log(e);
        });
    }
    try {
      storage = new Storage(config);
      bucketName = storage.config.bucketName || newBucketName1;
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
    const p = path.normalize(path.join(process.cwd(), "tests", "test_directory"));
    await rimraf(p, {
      preserveRoot: false,
    });
  });

  it("check if bucket exists", async () => {
    const { value, error } = await storage.bucketExists(bucketName);
    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value === false) {
      it("create bucket", async () => {
        const { value, error } = await storage.createBucket(bucketName, {});
        expect(value).not.toBeNull();
        expect(error).toBeNull();
      });
    } else {
      it("clear bucket", async () => {
        const { value, error } = await storage.clearBucket(bucketName);
        expect(value).not.toBeNull();
        expect(error).toBeNull();
      });
    }
  });

  // it("wait it bit", async () => {
  //   await expectAsync(waitABit(2000)).toBeResolved();
  // });

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
    ).toBeResolvedTo({ value: "ok", error: null });
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
    const { value, error } = await storage.removeFile(bucketName, "subdir/renamed.jpg");
    expect(value).not.toBeNull();
    expect(error).toBeNull();
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
    const { value, error } = await storage.getFileAsStream(bucketName, "image1.jpg");
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("get readable stream error", async () => {
    const { value, error } = await storage.getFileAsStream(bucketName, "image2.jpg");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("get readable stream and save file", async () => {
    // try {
    const { value, error } = await storage.getFileAsStream(bucketName, "image1.jpg");
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getType()}.jpg`
    );
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
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getType()}-part.jpg`
    );
    const { value, error } = await storage.getFileAsStream(bucketName, "image1.jpg", { end: 2999 });

    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      const readStream = value;
      const writeStream = fs.createWriteStream(filePath);
      await copyFile(readStream, writeStream);
      const size = (await fs.promises.stat(filePath)).size;
      expect(size).toBe(3000);
    }
  });

  it("add file from stream", async () => {
    const stream = fs.createReadStream("./tests/data/image2.jpg");
    await expectAsync(
      storage.addFileFromStream({ bucketName, stream, targetPath: "image2.jpg" })
    ).toBeResolvedTo({
      value: "ok",
      error: null,
    });
  });

  it("add file from buffer", async () => {
    const buffer = await fs.promises.readFile("./tests/data/image2.jpg");
    await expectAsync(
      storage.addFileFromBuffer({ bucketName, buffer, targetPath: "image3.jpg" })
    ).toBeResolvedTo({
      value: "ok",
      error: null,
    });
  });

  it("list files 3", async () => {
    const { value: files, error } = await storage.listFiles(bucketName);

    expect(files).not.toBeNull();
    expect(error).toBeNull();

    if (files !== null) {
      expect(files.findIndex(([a, b]) => a === "image1.jpg" && b === 32201) !== -1).toBeTrue();
      expect(files.findIndex(([a, b]) => a === "image2.jpg" && b === 42908) !== -1).toBeTrue();
      expect(files.findIndex(([a, b]) => a === "image3.jpg" && b === 42908) !== -1).toBeTrue();
    }
  });

  it("add & read file from storage", async () => {
    const buffer = await fs.promises.readFile("./tests/data/input.txt");
    await expectAsync(
      storage.addFileFromBuffer({ bucketName, buffer, targetPath: "input.txt" })
    ).toBeResolvedTo({
      value: "ok",
      error: null,
    });

    const { value, error } = await storage.getFileAsStream(bucketName, "input.txt");

    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      const data = await streamToString(value);
      expect(data).toEqual("hello world");
    }
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
    const { value, error } = await storage.createBucket(newBucketName2);
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("check created bucket", async () => {
    const { value, error } = await storage.listBuckets();

    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      const buckets = value;
      const index = buckets.indexOf(newBucketName2);
      expect(index).toBeGreaterThan(-1);
    }
  });

  it("add file to new bucket", async () => {
    await expectAsync(
      storage.addFileFromPath({
        bucketName,
        origPath: "./tests/data/image1.jpg",
        targetPath: "image1.jpg",
      })
    ).toBeResolvedTo({ value: "ok", error: null });
  });

  it("list files in new bucket", async () => {
    const expectedResult: [string, number][] = [["image1.jpg", 32201]];
    await expectAsync(storage.listFiles(newBucketName2)).toBeResolvedTo({
      value: expectedResult,
      error: null,
    });
  });

  it("delete non-empty bucket", async () => {
    // S3 doesn't allow you to delete a non-empty bucket
    // if (storage.getType() !== StorageType.S3) {
    // }
    const { value, error } = await storage.deleteBucket(newBucketName2);
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("check is bucket has been deleted", async () => {
    const { value, error } = await storage.listBuckets();
    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      const buckets = value;
      const index = buckets.indexOf(newBucketName2);
      expect(index).toBe(-1);
    }
  });
});
