import mongoose from "mongoose";
import { NextFunction, Response } from "express";
// import { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

import CustomError from "../utils/customError";
import ErrorLogModel from "../models/errorLogModel";

interface ValidationErrorItem {
  message: string;
}

interface IValidationErrorItem {
  message: string;
}

export interface IErrorController extends mongoose.Error, CustomError {
  code?: number;
  keyValue?: Record<string, any>;
  errors?: { [key: string]: ValidationErrorItem };
  path?: string;
  value?: string;
}

const castErrorHandler = (err: IErrorController) => {
  const msg = `Invalid value for ${err.path}: ${err.value}!`;
  return new CustomError(msg, 400);
};

const duplicateKeyErrorHandler = (err: IErrorController) => {
  // Unique Email is already handled by the signup function, this is just in case another unique field is added in the future
  const name = err.keyValue.name;
  const msg = `There is already a filed with name ${name}. Please use another name!`;

  return new CustomError(msg, 400);
};

const validationErrorHandler = (err: IErrorController) => {
  const errors = Object.values(err.errors).map(
    (val: IValidationErrorItem) => val.message
  );
  const errorMessages = errors.join(". ");
  const msg = `Invalid input data: ${errorMessages}`;

  return new CustomError(msg, 400);
};

const handleExpiredJWT = () => {
  return new CustomError("Access token expired, try to login again.", 401);
};

const handleJWTError = () => {
  return new CustomError("Invalid Access token, try to login again.", 401);
};

const prodErrors = (res: Response, error: IErrorController) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.statusCode,
      message: error.message,
    });
  } else {
    //Error not coming from CustomError will fall here and should not be client interest in production
    res.status(500).json({
      status: "error",
      message: "Something went wrong! Please try again later.",
    });
  }
};

const devErrors = (res: Response, error: IErrorController) => {
  res.status(error.statusCode).json({
    status: error.statusCode,
    message: error.message,
    stackTrace: error.stack,
    error: error,
  });
};

export const logErrorOnServer = async (
  interceptedAt: string,
  error: any,
  req = null
) => {
  const tenantId = req?.tenantId;
  const userEmail = req?.userEmail;

  // Remove user passwords from body
  const body = req?.body;

  if (body?.password || body?.passwordConfirm) {
    ["password", "passwordConfirm"].forEach((field) => {
      if (body[field]) body[field] = undefined;
    });
  }
  try {
    const errorLog = await ErrorLogModel.create({
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
    console.log("Logged error: ", errorLog);
  } catch (error) {
    console.log("Not able to log error on server: ", error);
  }
};

export const globalErrorHandler = async (
  error: IErrorController,
  req: any,
  res: Response,
  next: NextFunction
) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";
  await logErrorOnServer("Global-error-handler", error, req);

  if (process.env.NODE_ENV === "development") {
    devErrors(res, error);
  } else if (process.env.NODE_ENV === "production") {
    if (error.code === 11000) error = duplicateKeyErrorHandler(error);
    if (error.name === "TokenExpiredError") error = handleExpiredJWT();
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "CastError") error = castErrorHandler(error);
    if (error.name === "ValidationError") error = validationErrorHandler(error);

    prodErrors(res, error);
  }
};
