import ApiFeatures from "../utils/ApiFeatures";
import CustomError from "../utils/customError";
import { Request, Response, NextFunction } from "express";
import asyncErroHandler from "../utils/asyncErrorHandler";
import TransactionModel, { ITransaction } from "../models/transactionModel";

export const createTransaction = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.tenantId;
    let transactionData: ITransaction = req.body;
    transactionData.tenantId = tenantId;

    const formattedDate = new Date(transactionData.createdAt);
    transactionData.createdAt = formattedDate;

    transactionData.transactionType !== "income"
      ? (transactionData.amount = -Number(transactionData.amount))
      : Number(transactionData.amount);

    const transaction = await TransactionModel.create(transactionData);
    res.status(201).json({
      status: "success",
      transaction,
    });
  }
);

export const getTransactions = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let queryParams = req.query;
    const tenantId = req.tenantId;
    console.log("QUERY", queryParams);

    const features = new ApiFeatures(
      TransactionModel.find(),
      queryParams,
      tenantId
    );
    const {
      incomeTotal,
      totalsByEachIncomeTags,
      outcomeTotal,
      totalsByEachOutcomeTags,
      feat,
      count,
    } = await features.filter();

    const transactions = await feat.sort().limitFields().paginate().query;

    res.status(200).json({
      status: "success",
      count,
      transactions,
      totals: {
        income: incomeTotal,
        totalsByEachIncomeTags,
        outcome: outcomeTotal,
        totalsByEachOutcomeTags,
        balance: incomeTotal - Math.abs(outcomeTotal),
      },
    });
  }
);

export const deleteTransaction = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    const deletedTransaction = await TransactionModel.findByIdAndDelete(id);

    if (!deletedTransaction) {
      const error = new CustomError(
        "No transaction with this id was found.",
        404
      );
      return next(error);
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

export const updateTransaction = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const transactionId = req.params.id;
    const tenantId = req.tenantId;

    if (!transactionId) {
      const error = new CustomError("Invalid transaction ID", 400);
      return next(error);
    }

    const response = await TransactionModel.updateMany(
      { transactionId, tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    const { acknowledged, modifiedCount, matchedCount } = response;

    res.status(200).json({
      status: "success",
      acknowledged,
      matchedCount,
      modifiedCount,
    });
  }
);
