import bcrypt from "bcrypt";
import validator from "validator";
import { randomBytes, createHash } from "crypto";
import mongoose, { Schema, Document, Model } from "mongoose";

// Define the interface for the User document, including instance methods
export interface IUser extends Document {
  email: string;
  emailConfirm?: string;
  password: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  transactionTags?: string[];
  signedUpByGoogle?: boolean;
  passwordResetTokenExpires?: number;
  createResetPasswordToken(): string;
  isPasswordChanged(JWTTimestamp: number): Promise<boolean>;
  comparePassword(pwd: string, serverPwd: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      required: [true, "Please enter a valid email."],
      validate: [validator.isEmail, "Please enter a valid email."],
    },
    emailConfirm: {
      type: String,
      validate: [validator.isEmail, "Please enter a valid email."],
    },
    password: {
      type: String,
      required: [true, "Please enter a password."],
      minlength: 6,
      select: false,
    },
    passwordConfirm: {
      type: String,
    },
    passwordChangedAt: Date,
    signedUpByGoogle: Boolean,
    passwordResetToken: String,
    passwordResetTokenExpires: Number,

    transactionTags: {
      type: [String],
      maxlength: 20,
    },
  },
  {
    methods: {
      createResetPasswordToken: function () {
        const resetToken = randomBytes(32).toString("hex");

        this.passwordResetToken = createHash("sha256")
          .update(resetToken)
          .digest("hex");

        this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds

        return resetToken;
      },

      comparePassword: async function (
        pwd: string,
        serverPwd: string
      ): Promise<boolean> {
        return await bcrypt.compare(pwd, serverPwd);
      },

      isPasswordChanged: function (JWTTimestamp: number) {
        if (this.passwordChangedAt) {
          // getTime() converts to milliseconds, divide by 1000 to convert to seconds
          const pwdTimestamp = Math.floor(
            this.passwordChangedAt.getTime() / 1000
          ); // Use Math.floor for rounding down

          // You can then compare pwdTimestamp with JWTTimestamp
          return JWTTimestamp < pwdTimestamp;
        }
      },
    },
  }
);

userSchema.pre("save", function (next) {
  this.emailConfirm = undefined;
  this.passwordConfirm = undefined;
  next();
});

export const UserModel: Model<IUser> = mongoose.model<IUser>(
  "User",
  userSchema
);
