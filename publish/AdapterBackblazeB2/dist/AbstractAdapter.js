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
            const p = config.indexOf("://");
            if (p !== -1) {
                // strip the type, we don't need it anymore at this point
                config = config.substring(p);
            }
            this._config = (0, util_1.parseQueryString)(config);
        }
        else {
            this._config = Object.assign({}, config);
        }
    }
    get type() {
        return this._type;
    }
    getType() {
        return this.type;
    }
    get config() {
        return this._config;
    }
    getConfig() {
        return this.config;
    }
    get configError() {
        return this._configError;
    }
    getConfigError() {
        return this.configError;
    }
    // eslint-disable-next-line
    get serviceClient() {
        return this._client;
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