"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
require("jasmine");
var Storage_1 = require("../src/Storage");
var types_1 = require("../src/types");
describe("testing Amazon urls", function () {
    it("[0] no options", function () {
        _this.storage = new Storage_1.Storage("s3://key:secret/can/contain/slashes");
        expect(_this.storage.getType()).toBe(types_1.StorageType.S3);
        expect(_this.storage.getSelectedBucket()).toBe("");
        expect(_this.storage.getConfiguration().accessKeyId).toBe("key");
        expect(_this.storage.getConfiguration().secretAccessKey).toBe("secret/can/contain/slashes");
        expect(_this.storage.getConfiguration().region).toBe("");
    });
    it("[1] parameter string", function () {
        _this.storage = new Storage_1.Storage("s3://key:secret/can/contain/slashes@eu-west-2/the-buck?sslEnabled=true");
        // console.log(this.storage.getConfiguration());
        expect(_this.storage.getType()).toBe(types_1.StorageType.S3);
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().accessKeyId).toBe("key");
        expect(_this.storage.getConfiguration().secretAccessKey).toBe("secret/can/contain/slashes");
        expect(_this.storage.getConfiguration().region).toBe("eu-west-2");
        expect(_this.storage.getConfiguration().sslEnabled).toBe("true");
    });
    it("[2a] no region", function () {
        _this.storage = new Storage_1.Storage("s3://key:secret/can/contain/slashes@the-buck");
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().region).toBe("");
        expect(_this.storage.getConfiguration().bucketName).toBe("the-buck");
    });
    it("[2b] no region 2", function () {
        _this.storage = new Storage_1.Storage("s3://key:secret/can/contain/slashes@/the-buck");
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().region).toBe("");
        expect(_this.storage.getConfiguration().bucketName).toBe("the-buck");
    });
    it("[3] non-existent keys will not be filtered anymore, nor will invalid typed values (e.g. a numeric value for useDualStack)", function () {
        _this.storage = new Storage_1.Storage([
            "s3://key:secret/can/contain/slashes@eu-west-2/the-buck",
            "?sslEnabled=true",
            "&useDualstack=23",
            "&nonExistentKey=true",
            "&endPoint=https://kms-fips.us-west-2.amazonaws.com", // note: endpoint should not be camel cased
        ].join(""));
        expect(_this.storage.getType()).toBe(types_1.StorageType.S3);
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().accessKeyId).toBe("key");
        expect(_this.storage.getConfiguration().secretAccessKey).toBe("secret/can/contain/slashes");
        expect(_this.storage.getConfiguration().region).toBe("eu-west-2");
        expect(_this.storage.getConfiguration().sslEnabled).toBe("true");
        expect(_this.storage.getConfiguration().useDualStack).toBe(undefined);
        expect(_this.storage.getConfiguration().nonExistentKey).toBe("true");
        expect(_this.storage.getConfiguration().endpoint).toBe(undefined);
        expect(_this.storage.getConfiguration().endPoint).toBe("https://kms-fips.us-west-2.amazonaws.com");
    });
    it("[4] object", function () {
        _this.storage = new Storage_1.Storage({
            type: "s3",
            accessKeyId: "key",
            secretAccessKey: "secret/can/contain/slashes",
            region: "eu-west-2",
            bucketName: "the-buck",
            sslEnabled: true,
        });
        expect(_this.storage.getType()).toBe(types_1.StorageType.S3);
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().accessKeyId).toBe("key");
        expect(_this.storage.getConfiguration().secretAccessKey).toBe("secret/can/contain/slashes");
        expect(_this.storage.getConfiguration().region).toBe("eu-west-2");
        expect(_this.storage.getConfiguration().sslEnabled).toBe(true);
    });
    it("[5] no bucket", function () {
        _this.storage = new Storage_1.Storage({
            type: "s3",
            accessKeyId: "key",
            secretAccessKey: "secret/can/contain/slashes",
        });
        expect(_this.storage.getSelectedBucket()).toBe("");
    });
    it("[5a] no bucket URL", function () {
        _this.storage = new Storage_1.Storage("s3://key:secret/can/contain/slashes@eu-west-2");
        expect(_this.storage.getSelectedBucket()).toBe("eu-west-2");
        expect(_this.storage.getConfiguration().region).not.toBe("eu-west-2");
    });
    it("[5a1] no bucket URL", function () {
        _this.storage = new Storage_1.Storage("s3://key:secret/can/contain/slashes@eu-west-2/");
        expect(_this.storage.getSelectedBucket()).toBe("");
        expect(_this.storage.getConfiguration().region).toBe("eu-west-2");
    });
    it("[5b] no bucket URL plus queryString", function () {
        _this.storage = new Storage_1.Storage("s3://key:secret/can/contain/slashes@eu-west-2/?sslEnabled=true");
        expect(_this.storage.getSelectedBucket()).toBe("");
        expect(_this.storage.getConfiguration().region).toBe("eu-west-2");
        expect(_this.storage.getConfiguration().sslEnabled).toBe("true");
    });
    it("[5b1] no bucket URL plus queryString", function () {
        _this.storage = new Storage_1.Storage("s3://key:secret/can/contain/slashes@eu-west-2?sslEnabled=true");
        expect(_this.storage.getSelectedBucket()).toBe("eu-west-2");
        expect(_this.storage.getConfiguration().region).not.toBe("eu-west-2");
        expect(_this.storage.getConfiguration().sslEnabled).toBe("true");
    });
    it("[6] number and boolean in config object keep their original type", function () {
        _this.storage = new Storage_1.Storage({
            type: "s3",
            accessKeyId: "key",
            secretAccessKey: "secret/can/contain/slashes",
            optionNumber: 42,
            optionBoolean: true,
        });
        expect(_this.storage.getConfiguration().optionNumber).toBe(42);
        expect(_this.storage.getConfiguration().optionBoolean).toBe(true);
    });
    it("[7] number and boolean used in config will stay string types", function () {
        _this.storage = new Storage_1.Storage(["s3://key:secret/can/contain/slashes", "?optionNumber=42", "&optionBoolean=true"].join(""));
        expect(_this.storage.getConfiguration().optionNumber).toBe("42");
        expect(_this.storage.getConfiguration().optionBoolean).toBe("true");
    });
});
//# sourceMappingURL=test-config-s3.jasmine.js.map