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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const transactionSchema = new mongoose_1.Schema({
    tenantId: {
        type: String,
        required: [true, "tenantId field is required"],
    },
    transactionId: {
        type: String,
        required: [true, "transactionId field is required"],
    },
    createdAt: {
        type: Date,
        required: [true, "createdAt field is required"],
    },
    transactionType: {
        type: String,
        lowercase: true,
        default: "outcome",
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        validate: {
            validator: function (value) {
                // Validate number with optional negative sign and up to two decimal places
                return /^-?\d+(\.\d{1,2})?$/.test(value.toString());
            },
            message: (props) => `${props.value} is not a valid amount. Values must be like "-1234.56" or "1234.56".`,
        },
    },
    description: {
        type: String,
        required: [true, "description is required"],
        maxlength: [20, "Description must not exceed 20 characters"],
    },
    tag: {
        type: String,
        lowercase: true,
        default: "geral",
        maxlength: [20, "Tag must not exceed 20 characters"],
    },
    recurrent: {
        type: Boolean,
        default: false,
    },
    clone: {
        type: Boolean,
        default: false,
    },
});
const TransactionModel = mongoose_1.default.model("Transaction", transactionSchema);
exports.default = TransactionModel;
//# sourceMappingURL=transactionModel.js.map