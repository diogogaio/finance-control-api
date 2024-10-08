"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controllers_1 = require("../controllers");
const express_1 = __importDefault(require("express"));
const transactionRouter = express_1.default.Router();
transactionRouter
    .route("/")
    .post(controllers_1.protect, controllers_1.createTransaction)
    .get(controllers_1.protect, controllers_1.getTransactions);
transactionRouter
    .route("/:id")
    .delete(controllers_1.protect, controllers_1.deleteTransaction)
    .patch(controllers_1.protect, controllers_1.updateTransaction);
exports.default = transactionRouter;
//# sourceMappingURL=transactionRouter.js.map