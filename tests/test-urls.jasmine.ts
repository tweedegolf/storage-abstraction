import { Storage } from "../src/Storage";
import "jasmine";
import { StorageType } from "../src/types";

const urlsGoogle = [
  "gcs://keyFile.json:appName/the-buck",
  "gcs://keyFile.json:appName/",
  "gcs://keyFile.json:appName",
  "gcs://tests/keyFile.json/the-buck",
  "gcs://tests/keyFile.json/",
  "gcs://keyFile.json",
];

const urlsAmazon = [
  "s3://key:secret",
  "s3://key:secret?region=eu-west-2&bucketName=the-buck&sslEnabled=true",
  "s3://key:secret?buckeName=the-buck",
  "s3://key:secret?region=eu-west-2&bucketName=the-buck&sslEnabled=true&useDualstack=23&nonExistentKey=true",
];
const urlsLocal = ["local://tests/tmp/the-buck", "local://tests/tmp", ""];

describe(`testing Google urls`, () => {
  let i = 0;
  afterEach(() => {
    i++;
    // console.log(i);
  });
  beforeAll(() => {});

  it("[0]", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("[1]", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("[2]", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("[3]", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("projectId")).toBe("appIdFromTestFile");
    expect(this.storage.introspect("keyFilename")).toBe("tests/keyFile.json");
  });

  it("[4]", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appIdFromTestFile");
    expect(this.storage.introspect("keyFilename")).toBe("tests/keyFile.json");
  });

  it("[5]", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appIdFromTestFile");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });
});

describe(`testing Amazon urls`, () => {
  let i = 0;
  afterEach(() => {
    i++;
  });
  beforeAll(() => {});

  it("[0]", () => {
    this.storage = new Storage(urlsAmazon[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe(undefined);
    expect(this.storage.introspect("bucketName")).toBe(undefined);
  });

  it("[1]", () => {
    this.storage = new Storage(urlsAmazon[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("eu-west-2");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
  });

  it("[2] typo", () => {
    this.storage = new Storage(urlsAmazon[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe(undefined);
    expect(this.storage.introspect("bucketName")).toBe(undefined);
  });

  it("[3] non-existent keys and key with wrong value types", () => {
    this.storage = new Storage(urlsAmazon[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.S3);
    expect(this.storage.introspect("accessKeyId")).toBe("key present but hidden");
    expect(this.storage.introspect("secretAccessKey")).toBe("secret present but hidden");
    expect(this.storage.introspect("region")).toBe("eu-west-2");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("sslEnabled")).toBe(true);
    expect(this.storage.introspect("useDualStack")).toBe(undefined);
    expect(this.storage.introspect("nonExistentKey")).toBe(undefined);
  });
});

describe(`testing local urls`, () => {
  let i = 0;
  afterEach(() => {
    i++;
  });
  beforeAll(() => {});

  it("[0]", () => {
    this.storage = new Storage(urlsLocal[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.LOCAL);
    expect(this.storage.introspect("directory")).toBe("tests/tmp/");
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
  });

  it("[1]", () => {
    this.storage = new Storage(urlsLocal[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.LOCAL);
    expect(this.storage.introspect("directory")).toBe("tests/");
    expect(this.storage.introspect("bucketName")).toBe("tmp");
  });

  it("[2] no config", () => {
    this.storage = new Storage(urlsLocal[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.LOCAL);
    expect(this.storage.introspect("directory")).toBe("/tmp/");
    expect(this.storage.introspect("bucketName")).toBe("local-bucket");
  });
});
