"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransaction = exports.deleteTransaction = exports.getTransactions = exports.createTransaction = void 0;
const ApiFeatures_1 = __importDefault(require("../utils/ApiFeatures"));
const customError_1 = __importDefault(require("../utils/customError"));
const asyncErrorHandler_1 = __importDefault(require("../utils/asyncErrorHandler"));
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
exports.createTransaction = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const tenantId = req.tenantId;
    let transactionData = req.body;
    transactionData.tenantId = tenantId;
    const formattedDate = new Date(transactionData.createdAt);
    transactionData.createdAt = formattedDate;
    transactionData.transactionType !== "income"
        ? (transactionData.amount = -Number(transactionData.amount))
        : Number(transactionData.amount);
    const transaction = await transactionModel_1.default.create(transactionData);
    res.status(201).json({
        status: "success",
        transaction,
    });
});
exports.getTransactions = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    let queryParams = req.query;
    const tenantId = req.tenantId;
    console.log("QUERY", queryParams);
    const features = new ApiFeatures_1.default(transactionModel_1.default.find(), queryParams, tenantId);
    const { incomeTotal, totalsByEachIncomeTags, outcomeTotal, totalsByEachOutcomeTags, feat, count, } = await features.filter();
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
});
exports.deleteTransaction = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const id = req.params.id;
    const deletedTransaction = await transactionModel_1.default.findByIdAndDelete(id);
    if (!deletedTransaction) {
        const error = new customError_1.default("No transaction with this id was found.", 404);
        return next(error);
    }
    res.status(204).json({
        status: "success",
        data: null,
    });
});
exports.updateTransaction = (0, asyncErrorHandler_1.default)(async (req, res, next) => {
    const transactionId = req.params.id;
    const tenantId = req.tenantId;
    if (!transactionId) {
        const error = new customError_1.default("Invalid transaction ID", 400);
        return next(error);
    }
    const response = await transactionModel_1.default.updateMany({ transactionId, tenantId }, req.body, { new: true, runValidators: true });
    const { acknowledged, modifiedCount, matchedCount } = response;
    res.status(200).json({
        status: "success",
        acknowledged,
        matchedCount,
        modifiedCount,
    });
});
//# sourceMappingURL=transactionController.js.map