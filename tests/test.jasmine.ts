import "jasmine";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { Provider, StorageAdapterConfig } from "../src/types/general";
import { saveFile } from "./util";
import { getConfig } from "./config";
import { Storage } from "../src/Storage";

let provider = Provider.LOCAL;
if (process.argv[2]) {
  provider = process.argv[2] as Provider;
}
const config: StorageAdapterConfig | string = getConfig(provider);

const newBucketName1 = "bucket-test-sab-1";
const newBucketName2 = "bucket-test-sab-2";

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

describe(`[testing ${provider}]`, () => {
  beforeAll(async () => {
    // create a temporary working directory
    if (provider !== Provider.LOCAL) {
      await fs.promises
        .stat(path.join(process.cwd(), "tests", "test_directory"))
        .catch(async (e) => {
          await fs.promises.mkdir(path.join(process.cwd(), "tests", "test_directory"));
          // console.log(e);
        });
    }
    try {
      storage = new Storage(config);
      // bucketName = storage.config.bucketName || newBucketName1;
      bucketName = newBucketName1;
      // console.log("beforeAll");
      console.log(storage.config);
      // console.log("bucketName", bucketName);
    } catch (e) {
      console.error(e);
    }
  });

  beforeEach(() => {
    // increase this value if you experience a lot of timeouts
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  afterAll(async () => {
    // const p = path.normalize(path.join(process.cwd(), "tests", "test_directory"));
    // await rimraf(p, {
    //   preserveRoot: false,
    // });
  });
  let bucketExists: boolean;
  it("(0) delete possible existing test buckets", async () => {
    await storage.deleteBucket(newBucketName1);
    await storage.deleteBucket(newBucketName2);
  });

  it("(1) check if bucket exists", async () => {
    const { value, error } = await storage.bucketExists(bucketName);
    expect(value).not.toBeNull();
    expect(error).toBeNull();
    if (value !== null) {
      bucketExists = value;
    }
  });

  it("(2) create bucket", async () => {
    if (bucketExists === false) {
      const { value, error } = await storage.createBucket(bucketName, {});
      expect(value).not.toBeNull();
      expect(error).toBeNull();
    }
  });

  it("(3) clear bucket", async () => {
    if (bucketExists === true) {
      const { value, error } = await storage.clearBucket(bucketName);
      expect(value).not.toBeNull();
      expect(error).toBeNull();
    }
  });

  // it("wait it bit", async () => {
  //   await expectAsync(waitABit(2000)).toBeResolved();
  // });

  it("(4) check if bucket is empty", async () => {
    await expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({ value: [], error: null });
  });

  it("(5) add file success", async () => {
    let value: null | string;
    let error: null | string;
    if (storage.getProvider() === Provider.S3) {
      ({ value, error } = await storage.addFileFromPath({
        bucketName,
        origPath: "./tests/data/image1.jpg",
        targetPath: "image1.jpg",
        options: {
          Expires: new Date(2025, 11, 17),
        },
      }));
    } else {
      ({ value, error } = await storage.addFileFromPath({
        bucketName,
        origPath: "./tests/data/image1.jpg",
        targetPath: "image1.jpg",
      }));
    }
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(6) add file error", async () => {
    const { value, error } = await storage.addFileFromPath({
      bucketName,
      origPath: "./tests/data/non-existent.jpg",
      targetPath: "non-existent.jpg",
    });
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("(7) add with new name and directory/prefix", async () => {
    const { value, error } = await storage.addFileFromPath({
      bucketName,
      origPath: "./tests/data/image1.jpg",
      targetPath: "subdir/renamed.jpg",
    });

    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(8) list files 1", async () => {
    const expectedResult: [string, number][] = [
      ["image1.jpg", 32201],
      ["subdir/renamed.jpg", 32201],
    ];
    await expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({
      value: expectedResult,
      error: null,
    });
  });

  it("(9) remove file success", async () => {
    const { value, error } = await storage.removeFile(bucketName, "subdir/renamed.jpg");
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(10) remove file again", async () => {
    const { value, error } = await storage.removeFile(bucketName, "subdir/renamed.jpg");
    // console.log(type, value, error);
    if (provider === Provider.BACKBLAZE_S3) {
      // remove file fails if the file doesn't exist in Backblaze
      expect(value).toBeNull();
      expect(error).not.toBeNull();
    } else {
      // remove file does not fails if the file doesn't exist
      expect(value).not.toBeNull();
      expect(error).toBeNull();
    }
  });

  it("(11) list files 2", async () => {
    const expectedResult: [string, number][] = [["image1.jpg", 32201]];
    await expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({
      value: expectedResult,
      error: null,
    });
  });

  it("(12) get readable stream", async () => {
    const { value, error } = await storage.getFileAsStream(bucketName, "image1.jpg");
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(13) get readable stream error", async () => {
    const { value, error } = await storage.getFileAsStream(bucketName, "image2.jpg");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
    // console.log(error);
  });

  it("(14) get readable stream and save file", async () => {
    // try {
    const { value, error } = await storage.getFileAsStream(bucketName, "image1.jpg");
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getProvider()}.jpg`
    );
    const writeStream = fs.createWriteStream(filePath);

    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      // value is a readstream
      await saveFile(value, writeStream);
    }
    // } catch (e) {
    //   throw e;
    // }
  });

  it("(15) get readable stream partially and save file", async () => {
    const filePath = path.join(
      process.cwd(),
      "tests",
      "test_directory",
      `test-${storage.getProvider()}-part.jpg`
    );
    const { value, error } = await storage.getFileAsStream(bucketName, "image1.jpg", { end: 2999 });

    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      const readStream = value;
      const writeStream = fs.createWriteStream(filePath);
      await saveFile(readStream, writeStream);
      const size = (await fs.promises.stat(filePath)).size;
      expect(size).toBe(3000);
    }
  });

  it("(16) add file from stream", async () => {
    const stream = fs.createReadStream("./tests/data/image2.jpg");
    const { value, error } = await storage.addFileFromStream({
      bucketName,
      stream,
      targetPath: "image2.jpg",
    });

    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(17) add file from stream partial", async () => {
    const stream = fs.createReadStream("./tests/data/image2.jpg");
    const { value, error } = await storage.addFileFromStream({
      bucketName,
      stream,
      targetPath: "image2p.jpg",
      options: { start: 0, end: 3000 },
    });

    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(18) add file from buffer", async () => {
    const buffer = await fs.promises.readFile("./tests/data/image2.jpg");
    const { value, error } = await storage.addFileFromBuffer({
      bucketName,
      buffer,
      targetPath: "image3.jpg",
    });

    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(19) list files 3", async () => {
    const { value: files, error } = await storage.listFiles(bucketName);

    expect(files).not.toBeNull();
    expect(error).toBeNull();

    if (files !== null) {
      expect(files.findIndex(([a, b]) => a === "image1.jpg" && b === 32201) !== -1).toBeTrue();
      expect(files.findIndex(([a, b]) => a === "image2.jpg" && b === 42908) !== -1).toBeTrue();
      expect(files.findIndex(([a, b]) => a === "image3.jpg" && b === 42908) !== -1).toBeTrue();
    }
  });

  it("(20) add & read file from storage", async () => {
    const buffer = await fs.promises.readFile("./tests/data/input.txt");
    expect(buffer).not.toBeUndefined();
    expect(buffer).not.toBeNull();

    const { value, error } = await storage.addFileFromBuffer({
      bucketName,
      buffer,
      targetPath: "input.txt",
    });

    expect(value).not.toBeNull();
    expect(error).toBeNull();

    const { value: value1, error: error1 } = await storage.getFileAsStream(bucketName, "input.txt");

    expect(value1).not.toBeNull();
    expect(error1).toBeNull();

    if (value1 !== null) {
      const data = await streamToString(value1);
      expect(data).toEqual("hello world");
    }
  });

  it("(21) sizeOf", async () => {
    await expectAsync(storage.sizeOf(bucketName, "image1.jpg")).toBeResolvedTo({
      value: 32201,
      error: null,
    });
  });

  it("(22) check if file exists: yes", async () => {
    await expectAsync(storage.fileExists(bucketName, "image1.jpg")).toBeResolvedTo({
      value: true,
      error: null,
    });
  });

  it("(23) check if file exists: nope", async () => {
    await expectAsync(storage.fileExists(bucketName, "image10.jpg")).toBeResolvedTo({
      value: false,
      error: null,
    });
  });

  it("(24) create bucket error", async () => {
    const { value, error } = await storage.createBucket("");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("(25) create bucket error", async () => {
    const { value, error } = await storage.createBucket("null");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("(26) create bucket error", async () => {
    const { value, error } = await storage.createBucket("undefined");
    expect(value).toBeNull();
    expect(error).not.toBeNull();
  });

  it("(27) create bucket", async () => {
    const { value, error } = await storage.createBucket(newBucketName2);
    if (error) {
      console.log(error);
    }
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(28) check created bucket", async () => {
    const { value, error } = await storage.listBuckets();

    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      const buckets = value;
      const index = buckets.indexOf(newBucketName2);
      expect(index).toBeGreaterThan(-1);
    }
  });

  it("(29) add file to new bucket", async () => {
    const { value, error } = await storage.addFileFromPath({
      bucketName: newBucketName2,
      origPath: "./tests/data/image1.jpg",
      targetPath: "image1.jpg",
    });

    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(30) list files in new bucket", async () => {
    const expectedResult: [string, number][] = [["image1.jpg", 32201]];
    await expectAsync(storage.listFiles(newBucketName2)).toBeResolvedTo({
      value: expectedResult,
      error: null,
    });
  });

  it("(31) delete non-empty bucket", async () => {
    // S3 doesn't allow you to delete a non-empty bucket
    // if (storage.getProvider() !== Provider.S3) {
    // }
    // const { value: v, error: e } = await storage.clearBucket(newBucketName1);
    // console.log(v, e)
    // const { value: v2, error: e2 } = await storage.listFiles(newBucketName1);
    // console.log(v2, e2)
    const { value, error } = await storage.deleteBucket(newBucketName1);
    // console.log(value, error);
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(32) check if bucket has been deleted", async () => {
    const { value, error } = await storage.listBuckets();
    expect(value).not.toBeNull();
    expect(error).toBeNull();

    if (value !== null) {
      const buckets = value;
      const index = buckets.indexOf(newBucketName1);
      expect(index).toBe(-1);
    }
  });

  it("(33) delete non-empty bucket 2", async () => {
    const { value, error } = await storage.deleteBucket(newBucketName2);
    expect(value).not.toBeNull();
    expect(error).toBeNull();
  });

  it("(32) check if bucket 2 has been deleted", async () => {
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
