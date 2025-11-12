"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
/* import {
  createCheckoutSession,
  sessionStatus,
} from "../controllers/paymentController"; */
const paymentsRouter = express_1.default.Router();
/* paymentsRouter.route("/createCheckoutSession").post(createCheckoutSession);

paymentsRouter.route("/sessionStatus").get(sessionStatus); */
exports.default = paymentsRouter;
//# sourceMappingURL=paymentsRouter.js.map