import fs from "fs";
import os from "os";
import path from "path";
import rimraf from "rimraf";
import slugify from "slugify";
import dotenv from "dotenv";
import { Storage } from "../src/Storage";
import to from "await-to-js";
import "jasmine";
import {
  IStorage,
  StorageConfig,
  StorageType,
  ConfigLocal,
  ConfigGoogleCloud,
  ConfigAmazonS3,
} from "../src/types";
dotenv.config();

const urlsGoogle = [
  "gcs://keyFile.json:appName/the-buck",
  "gcs://keyFile.json:appName/",
  "gcs://keyFile.json:appName",
  "gcs://tests/keyFile.json/",
  "gcs://keyFile.json",
];

const urlsAmazon = [
  "s3://key:secret@eu-west-2/the-buck",
  "s3://key:secret@eu-west-2/",
  "s3://key:secret@eu-west-2",
  "s3://key:secret@eu-west-2/the-buck?sslEnabled=true",
  "s3://key:secret@/the-buck",
  "s3://key:secret@/the-buck",
];
const urlsLocal = ["local://tests/tmp/the-buck", "local://tests/tmp", ""];

describe(`testing Google urls`, () => {
  let i = 0;
  afterEach(() => {
    i++;
    // console.log(i);
  });
  beforeAll(() => {});

  it("url 0 config", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("the-buck");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("url 1 config", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("url 2 config", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appName");
    expect(this.storage.introspect("keyFilename")).toBe("keyFile.json");
  });

  it("url 3 config", () => {
    this.storage = new Storage(urlsGoogle[i]);
    expect(this.storage.introspect("type")).toBe(StorageType.GCS);
    expect(this.storage.introspect("bucketName")).toBe("");
    expect(this.storage.introspect("projectId")).toBe("appIdFromFile");
    expect(this.storage.introspect("keyFilename")).toBe("tests/keyFile.json");
  });
});
