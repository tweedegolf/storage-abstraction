"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
require("jasmine");
var Storage_1 = require("../src/Storage");
var types_1 = require("../src/types");
describe("testing Google urls", function () {
    it("[0]", function () {
        _this.storage = new Storage_1.Storage("gcs://tests/keyFile.json:appName@the-buck");
        expect(_this.storage.getType()).toBe(types_1.StorageType.GCS);
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().projectId).toBe("appName");
        expect(_this.storage.getConfiguration().keyFilename).toBe("keyFile.json");
    });
    it("[1] don't use trailing slashes", function () {
        _this.storage = new Storage_1.Storage("gcs://tests/keyFile.json:appName/");
        expect(_this.storage.getType()).toBe(types_1.StorageType.GCS);
        expect(_this.storage.getSelectedBucket()).toBe("");
        expect(_this.storage.getConfiguration().projectId).toBe("appName/"); // this will probably yield an error at gcs
        expect(_this.storage.getConfiguration().keyFilename).toBe("keyFile.json");
    });
    it("[2] bucketName is optional", function () {
        _this.storage = new Storage_1.Storage("gcs://tests/keyFile.json:appName");
        expect(_this.storage.getType()).toBe(types_1.StorageType.GCS);
        expect(_this.storage.getSelectedBucket()).toBe("");
        expect(_this.storage.getConfiguration().projectId).toBe("appName");
        expect(_this.storage.getConfiguration().keyFilename).toBe("keyFile.json");
    });
    it("[3] don't use trailing slashes", function () {
        expect(function () {
            var s = new Storage_1.Storage("gcs://tests/keyFile.json/");
        }).toThrowError("ENOTDIR: not a directory, open 'tests/keyFile.json/'");
    });
    it("[4] keyFilename is optional", function () {
        _this.storage = new Storage_1.Storage("gcs://the-buck");
        expect(_this.storage.getType()).toBe(types_1.StorageType.GCS);
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().keyFilename).toBe("");
    });
    it("[4a] projectId is optional", function () {
        _this.storage = new Storage_1.Storage("gcs://the-buck");
        expect(_this.storage.getType()).toBe(types_1.StorageType.GCS);
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().projectId).toBe("");
    });
    it("[4a] projectId is optional", function () {
        _this.storage = new Storage_1.Storage("gcs://the-buck");
        expect(_this.storage.getType()).toBe(types_1.StorageType.GCS);
        expect(_this.storage.getSelectedBucket()).toBe("the-buck");
        expect(_this.storage.getConfiguration().projectId).toBe("");
    });
});
//# sourceMappingURL=test-config-gcs.jasmine.js.map