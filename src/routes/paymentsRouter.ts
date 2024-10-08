import express from "express";
import {
  createCheckoutSession,
  sessionStatus,
} from "../controllers/paymentController";

const paymentsRouter = express.Router();

paymentsRouter.route("/createCheckoutSession").post(createCheckoutSession);

paymentsRouter.route("/sessionStatus").get(sessionStatus);

export default paymentsRouter;
