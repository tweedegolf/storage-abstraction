import "jasmine";
import fs from "fs";
import to from "await-to-js";
import path from "path";
import rimraf from "rimraf";
import uniquid from "uniquid";
import dotenv from "dotenv";
import { Storage } from "../src/Storage";
import { StorageConfig, StorageType } from "../src/types";
import { copyFile } from "./util";
dotenv.config();

let config: StorageConfig = null;
const type = process.env["TYPE"];
console.log("TYPE", type);
if (!type) {
  console.error("\x1b[31m[ERROR] Please set a value for env. var TYPE");
  process.exit(0);
}

const bucketName = process.env.STORAGE_BUCKETNAME;
const directory = process.env.STORAGE_LOCAL_DIRECTORY;
const projectId = process.env.STORAGE_GOOGLE_CLOUD_PROJECT_ID;
const keyFilename = process.env.STORAGE_GOOGLE_CLOUD_KEYFILE;
const accessKeyId = process.env.STORAGE_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.STORAGE_AWS_SECRET_ACCESS_KEY;

// console.log(bucketName, directory, projectId, keyFilename, accessKeyId, secretAccessKey);

if (type === StorageType.LOCAL) {
  config = {
    type,
    directory,
  };
} else if (type === StorageType.GCS && typeof keyFilename !== "undefined") {
  config = {
    type,
    bucketName,
    projectId,
    keyFilename,
  };
} else if (
  type === StorageType.S3 &&
  typeof accessKeyId !== "undefined" &&
  typeof secretAccessKey !== "undefined"
) {
  config = {
    type,
    bucketName,
    accessKeyId,
    secretAccessKey,
  };
}

console.log("CONFIG", config);
if (config === null) {
  console.error("\x1b[31m[ERROR] No valid config");
  process.exit(0);
}

const newBucketName = `bucket-${uniquid()}-${new Date()}`;

const waitABit = async (millis = 100): Promise<void> =>
  new Promise(resolve => {
    setTimeout(() => {
      // console.log(`just wait a bit (${millis}ms)`);
      resolve();
    }, millis);
  });

const storage = new Storage(config);
console.log(storage.getConfiguration());

