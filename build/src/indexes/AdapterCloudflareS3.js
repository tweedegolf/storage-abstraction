"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdapterCloudflareS3 = void 0;
var AdapterCloudflareS3_1 = require("../AdapterCloudflareS3");
Object.defineProperty(exports, "AdapterCloudflareS3", { enumerable: true, get: function () { return AdapterCloudflareS3_1.AdapterCloudflareS3; } });
__exportStar(require("../types/adapter_amazon_s3"), exports);
__exportStar(require("../types/general"), exports);
__exportStar(require("../types/result"), exports);
__exportStar(require("../types/add_file_params"), exports);
//# sourceMappingURL=AdapterCloudflareS3.js.map