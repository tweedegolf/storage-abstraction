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
    constructor(config) {
        this._type = "abstract-adapter";
        this._configError = null;
        this._client = null; // eslint-disable-line
        if (typeof config === "string") {
            const { value, error } = (0, util_1.parseUrl)(config);
            if (error) {
                this._configError = `[configError] ${error}`;
            }
            this._config = value;
        }
        else {
            this._config = Object.assign({}, config);
        }
    }
    get type() {
        return this._type;
    }
    get config() {
        return this._config;
    }
    get configError() {
        return this._configError;
    }
    // eslint-disable-next-line
    get serviceClient() {
        return this._client;
    }
    getType() {
        return this.type;
    }
    getConfigError() {
        return this.configError;
    }
    getConfiguration() {
        return this.config;
    }
    // eslint-disable-next-line
    getServiceClient() {
        return this._client;
    }
    addFileFromPath(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.addFile(params);
        });
    }
    addFileFromBuffer(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.addFile(params);
        });
    }
    addFileFromStream(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.addFile(params);
        });
    }
}
exports.AbstractAdapter = AbstractAdapter;
//# sourceMappingURL=AbstractAdapter.js.map