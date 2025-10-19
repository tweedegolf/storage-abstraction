"use strict";
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
exports.publicBucket = exports.privateBucket = exports.getSha1ForFile = exports.Color = exports.saveFile = void 0;
exports.streamToString = streamToString;
exports.timeout = timeout;
exports.stream2buffer = stream2buffer;
exports.colorLog = colorLog;
exports.logResult = logResult;
exports.getPrivateBucketName = getPrivateBucketName;
exports.getPublicBucketName = getPublicBucketName;
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const general_1 = require("../src/types/general");
/**
 * Utility function that connects a read-stream (from the storage) to a write-stream (to a local file)
 */
const saveFile = (readStream, writeStream, log = false) => {
    return new Promise((resolve, reject) => {
        readStream
            .pipe(writeStream)
            .on("error", (e) => {
            console.error("\x1b[31m", e, "\n");
            reject();
        })
            .on("finish", () => {
            if (log) {
                console.log("read finished");
            }
        });
        writeStream
            .on("error", (e) => {
            console.error("\x1b[31m", e, "\n");
            reject();
        })
            .on("finish", () => {
            if (log) {
                console.log("write finished");
            }
            resolve();
        });
    });
};
exports.saveFile = saveFile;
function streamToString(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("error", (err) => reject(err));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
}
function timeout(millis) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(() => {
                return resolve();
            }, millis);
        });
    });
}
// credits: https://stackoverflow.com/questions/14269233/node-js-how-to-read-a-stream-into-a-buffer
function stream2buffer(stream) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const _buf = Array(); // eslint-disable-line
            stream.on("data", (chunk) => _buf.push(chunk));
            stream.on("end", () => resolve(Buffer.concat(_buf)));
            stream.on("error", (err) => reject(`error converting stream - ${err}`));
        });
    });
}
var Color;
(function (Color) {
    Color["MESSAGE"] = "96m";
    Color["ERROR"] = "91m";
    Color["TEST"] = "35m";
    Color["OK"] = "32m";
})(Color || (exports.Color = Color = {}));
function colorLog(label, color, ...msg) {
    console.log(`\x1b[${color}[${label}]\x1b[0m`, ...msg);
}
function logResult(label, result, msg, options) {
    if (typeof result === "undefined") {
        console.log(`\x1b[91m[${label}]\x1b[0m No result!!` || "");
    }
    else if (result.error !== null) {
        console.log(`\x1b[91m[${label}]\x1b[0m ${result.error}`, msg || "");
    }
    else {
        console.log(`\x1b[96m[${label}]\x1b[0m`, msg || result.value, options || "");
    }
}
const getSha1ForFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto_1.default.createHash('sha1');
        const stream = fs_1.default.createReadStream(filePath);
        stream.on('data', (chunk) => {
            hash.update(chunk);
        });
        stream.on('end', () => {
            const sha1sum = hash.digest('hex');
            resolve(sha1sum);
        });
        stream.on('error', (err) => {
            reject(err);
        });
    });
};
exports.getSha1ForFile = getSha1ForFile;
exports.privateBucket = "sab-test-private";
exports.publicBucket = "sab-test-public";
function getPrivateBucketName(type) {
    // Azure needs more time to delete a bucket
    if (type === general_1.Provider.AZURE) {
        return `${exports.privateBucket}-${Date.now()}`;
    }
    return exports.privateBucket;
}
function getPublicBucketName(type) {
    // Azure needs more time to delete a bucket
    if (type === general_1.Provider.AZURE) {
        return `${exports.publicBucket}-${Date.now()}`;
    }
    return exports.publicBucket;
}
//# sourceMappingURL=util.js.map