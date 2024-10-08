import {
  login,
  signup,
  protect,
  getUser,
  deleteUser,
  updateUser,
  resetPassword,
  changePassword,
  forgotPassword,
  signinWithGoogle,
} from "../controllers/authController";
import express from "express";

const authRouter = express.Router();

authRouter
  .route("/")
  .get(protect, getUser)
  .patch(protect, updateUser)
  .delete(protect, deleteUser);
authRouter.route("/login").post(login);
authRouter.route("/signup").post(signup);
authRouter.route("/signinWithGoogle").post(signinWithGoogle);
authRouter.route("/forgotPassword").post(forgotPassword);
authRouter.route("/resetPassword/:id/:token").patch(resetPassword);
authRouter.route("/changePassword").patch(protect, changePassword);

export default authRouter;
