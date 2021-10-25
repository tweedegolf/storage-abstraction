import "jasmine";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";

describe(`testing Google urls`, () => {
  it("[0]", () => {
    this.storage = new Storage("gcs://tests/keyFile.json:appName@the-buck");
    expect(this.storage.getType()).toBe(StorageType.GCS);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().projectId).toBe("appName");
    expect(this.storage.getConfiguration().keyFilename).toBe("keyFile.json");
  });

  it("[1] don't use trailing slashes", () => {
    this.storage = new Storage("gcs://tests/keyFile.json:appName/");
    expect(this.storage.getType()).toBe(StorageType.GCS);
    expect(this.storage.getSelectedBucket()).toBe("");
    expect(this.storage.getConfiguration().projectId).toBe("appName/"); // this will probably yield an error at gcs
    expect(this.storage.getConfiguration().keyFilename).toBe("keyFile.json");
  });

  it("[2] bucketName is optional", () => {
    this.storage = new Storage("gcs://tests/keyFile.json:appName");
    expect(this.storage.getType()).toBe(StorageType.GCS);
    expect(this.storage.getSelectedBucket()).toBe("");
    expect(this.storage.getConfiguration().projectId).toBe("appName");
    expect(this.storage.getConfiguration().keyFilename).toBe("keyFile.json");
  });

  it("[3] don't use trailing slashes", () => {
    expect((): void => {
      const s = new Storage("gcs://tests/keyFile.json/");
    }).toThrowError("ENOTDIR: not a directory, open 'tests/keyFile.json/'");
  });

  it("[4] keyFilename is optional", () => {
    this.storage = new Storage("gcs://the-buck");
    expect(this.storage.getType()).toBe(StorageType.GCS);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().keyFilename).toBe("");
  });

  it("[4a] projectId is optional", () => {
    this.storage = new Storage("gcs://the-buck");
    expect(this.storage.getType()).toBe(StorageType.GCS);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().projectId).toBe("");
  });

  it("[4a] projectId is optional", () => {
    this.storage = new Storage("gcs://the-buck");
    expect(this.storage.getType()).toBe(StorageType.GCS);
    expect(this.storage.getSelectedBucket()).toBe("the-buck");
    expect(this.storage.getConfiguration().projectId).toBe("");
  });
});
