"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authController_1 = require("../controllers/authController");
const express_1 = __importDefault(require("express"));
const authRouter = express_1.default.Router();
authRouter
    .route("/")
    .get(authController_1.protect, authController_1.getUser)
    .patch(authController_1.protect, authController_1.updateUser)
    .delete(authController_1.protect, authController_1.deleteUser);
authRouter.route("/login").post(authController_1.login);
authRouter.route("/signup").post(authController_1.signup);
authRouter.route("/signinWithGoogle").post(authController_1.signinWithGoogle);
authRouter.route("/forgotPassword").post(authController_1.forgotPassword);
authRouter.route("/resetPassword/:id/:token").patch(authController_1.resetPassword);
authRouter.route("/changePassword").patch(authController_1.protect, authController_1.changePassword);
exports.default = authRouter;
//# sourceMappingURL=authRouter.js.map