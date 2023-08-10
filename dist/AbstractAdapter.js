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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractAdapter = void 0;
const util_1 = require("./util");
class AbstractAdapter {
    constructor() {
        this.bucketName = "";
        this.initialized = false;
    }
    getType() {
        return this.type;
    }
    getConfiguration() {
        return this.config;
    }
    validateName(name) {
        return (0, util_1.validateName)(name);
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initialized === false) {
                return Promise.reject("storage has not been initialized yet; call Storage.init() first");
            }
            if (this.bucketName) {
                try {
                    yield this.listFiles();
                    return Promise.resolve("ok");
                }
                catch (e) {
                    throw new Error(`Looks like the storage configuration is not correct (${e.message})`);
                }
            }
            try {
                yield this.listBuckets();
                return Promise.resolve("ok");
            }
            catch (e) {
                throw new Error(`Looks like the storage configuration is not correct (${e.message})`);
            }
        });
    }
    addFileFromPath(origPath, targetPath, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.store(origPath, targetPath, options);
        });
    }
    addFileFromBuffer(buffer, targetPath, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.store(buffer, targetPath, options);
        });
    }
    addFileFromReadable(stream, targetPath, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.store(stream, targetPath, options);
        });
    }
    getSelectedBucket() {
        return this.bucketName;
    }
}
exports.AbstractAdapter = AbstractAdapter;
//# sourceMappingURL=AbstractAdapter.js.map