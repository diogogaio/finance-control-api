"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//Accepts only async functions!
const asyncErroHandler = (func) => {
    return (req, res, next) => {
        func(req, res, next).catch((err) => next(err));
    };
};
exports.default = asyncErroHandler;
//# sourceMappingURL=asyncErrorHandler.js.map