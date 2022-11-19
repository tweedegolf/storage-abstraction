import "jasmine";
import { Storage } from "../src/Storage";
import { ConfigGoogleCloud, StorageType } from "../src/types";

describe(`testing Google urls`, () => {
  it("[0]", () => {
    const storage = new Storage("gcs://tests/keyFile.json:appName@the-buck");
    expect(storage.getType()).toBe(StorageType.GCS);
    expect(storage.getSelectedBucket()).toBe("the-buck");
    expect((storage.getConfiguration() as ConfigGoogleCloud).projectId).toBe("appName");
    expect((storage.getConfiguration() as ConfigGoogleCloud).keyFilename).toBe(
      "tests/keyFile.json"
    );
  });

  it("[1] don't use trailing slashes", () => {
    const storage = new Storage("gcs://tests/keyFile.json:appName/");
    expect(storage.getType()).toBe(StorageType.GCS);
    expect(storage.getSelectedBucket()).toBe("");
    expect((storage.getConfiguration() as ConfigGoogleCloud).projectId).toBe("appName/"); // this will probably yield an error at gcs
    expect((storage.getConfiguration() as ConfigGoogleCloud).keyFilename).toBe(
      "tests/keyFile.json"
    );
  });

  it("[2] bucketName is optional", () => {
    const storage = new Storage("gcs://tests/keyFile.json:appName");
    expect(storage.getType()).toBe(StorageType.GCS);
    expect(storage.getSelectedBucket()).toBe("");
    expect((storage.getConfiguration() as ConfigGoogleCloud).projectId).toBe("appName");
    expect((storage.getConfiguration() as ConfigGoogleCloud).keyFilename).toBe(
      "tests/keyFile.json"
    );
  });

  it("[3] don't use trailing slashes", () => {
    expect((): void => {
      const s = new Storage("gcs://tests/keyFile.json/");
      console.log(s.getConfiguration());
    }).toThrowError("ENOTDIR: not a directory, open 'tests/keyFile.json/'");
  });

  it("[4] keyFilename is optional", () => {
    const storage = new Storage("gcs://the-buck");
    expect(storage.getType()).toBe(StorageType.GCS);
    expect(storage.getSelectedBucket()).toBe("the-buck");
    expect((storage.getConfiguration() as ConfigGoogleCloud).keyFilename).toBe("");
  });

  it("[4a] projectId is optional", () => {
    const storage = new Storage("gcs://the-buck");
    expect(storage.getType()).toBe(StorageType.GCS);
    expect(storage.getSelectedBucket()).toBe("the-buck");
    expect((storage.getConfiguration() as ConfigGoogleCloud).projectId).toBe("");
  });

  it("[4a] projectId is optional", () => {
    const storage = new Storage("gcs://the-buck");
    expect(storage.getType()).toBe(StorageType.GCS);
    expect(storage.getSelectedBucket()).toBe("the-buck");
    expect((storage.getConfiguration() as ConfigGoogleCloud).projectId).toBe("");
  });
});
