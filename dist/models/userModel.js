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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const validator_1 = __importDefault(require("validator"));
const crypto_1 = require("crypto");
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        unique: true,
        required: [true, "Please enter a valid email."],
        validate: [validator_1.default.isEmail, "Please enter a valid email."],
    },
    emailConfirm: {
        type: String,
        validate: [validator_1.default.isEmail, "Please enter a valid email."],
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
}, {
    methods: {
        createResetPasswordToken: function () {
            const resetToken = (0, crypto_1.randomBytes)(32).toString("hex");
            this.passwordResetToken = (0, crypto_1.createHash)("sha256")
                .update(resetToken)
                .digest("hex");
            this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds
            return resetToken;
        },
        comparePassword: async function (pwd, serverPwd) {
            return await bcrypt_1.default.compare(pwd, serverPwd);
        },
        isPasswordChanged: function (JWTTimestamp) {
            if (this.passwordChangedAt) {
                // getTime() converts to milliseconds, divide by 1000 to convert to seconds
                const pwdTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000); // Use Math.floor for rounding down
                // You can then compare pwdTimestamp with JWTTimestamp
                return JWTTimestamp < pwdTimestamp;
            }
        },
    },
});
userSchema.pre("save", function (next) {
    this.emailConfirm = undefined;
    this.passwordConfirm = undefined;
    next();
});
exports.UserModel = mongoose_1.default.model("User", userSchema);
//# sourceMappingURL=userModel.js.map