describe(`testing ${storage.getType()} storage`, () => {
  beforeEach(() => {
    // increase this value if you experience a lot of timeouts
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  afterAll(async () => {
    // await storage.clearBucket();
    // cleaning up test data
    rimraf(path.join(process.cwd(), `test-*.jpg`), () => {
      console.log("all cleaned up!");
    });
  });

  it("test", async () => {
    try {
      await storage.test();
    } catch (e) {
      console.error(e);
      return;
    }
  });

  it("create bucket", async () => {
    await expectAsync(storage.createBucket(storage.getSelectedBucket())).toBeResolved();
  });

  // it("wait it bit", async () => {
  //   await expectAsync(waitABit(2000)).toBeResolved();
  // });

  it("clear bucket", async () => {
    await expectAsync(storage.clearBucket()).toBeResolved();
  });

  it("check if bucket is empty", async () => {
    const files = await storage.listFiles().catch(e => {
      console.log(e.message);
    });
    expect(files).toEqual([]);
  });

  it("add file success", async () => {
    await expectAsync(
      storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg")
    ).toBeResolved();
  });

  it("add file error", async () => {
    await expectAsync(
      storage.addFileFromPath("./tests/data/non-existent.jpg", "non-existent.jpg")
    ).toBeRejected();
  });

  it("add with new name and dir", async () => {
    // const [err, result] = await to(storage.addFileFromPath('./tests/data/image1.jpg', {
    //   dir: 'subdir',
    //   name: 'renamed.jpg',
    // }));

    await expectAsync(
      storage.addFileFromPath("./tests/data/image1.jpg", "subdir/renamed.jpg")
    ).toBeResolved();
  });

  it("list files 1", async () => {
    const expectedResult: [string, number][] = [
      ["image1.jpg", 32201],
      ["subdir/renamed.jpg", 32201],
    ];
    await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
  });

  it("remove file success", async () => {
    // const [err, result] = await to(storage.removeFile('subdir/renamed.jpg'));
    // console.log(err, result);
    await expectAsync(storage.removeFile("subdir/renamed.jpg")).toBeResolved();
  });

  it("remove file again", async () => {
    await expectAsync(storage.removeFile("subdir/renamed.jpg")).toBeResolved();
  });

  it("list files 2", async () => {
    const expectedResult: [string, number][] = [["image1.jpg", 32201]];
    await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
  });

  it("get readable stream", async () => {
    await expectAsync(storage.getFileAsReadable("image1.jpg")).toBeResolved();
  });

  it("get readable stream error", async () => {
    await expectAsync(storage.getFileAsReadable("image2.jpg")).toBeRejected();
  });

  it("get readable stream and save file", async () => {
    try {
      const readStream = await storage.getFileAsReadable("image1.jpg");
      const filePath = path.join(process.cwd(), `test-${storage.getType()}.jpg`);
      const writeStream = fs.createWriteStream(filePath);
      await copyFile(readStream, writeStream);
    } catch (e) {
      console.log(e);
      throw e;
    }
  });

  it("get readable stream partially and save file", async () => {
    const filePath = path.join(process.cwd(), `test-${storage.getType()}-part.jpg`);
    try {
      const readStream = await storage.getFileAsReadable("image1.jpg", { end: 2999 });
      const writeStream = fs.createWriteStream(filePath);
      await copyFile(readStream, writeStream);
    } catch (e) {
      console.log(e);
      throw e;
    }
    const size = (await fs.promises.stat(filePath)).size;
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
    const expectedResult: [string, number][] = [
      ["image1.jpg", 32201],
      ["image2.jpg", 42908],
      ["image3.jpg", 42908],
    ];
    await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
  });

  it("sizeOf", async () => {
    await expectAsync(storage.sizeOf("image1.jpg")).toBeResolvedTo(32201);
  });

  it("check if file exists: yes", async () => {
    await expectAsync(storage.fileExists("image1.jpg")).toBeResolvedTo(true);
  });

  it("check if file exists: nope", async () => {
    await expectAsync(storage.fileExists("image10.jpg")).toBeResolvedTo(false);
  });

  it("create bucket error", async () => {
    await expectAsync(storage.createBucket()).toBeRejectedWith("Please provide a bucket name");
  });

  it("create bucket error", async () => {
    await expectAsync(storage.createBucket("")).toBeRejectedWith("Please provide a bucket name");
  });

  it("create bucket error", async () => {
    await expectAsync(storage.createBucket(null)).toBeRejectedWith(
      "Can not use `null` as bucket name"
    );
  });

  it("create bucket error", async () => {
    await expectAsync(storage.createBucket("null")).toBeRejectedWith(
      'Can not use "null" as bucket name'
    );
  });

  it("create bucket error", async () => {
    await expectAsync(storage.createBucket("undefined")).toBeRejectedWith(
      'Can not use "undefined" as bucket name'
    );
  });

  it("create already existing bucket that you are not allowed to access", async () => {
    // the name "new-bucket" has already been taken by someone else (not for local)
    let r = storage.getType() === StorageType.LOCAL;
    try {
      const msg = await storage.createBucket("new-bucket");
      // console.log(msg);
    } catch (e) {
      r = e.message !== "ok" && e.message !== "";
      // console.log("R", r);
    }
    expect(r).toEqual(true);
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

  // it("select bucket", async () => {
  //   const buckets = await storage.listBuckets();
  //   const index = buckets.indexOf(newBucketName);
  //   expect(index).toBeGreaterThan(-1);
  // });

  // it("delete bucket", async () => {
  //   const index = buckets.indexOf(newBucketName);
  //   expect(index).toBeGreaterThan(-1);
  // });
});
