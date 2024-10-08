import mongoose, { Model, Schema } from "mongoose";

export interface IErrorLog {
  tenantId?: string;
  userEmail?: string;
  interceptedAt: string;
  reqHeaders?: object;
  reqParams?: object | null;
  reqQuery?: object | null;
  reqBody?: object | null;
  error: Error | string;
  createdAt: Date;
}

const errorLogSchema = new Schema<IErrorLog>({
  tenantId: String || null,
  userEmail: String || null,
  interceptedAt: String,
  reqHeaders: Object || null,
  reqQuery: Object || null,
  reqParams: Object || null,
  reqBody: Object || null,
  error: {
    type: Object || String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const ErrorLogModel: Model<IErrorLog> = mongoose.model(
  "ErrorLog",
  errorLogSchema
);

export default ErrorLogModel;
