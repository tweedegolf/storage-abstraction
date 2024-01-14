"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableAdapters = exports.adapterFunctions = exports.adapterClasses = exports.StorageType = exports.Storage = void 0;
const Storage_1 = require("../Storage");
Object.defineProperty(exports, "Storage", { enumerable: true, get: function () { return Storage_1.Storage; } });
const adapters_1 = require("../adapters");
Object.defineProperty(exports, "adapterClasses", { enumerable: true, get: function () { return adapters_1.adapterClasses; } });
Object.defineProperty(exports, "adapterFunctions", { enumerable: true, get: function () { return adapters_1.adapterFunctions; } });
Object.defineProperty(exports, "getAvailableAdapters", { enumerable: true, get: function () { return adapters_1.getAvailableAdapters; } });
const general_1 = require("../types/general");
Object.defineProperty(exports, "StorageType", { enumerable: true, get: function () { return general_1.StorageType; } });
//# sourceMappingURL=Storage.js.map