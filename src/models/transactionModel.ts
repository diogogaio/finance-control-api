import mongoose, { Schema } from "mongoose";

export interface ITransaction {
  tag?: string;
  transactionId: string;
  amount: number;
  createdAt: Date;
  tenantId: string;
  description: string;
  recurrent?: boolean;
  transactionType: "income" | "outcome";
  clone: boolean;
}

const transactionSchema = new Schema<ITransaction>({
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
      validator: function (value: number) {
        // Validate number with optional negative sign and up to two decimal places
        return /^-?\d+(\.\d{1,2})?$/.test(value.toString());
      },
      message: (props) =>
        `${props.value} is not a valid amount. Values must be like "-1234.56" or "1234.56".`,
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

const TransactionModel = mongoose.model("Transaction", transactionSchema);
export default TransactionModel;
