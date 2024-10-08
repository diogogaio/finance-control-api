"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xss_1 = __importDefault(require("xss"));
const sanitizeData = (data) => {
    if (typeof data === "string") {
        return (0, xss_1.default)(data);
    }
    else if (typeof data === "object" && data !== null) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                data[key] = sanitizeData(data[key]);
            }
        }
    }
    return data;
};
const sanitizeRequest = (req, res, next) => {
    req.body = sanitizeData(req.body);
    req.query = sanitizeData(req.query);
    req.params = sanitizeData(req.params);
    next();
};
exports.default = sanitizeRequest;
//# sourceMappingURL=sanitize.js.map