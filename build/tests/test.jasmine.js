"use strict";
// require("jasmine");
// const fs = require("fs");
// const path = require("path");
// const { Readable } = require("stream");
// const { Provider, StorageAdapterConfig } = require("../src/types/general");
// const { saveFile } = require("./util");
// const { getConfig } = require("./config");
// const { CloudStorage } = require("../src/Storage");
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("jasmine");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const general_1 = require("../src/types/general");
const util_1 = require("./util");
const config_1 = require("./config");
const Storage_1 = require("../src/Storage");
let provider = general_1.Provider.LOCAL;
if (process.argv[5]) {
    provider = process.argv[5];
}
// console.log(provider);
const config = (0, config_1.getConfig)(provider);
const newBucketName1 = "bucket-test-sab-1";
const newBucketName2 = "bucket-test-sab-2";
let storage;
let bucketName;
const waitABit = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (millis = 100) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // console.log(`just wait a bit (${millis}ms)`);
            resolve();
        }, millis);
    });
});
function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("error", (err) => reject(err));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
}
describe(`[testing ${provider}]`, () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // create a temporary working directory
        if (provider !== general_1.Provider.LOCAL) {
            yield fs_1.default.promises
                .stat(path_1.default.join(process.cwd(), "tests", "test_directory"))
                .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
                yield fs_1.default.promises.mkdir(path_1.default.join(process.cwd(), "tests", "test_directory"));
                // console.log(e);
            }));
        }
        try {
            storage = new Storage_1.Storage(config);
            // bucketName = storage.config.bucketName || newBucketName1;
            bucketName = newBucketName1;
            // console.log("beforeAll");
            console.log(storage.config);
            // console.log("bucketName", bucketName);
        }
        catch (e) {
            console.error(e);
        }
    }));
    beforeEach(() => {
        // increase this value if you experience a lot of timeouts
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    });
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // const p = path.normalize(path.join(process.cwd(), "tests", "test_directory"));
        // await rimraf(p, {
        //   preserveRoot: false,
        // });
    }));
    let bucketExists;
    it("(0) delete possible existing test buckets", () => __awaiter(void 0, void 0, void 0, function* () {
        yield storage.deleteBucket(newBucketName1);
        yield storage.deleteBucket(newBucketName2);
    }));
    it("(1) check if bucket exists", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.bucketExists(bucketName);
        expect(value).not.toBeNull();
        expect(error).toBeNull();
        if (value !== null) {
            bucketExists = value;
        }
    }));
    it("(2) create bucket", () => __awaiter(void 0, void 0, void 0, function* () {
        if (bucketExists === false) {
            const { value, error } = yield storage.createBucket(bucketName, {});
            expect(value).not.toBeNull();
            expect(error).toBeNull();
        }
    }));
    it("(3) clear bucket", () => __awaiter(void 0, void 0, void 0, function* () {
        if (bucketExists === true) {
            const { value, error } = yield storage.clearBucket(bucketName);
            expect(value).not.toBeNull();
            expect(error).toBeNull();
        }
    }));
    // it("wait it bit", async () => {
    //   await expectAsync(waitABit(2000)).toBeResolved();
    // });
    it("(4) check if bucket is empty", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({ value: [], error: null });
    }));
    it("(5) add file success", () => __awaiter(void 0, void 0, void 0, function* () {
        let value;
        let error;
        if (storage.getProvider() === general_1.Provider.S3) {
            ({ value, error } = yield storage.addFileFromPath({
                bucketName,
                origPath: "./tests/data/image1.jpg",
                targetPath: "image1.jpg",
                options: {
                    Expires: new Date(2025, 11, 17),
                },
            }));
        }
        else {
            ({ value, error } = yield storage.addFileFromPath({
                bucketName,
                origPath: "./tests/data/image1.jpg",
                targetPath: "image1.jpg",
            }));
        }
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(6) add file error", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.addFileFromPath({
            bucketName,
            origPath: "./tests/data/non-existent.jpg",
            targetPath: "non-existent.jpg",
        });
        expect(value).toBeNull();
        expect(error).not.toBeNull();
    }));
    it("(7) add with new name and directory/prefix", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.addFileFromPath({
            bucketName,
            origPath: "./tests/data/image1.jpg",
            targetPath: "subdir/renamed.jpg",
        });
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(8) list files 1", () => __awaiter(void 0, void 0, void 0, function* () {
        const expectedResult = [
            ["image1.jpg", 32201],
            ["subdir/renamed.jpg", 32201],
        ];
        yield expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({
            value: expectedResult,
            error: null,
        });
    }));
    it("(9) remove file success", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.removeFile(bucketName, "subdir/renamed.jpg");
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(10) remove file again", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.removeFile(bucketName, "subdir/renamed.jpg");
        // console.log(type, value, error);
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(11) list files 2", () => __awaiter(void 0, void 0, void 0, function* () {
        const expectedResult = [["image1.jpg", 32201]];
        yield expectAsync(storage.listFiles(bucketName)).toBeResolvedTo({
            value: expectedResult,
            error: null,
        });
    }));
    it("(12) get readable stream", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.getFileAsStream(bucketName, "image1.jpg");
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(13) get readable stream error", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.getFileAsStream(bucketName, "image2.jpg");
        expect(value).toBeNull();
        expect(error).not.toBeNull();
        // console.log(error);
    }));
    it("(14) get readable stream and save file", () => __awaiter(void 0, void 0, void 0, function* () {
        // try {
        const { value, error } = yield storage.getFileAsStream(bucketName, "image1.jpg");
        const filePath = path_1.default.join(process.cwd(), "tests", "test_directory", `test-${storage.getProvider()}.jpg`);
        const writeStream = fs_1.default.createWriteStream(filePath);
        expect(value).not.toBeNull();
        expect(error).toBeNull();
        if (value !== null) {
            // value is a readstream
            yield (0, util_1.saveFile)(value, writeStream);
        }
        // } catch (e) {
        //   throw e;
        // }
    }));
    it("(15) get readable stream partially and save file", () => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = path_1.default.join(process.cwd(), "tests", "test_directory", `test-${storage.getProvider()}-part.jpg`);
        const { value, error } = yield storage.getFileAsStream(bucketName, "image1.jpg", { end: 2999 });
        expect(value).not.toBeNull();
        expect(error).toBeNull();
        if (value !== null) {
            const readStream = value;
            const writeStream = fs_1.default.createWriteStream(filePath);
            yield (0, util_1.saveFile)(readStream, writeStream);
            const size = (yield fs_1.default.promises.stat(filePath)).size;
            expect(size).toBe(3000);
        }
    }));
    it("(16) add file from stream", () => __awaiter(void 0, void 0, void 0, function* () {
        const stream = fs_1.default.createReadStream("./tests/data/image2.jpg");
        const { value, error } = yield storage.addFileFromStream({
            bucketName,
            stream,
            targetPath: "image2.jpg",
        });
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(17) add file from stream partial", () => __awaiter(void 0, void 0, void 0, function* () {
        const stream = fs_1.default.createReadStream("./tests/data/image2.jpg");
        const { value, error } = yield storage.addFileFromStream({
            bucketName,
            stream,
            targetPath: "image2p.jpg",
            options: { start: 0, end: 3000 },
        });
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(18) add file from buffer", () => __awaiter(void 0, void 0, void 0, function* () {
        const buffer = yield fs_1.default.promises.readFile("./tests/data/image2.jpg");
        const { value, error } = yield storage.addFileFromBuffer({
            bucketName,
            buffer,
            targetPath: "image3.jpg",
        });
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(19) list files 3", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value: files, error } = yield storage.listFiles(bucketName);
        expect(files).not.toBeNull();
        expect(error).toBeNull();
        if (files !== null) {
            expect(files.findIndex(([a, b]) => a === "image1.jpg" && b === 32201) !== -1).toBeTrue();
            expect(files.findIndex(([a, b]) => a === "image2.jpg" && b === 42908) !== -1).toBeTrue();
            expect(files.findIndex(([a, b]) => a === "image3.jpg" && b === 42908) !== -1).toBeTrue();
        }
    }));
    it("(20) add & read file from storage", () => __awaiter(void 0, void 0, void 0, function* () {
        const buffer = yield fs_1.default.promises.readFile("./tests/data/input.txt");
        expect(buffer).not.toBeUndefined();
        expect(buffer).not.toBeNull();
        const { value, error } = yield storage.addFileFromBuffer({
            bucketName,
            buffer,
            targetPath: "input.txt",
        });
        expect(value).not.toBeNull();
        expect(error).toBeNull();
        const { value: value1, error: error1 } = yield storage.getFileAsStream(bucketName, "input.txt");
        expect(value1).not.toBeNull();
        expect(error1).toBeNull();
        if (value1 !== null) {
            const data = yield streamToString(value1);
            expect(data).toEqual("hello world");
        }
    }));
    it("(21) sizeOf", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expectAsync(storage.sizeOf(bucketName, "image1.jpg")).toBeResolvedTo({
            value: 32201,
            error: null,
        });
    }));
    it("(22) check if file exists: yes", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expectAsync(storage.fileExists(bucketName, "image1.jpg")).toBeResolvedTo({
            value: true,
            error: null,
        });
    }));
    it("(23) check if file exists: nope", () => __awaiter(void 0, void 0, void 0, function* () {
        yield expectAsync(storage.fileExists(bucketName, "image10.jpg")).toBeResolvedTo({
            value: false,
            error: null,
        });
    }));
    it("(24) create bucket error", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.createBucket("");
        expect(value).toBeNull();
        expect(error).not.toBeNull();
    }));
    it("(25) create bucket error", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.createBucket("null");
        expect(value).toBeNull();
        expect(error).not.toBeNull();
    }));
    it("(26) create bucket error", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.createBucket("undefined");
        expect(value).toBeNull();
        expect(error).not.toBeNull();
    }));
    it("(27) create bucket", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.createBucket(newBucketName2);
        if (error) {
            console.log(error);
        }
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(28) check created bucket", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.listBuckets();
        expect(value).not.toBeNull();
        expect(error).toBeNull();
        if (value !== null) {
            const buckets = value;
            const index = buckets.indexOf(newBucketName2);
            expect(index).toBeGreaterThan(-1);
        }
    }));
    it("(29) add file to new bucket", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.addFileFromPath({
            bucketName: newBucketName2,
            origPath: "./tests/data/image1.jpg",
            targetPath: "image1.jpg",
        });
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(30) list files in new bucket", () => __awaiter(void 0, void 0, void 0, function* () {
        const expectedResult = [["image1.jpg", 32201]];
        yield expectAsync(storage.listFiles(newBucketName2)).toBeResolvedTo({
            value: expectedResult,
            error: null,
        });
    }));
    it("(31) delete non-empty bucket", () => __awaiter(void 0, void 0, void 0, function* () {
        // S3 doesn't allow you to delete a non-empty bucket
        // if (storage.getProvider() !== Provider.S3) {
        // }
        // const { value: v, error: e } = await storage.clearBucket(newBucketName1);
        // console.log(v, e)
        // const { value: v2, error: e2 } = await storage.listFiles(newBucketName1);
        // console.log(v2, e2)
        const { value, error } = yield storage.deleteBucket(newBucketName1);
        // console.log(value, error);
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(32) check if bucket has been deleted", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.listBuckets();
        expect(value).not.toBeNull();
        expect(error).toBeNull();
        if (value !== null) {
            const buckets = value;
            const index = buckets.indexOf(newBucketName1);
            expect(index).toBe(-1);
        }
    }));
    it("(33) delete non-empty bucket 2", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.deleteBucket(newBucketName2);
        expect(value).not.toBeNull();
        expect(error).toBeNull();
    }));
    it("(32) check if bucket 2 has been deleted", () => __awaiter(void 0, void 0, void 0, function* () {
        const { value, error } = yield storage.listBuckets();
        expect(value).not.toBeNull();
        expect(error).toBeNull();
        if (value !== null) {
            const buckets = value;
            const index = buckets.indexOf(newBucketName2);
            expect(index).toBe(-1);
        }
    }));
});
//# sourceMappingURL=test.jasmine.js.map