"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
        this.isOperational = true; //see more below
        Error.captureStackTrace(this, this.constructor);
        //Captures the stack trace for the error, omitting the constructor call from the trace.
    }
}
exports.default = CustomError;
// Usage example
// const error = new CustomError("some error message", 404);
// 1. Operational Errors
// Operational errors are runtime problems that can reasonably be expected to happen during normal operation of the application. These errors are often due to external factors and are not bugs in the code. Examples include:
// Network issues (e.g., failing to reach a database server)
// File not found
// Invalid user input
// Permission issues
// Timeout errors
// Characteristics:
// Often recoverable.
// Expected and should be handled gracefully.
// Can be mitigated by retrying the operation or providing fallback logic.
// 2. Programming Errors
// Programming errors are bugs in the code. These errors indicate a defect in the program itself, such as logical flaws or incorrect use of an API. Examples include:
// Undefined variable access
// Null reference errors
// Logic errors
// Syntax errors
// Type errors
// Characteristics:
// Often not recoverable at runtime.
// Indicate a need to fix the code.
// Unexpected and often should not happen in properly tested and validated code.
//# sourceMappingURL=customError.js.map