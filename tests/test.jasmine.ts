import "jasmine";
import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import dotenv from "dotenv";
import uniquid from "uniquid";
import { Storage } from "../src/Storage";
import { AdapterConfig, ConfigLocal, StorageType } from "../src/types";
import { copyFile } from "./util";
import { Readable } from "stream";

dotenv.config();

const type = process.env["TYPE"];
const configUrl = process.env["CONFIG_URL"];
const bucketName = process.env["BUCKET_NAME"];
const directory = process.env["LOCAL_DIRECTORY"];
const projectId = process.env["GOOGLE_CLOUD_PROJECT_ID"];
const keyFilename = process.env["GOOGLE_CLOUD_KEYFILE"];
const accessKeyId = process.env["AWS_ACCESS_KEY_ID"];
const secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
const region = process.env["AWS_REGION"];
const applicationKeyId = process.env["B2_APPLICATION_KEY_ID"];
const applicationKey = process.env["B2_APPLICATION_KEY"];
const storageAccount = process.env["AZURE_STORAGE_ACCOUNT"];
const accessKey = process.env["AZURE_STORAGE_ACCESS_KEY"];

console.group(".env");
console.log({
  type,
  configUrl,
  bucketName,
  directory,
  projectId,
  keyFilename,
  accessKeyId,
  secretAccessKey,
  storageAccount,
  accessKey,
});
console.groupEnd();

let config: AdapterConfig | string = "";
if (type === StorageType.LOCAL) {
  config = {
    type,
    bucketName,
    directory,
  };
} else if (type === StorageType.GCS) {
  config = {
    type,
    // noChecks: true,
    bucketName,
    projectId,
    keyFilename,
  };
} else if (type === StorageType.S3) {
  config = {
    type,
    bucketName,
    accessKeyId,
    secretAccessKey,
    region,
  };
} else if (type === StorageType.B2) {
  config = {
    type,
    bucketName,
    applicationKeyId,
    applicationKey,
  };
} else if (type === StorageType.AZURESTORAGEBLOB) {
  config = {
    type,
    storageAccount,
    accessKey,
    bucketName,
  };
} else {
  if (!configUrl) {
    config = `local://${process.cwd()}/the-buck`;
  } else {
    config = configUrl;
  }
}

const newBucketName = `bucket-${uniquid()}-${new Date().getTime()}`;
const newBucketName2 = `bucket-${uniquid()}-${new Date().getTime()}`;

// console.log("CONFIG", config);
// console.log("newBucketName:", newBucketName, "\n");

let storage: Storage;
const test = async () => {
  try {
    storage = new Storage(config);
    // console.log(storage);
    await storage.init();
  } catch (e) {
    console.error(`\x1b[31m${e.message}`);
    process.exit(0);
  }
};
// test();

const waitABit = async (millis = 100): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => {
      // console.log(`just wait a bit (${millis}ms)`);
      resolve();
    }, millis);
  });

function streamToString(stream: Readable) {
  const chunks: any = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

describe(`[testing ${type} storage]`, async () => {
  beforeAll(async () => {
    try {
      storage = new Storage(config);
      await storage.init();
      console.log("beforeAll");
      console.log(storage.getConfiguration());
    } catch (e) {
      console.error(e);
    }
  });

  beforeEach(() => {
    // increase this value if you experience a lot of timeouts
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  // afterEach((done) => {
  //   // Esperar 1 minuto (60,000 milisegundos) entre cada prueba.
  //   setTimeout(() => {
  //     done();
  //   }, 60000);
  // });

  afterAll(async () => {
    // await storage.clearBucket(bucketName);
    if (storage.getType() === StorageType.LOCAL) {
      // cleaning up test data
      const p = path.normalize(path.join(process.cwd(), (config as ConfigLocal).directory));
      await rimraf(p, {
        preserveRoot: false,
      })
        .then((success: boolean) => {
          console.log("\nall cleaned up!", success);
        })
        .catch((e: Error) => {
          console.log(e);
        });
    }
  });

  it("init", async () => {
    try {
      storage = new Storage(config);
      await storage.init();
    } catch (e) {
      console.error(e);
      return;
    }
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
    // console.log(storage.getSelectedBucket());
    if (storage.getType() === StorageType.S3) {
      await expectAsync(
        storage.createBucket(storage.getSelectedBucket(), {
          // ACL: "public-read-write",
          ObjectOwnership: "BucketOwnerPreferred",
        })
      ).toBeResolved();
    } else {
      await expectAsync(storage.createBucket(storage.getSelectedBucket())).toBeResolved();
    }
  });

  // it("wait it bit", async () => {
  //   await expectAsync(waitABit(2000)).toBeResolved();
  // });

  it("clear bucket", async () => {
    await expectAsync(storage.clearBucket()).toBeResolved();
  });

  it("check if bucket is empty", async () => {
    const files = await storage.listFiles().catch((e) => {
      console.log(e.message);
    });
    expect(files).toEqual([]);
  });

  it("add file success", async () => {
    if (storage.getType() === StorageType.S3) {
      // const url = await storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg", {
      //   Expires: new Date(2025, 11, 17),
      // });
      // console.log(url);
      // expect(url).toBeTruthy();
      await expectAsync(
        storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg", {
          Expires: new Date(2025, 11, 17),
        })
      ).toBeResolved();
    } else {
      // const url = await storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg");
      // console.log(url);
      // expect(url).toBeTruthy();
      await expectAsync(
        storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg")
      ).toBeResolved();
    }
  });

  it("add file error", async () => {
    await expectAsync(
      storage.addFileFromPath("./tests/data/non-existent.jpg", "non-existent.jpg")
    ).toBeRejected();
  });

  it("add with new name and dir", async () => {
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
    // try {
    const readStream = await storage.getFileAsReadable("image1.jpg");
    const filePath = path.join(process.cwd(), "tests", "tmp", `test-${storage.getType()}.jpg`);
    const writeStream = fs.createWriteStream(filePath);
    await copyFile(readStream, writeStream);
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
    // const expectedResult: [string, number][] = [
    //   ["image1.jpg", 32201],
    //   ["image2.jpg", 42908],
    //   ["image3.jpg", 42908],
    // ];
    // await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
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
      r = msg !== "" && msg !== "ok";
      // console.log("msg:", msg);
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
    const msg = await storage.deleteBucket();
    expect(storage.getSelectedBucket()).toBe("");
    const buckets = await storage.listBuckets();
    const index = buckets.indexOf(newBucketName);
    expect(index).toBe(-1);
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
