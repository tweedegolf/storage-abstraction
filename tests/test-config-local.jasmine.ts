import "jasmine";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";

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
});
