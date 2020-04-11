import "jasmine";
import fs from "fs";
import path from "path";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";
import { promiseRimraf } from "./util";

// describe("test jasmine", () => {
//   it("weird", () => {
//     expect("false").toBeTruthy();
//     expect("0").toBeTruthy();
//   });
// });

describe(`testing local urls`, () => {
  it("[0]", () => {
    this.storage = new Storage("local://tests/tmp?bucketName=the-buck");
    expect(this.storage.getType()).toBe(StorageType.LOCAL);
    expect(this.storage.getConfiguration().directory).toBe("tests/tmp");
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[1]", () => {
    this.storage = new Storage("local://tests/tmp");
    expect(this.storage.getSelectedBucket()).toBe("tmp");
  });

  it("[2] store in folder where process runs", () => {
    this.storage = new Storage(`local://${process.cwd()}/the-buck`);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[3]", () => {
    this.storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      bucketName: "the-buck",
    });
    expect(this.storage.getType()).toBe(StorageType.LOCAL);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[4]", () => {
    this.storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
    });
    expect(this.storage.getType()).toBe(StorageType.LOCAL);
    expect(this.storage.getSelectedBucket()).toBe("tmp");
  });

  it("[5] numeric values in options stay numeric and keep their radix (8)", () => {
    this.storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      options: {
        mode: 0o777,
      },
    });
    expect(this.storage.getOptions().mode).toBe(0o777);
  });

  it("[5b] numeric values in options stay numeric and keep their radix (10)", () => {
    this.storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      options: {
        mode: 511,
      },
    });
    expect(this.storage.getOptions().mode).toBe(511);
  });

  it("[6] string values in options stay string values (will be converted when used in code when necessary)", async () => {
    const storage = new Storage("local://tests/tmp?mode=0o777");
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect(storage.getOptions().mode).toBe("0o777");
    try {
      await storage.init();
    } catch (e) {
      console.error(`\x1b[31m${e.message}`);
      process.exit(0);
    }
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode).toBe(16877);
    await promiseRimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6a]", async () => {
    const storage = new Storage("local://tests/tmp?mode=777");
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect(storage.getOptions().mode).toBe("777");
    await storage.init();
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode).toBe(16877);
    await promiseRimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6c] octal numbers get converted to radix 10", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      options: {
        mode: 0o777,
      },
    });
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect(storage.getOptions().mode).toBe(511);
    await storage.init();
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode).toBe(16877);
    await promiseRimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6d]", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      options: {
        mode: 511,
      },
    });
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect(storage.getOptions().mode).toBe(511);
    await storage.init();
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode).toBe(16877);
    await promiseRimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6e]", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      options: {
        mode: "0o777",
      },
    });
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect(storage.getOptions().mode).toBe("0o777");
    await storage.init();
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode).toBe(16877);
    await promiseRimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6f]", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      options: {
        mode: "777",
      },
    });
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect(storage.getOptions().mode).toBe("777");
    await storage.init();
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode).toBe(16877);
    await promiseRimraf(path.join(process.cwd(), "tests", "tmp"));
  });
});
