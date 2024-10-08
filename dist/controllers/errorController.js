"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.logErrorOnServer = void 0;
// import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
const customError_1 = __importDefault(require("../utils/customError"));
const errorLogModel_1 = __importDefault(require("../models/errorLogModel"));
const castErrorHandler = (err) => {
    const msg = `Invalid value for ${err.path}: ${err.value}!`;
    return new customError_1.default(msg, 400);
};
const duplicateKeyErrorHandler = (err) => {
    // Unique Email is already handled by the signup function, this is just in case another unique field is added in the future
    const name = err.keyValue.name;
    const msg = `There is already a filed with name ${name}. Please use another name!`;
    return new customError_1.default(msg, 400);
};
const validationErrorHandler = (err) => {
    const errors = Object.values(err.errors).map((val) => val.message);
    const errorMessages = errors.join(". ");
    const msg = `Invalid input data: ${errorMessages}`;
    return new customError_1.default(msg, 400);
};
const handleExpiredJWT = () => {
    return new customError_1.default("Access token expired, try to login again.", 401);
};
const handleJWTError = () => {
    return new customError_1.default("Invalid Access token, try to login again.", 401);
};
const prodErrors = (res, error) => {
    if (error.isOperational) {
        res.status(error.statusCode).json({
            status: error.statusCode,
            message: error.message,
        });
    }
    else {
        //Error not coming from CustomError will fall here and should not be client interest in production
        res.status(500).json({
            status: "error",
            message: "Something went wrong! Please try again later.",
        });
    }
};
const devErrors = (res, error) => {
    res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
        stackTrace: error.stack,
        error: error,
    });
};
const logErrorOnServer = async (interceptedAt, error, req = null) => {
    const tenantId = req?.tenantId;
    const userEmail = req?.userEmail;
    // Remove user passwords from body
    const body = req?.body;
    if (body?.password || body?.passwordConfirm) {
        ["password", "passwordConfirm"].forEach((field) => {
            if (body[field])
                body[field] = undefined;
        });
    }
    try {
        const errorLog = await errorLogModel_1.default.create({
            tenantId,
            userEmail,
            interceptedAt,
            reqHeaders: req?.headers,
            reqQuery: req?.query,
            reqBody: body,
            reqParams: req?.params,
            error: error?.message,
            createdAt: new Date(),
        });
    }
    catch (error) {
        console.log("Not able to log error on server: ", error);
    }
};
exports.logErrorOnServer = logErrorOnServer;
const globalErrorHandler = async (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";
    await (0, exports.logErrorOnServer)("Global-error-handler", error, req);
    if (process.env.NODE_ENV === "development") {
        devErrors(res, error);
    }
    else if (process.env.NODE_ENV === "production") {
        if (error.code === 11000)
            error = duplicateKeyErrorHandler(error);
        if (error.name === "TokenExpiredError")
            error = handleExpiredJWT();
        if (error.name === "JsonWebTokenError")
            error = handleJWTError();
        if (error.name === "CastError")
            error = castErrorHandler(error);
        if (error.name === "ValidationError")
            error = validationErrorHandler(error);
        prodErrors(res, error);
    }
};
exports.globalErrorHandler = globalErrorHandler;
//# sourceMappingURL=errorController.js.map