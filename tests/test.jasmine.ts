import fs from "fs";
import path from "path";
import rimraf from "rimraf";
import dotenv from "dotenv";
import { Storage } from "../src/Storage";
import to from "await-to-js";
import "jasmine";
import {
  StorageConfig,
  StorageType,
  ConfigLocal,
  ConfigGoogleCloud,
  ConfigAmazonS3,
} from "../src/types";
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
  } as ConfigLocal;
} else if (type === StorageType.GCS && keyFilename) {
  config = {
    type,
    bucketName,
    projectId,
    keyFilename,
  } as ConfigGoogleCloud;
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
  } as ConfigAmazonS3;
}

console.log("CONFIG", config);
if (config === null) {
  console.error("\x1b[31m[ERROR] No valid config");
  process.exit(0);
}

const storage = new Storage(config);
// console.log(storage.introspect());

describe(`testing ${storage.getType()} storage`, () => {
  beforeEach(() => {
    // increase this value if you experience a lot of timeouts
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  afterAll(async () => {
    // cleaning up test data
    const testFile = path.join(process.cwd(), `test-${storage.getType()}.jpg`);
    fs.promises
      .stat(path.join(testFile))
      .then(() => fs.promises.unlink(testFile))
      .catch(e => {
        console.log(e);
      });

    // cleanup local-bucket (assuming that you don't want to keep it)
    if (storage.getType() === StorageType.LOCAL && storage.getSelectedBucket() === "local-bucket") {
      await new Promise((resolve, reject) => {
        rimraf(path.join(directory, "local-bucket"), (e: Error) => {
          if (e) {
            reject();
            throw e;
          } else {
            resolve();
          }
        });
      });
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

  xit("create bucket", async () => {
    await expectAsync(storage.createBucket(storage.getSelectedBucket())).toBeResolved();
  });

  xit("clear bucket", async () => {
    await expectAsync(storage.clearBucket()).toBeResolved();
  });

  xit("add file success", async () => {
    await expectAsync(
      storage.addFileFromPath("./tests/data/image1.jpg", "image1.jpg")
    ).toBeResolved();
  });

  xit("add file error", async () => {
    await expectAsync(
      storage.addFileFromPath("./tests/data/non-existent.jpg", "non-existent.jpg")
    ).toBeRejected();
  });

  xit("add with new name and dir", async () => {
    // const [err, result] = await to(storage.addFileFromPath('./tests/data/image1.jpg', {
    //   dir: 'subdir',
    //   name: 'renamed.jpg',
    // }));

    await expectAsync(
      storage.addFileFromPath("./tests/data/image1.jpg", "subdir/renamed.jpg")
    ).toBeResolved();
  });

  // it('wait a bit', async () => {
  //   await new Promise((resolve) => {
  //     setTimeout(resolve, 1000);
  //   });
  // });

  xit("list files 1", async () => {
    const expectedResult: [string, number][] = [
      ["image1.jpg", 32201],
      ["subdir/renamed.jpg", 32201],
    ];
    await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
  });

  xit("remove file success", async () => {
    // const [err, result] = await to(storage.removeFile('subdir/renamed.jpg'));
    // console.log(err, result);
    await expectAsync(storage.removeFile("subdir/renamed.jpg")).toBeResolved();
  });

  xit("remove file again", async () => {
    await expectAsync(storage.removeFile("subdir/renamed.jpg")).toBeResolved();
  });

  xit("list files 2", async () => {
    const expectedResult: [string, number][] = [["image1.jpg", 32201]];
    await expectAsync(storage.listFiles()).toBeResolvedTo(expectedResult);
  });

  xit("get readable stream", async () => {
    await expectAsync(storage.getFileAsReadable("image1.jpg")).toBeResolved();
  });

  xit("get readable stream error", async () => {
    await expectAsync(storage.getFileAsReadable("image2.jpg")).toBeRejected();
  });

  xit("get readable stream and save file", async () => {
    try {
      const readStream = await storage.getFileAsReadable("image1.jpg");
      const filePath = path.join(process.cwd(), `test-${storage.getType()}.jpg`);
      const writeStream = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        readStream
          .pipe(writeStream)
          .on("error", (e: Error) => {
            // console.log("read", e.message);
            reject();
          })
          .on("finish", () => {
            // console.log("read finish");
            resolve();
          });

        writeStream
          .on("error", (e: Error) => {
            // console.log("write", e.message);
            reject();
          })
          .on("finish", () => {
            // console.log("write finish");
            resolve();
          });
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
});
