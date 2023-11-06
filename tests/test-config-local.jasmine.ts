// import "jasmine";
import fs from "fs";
import path from "path";
import { rimraf } from "rimraf";
import { Storage } from "../src/Storage";
import { StorageType, ConfigLocal } from "../src/types";

// describe("test jasmine", () => {
//   it("weird", () => {
//     expect("false").toBeTruthy();
//     expect("0").toBeTruthy();
//   });
// });

describe(`testing local urls`, () => {
  beforeAll(async () => {
    // override Linux's umask 0o002
    process.umask(0o000);
  });

  it("[0]", async () => {
    const storage = new Storage("local://tests/tmp/the-buck?param=value");
    await storage.init();
    expect(storage.getType()).toBe(StorageType.LOCAL);
    expect(storage.getSelectedBucket()).toBe("the-buck");
  });
  it("[0a]", async () => {
    const storage = new Storage("local://the-buck?param=value");
    await storage.init();
    expect(storage.getType()).toBe(StorageType.LOCAL);
    expect(storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[1]", async () => {
    const storage = new Storage("local://tests/tmp");
    await storage.init();
    expect(storage.getSelectedBucket()).toBe("tmp");
  });

  it("[2] store in folder where process runs", async () => {
    const storage = new Storage(`local://${process.cwd()}/the-buck`);
    await storage.init();
    expect(storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[3]", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp/the-buck",
    });
    await storage.init();
    expect(storage.getType()).toBe(StorageType.LOCAL);
    expect(storage.getSelectedBucket()).toBe("the-buck");
  });

  it("[4]", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
    });
    await storage.init();
    expect(storage.getType()).toBe(StorageType.LOCAL);
    expect(storage.getSelectedBucket()).toBe("tmp");
  });

  it("[5] numeric values in options stay numeric and keep their radix (8)", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      mode: 0o777,
    });
    await storage.init();
    expect((storage.getConfiguration() as ConfigLocal).mode).toBe(0o777);
  });

  it("[5b] numeric values in options stay numeric and keep their radix (10)", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      mode: 511,
    });
    await storage.init();
    expect((storage.getConfiguration() as ConfigLocal).mode).toBe(511);
  });

  it("[6] string values in options stay string values (will be converted when used in code when necessary)", async () => {
    const storage = new Storage("local://tests/tmp?mode=0o777");
    await storage.init();
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect((storage.getConfiguration() as ConfigLocal).mode).toBe("0o777");
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode.toString(8)).toBe("40777");
    await rimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6a]", async () => {
    const storage = new Storage("local://tests/tmp?mode=777");
    await storage.init();
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect((storage.getConfiguration() as ConfigLocal).mode).toBe("777");
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode.toString(8)).toBe("40777");
    await rimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6c] octal numbers get converted to radix 10", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      mode: 0o777,
    });
    await storage.init();
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect((storage.getConfiguration() as ConfigLocal).mode).toBe(511);
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode.toString(8)).toBe("40777");
    await rimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6d]", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      mode: 511,
    });
    await storage.init();
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect((storage.getConfiguration() as ConfigLocal).mode).toBe(511);
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode.toString(8)).toBe("40777");
    await rimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  it("[6e]", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      mode: "0o777",
    });
    await storage.init();
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect((storage.getConfiguration() as ConfigLocal).mode).toBe("0o777");
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode.toString(8)).toBe("40777");
    await rimraf(path.join(process.cwd(), "tests", "tmp"));
  });

  // pass octal value as string
  it("[6f]", async () => {
    const storage = new Storage({
      type: StorageType.LOCAL,
      directory: "tests/tmp",
      mode: "755", // this is an error! the parseMode function will return the default value 0o777
    });
    await storage.init();
    expect(storage.getSelectedBucket()).toBe("tmp");
    expect((storage.getConfiguration() as ConfigLocal).mode).toBe("755");
    const mode = (await fs.promises.stat(path.join(process.cwd(), "tests", "tmp"))).mode;
    expect(mode.toString(8)).toBe("40777");
    await rimraf(path.join(process.cwd(), "tests", "tmp"));
  });
});
