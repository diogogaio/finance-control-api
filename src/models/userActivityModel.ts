import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUserActivity extends Document {
  tenantId: string;
  userEmail: string;
  action: "signUp" | "signOff" | "login" | "signUp-with-google";
  createdAt: Date;
  ipAddress: string | null;
}

const userActivitySchema = new Schema<IUserActivity>({
  action: {
    type: String,
    enum: ["signUp", "signOff", "login", "signUp-with-google"],
    required: true,
  },
  userEmail: { type: String, required: true },
  tenantId: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: new Date() },
  ipAddress: String || null,
});

const UserActivityModel: Model<IUserActivity> = mongoose.model(
  "UserActivity",
  userActivitySchema
);

export default UserActivityModel;
