"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const paymentsRouter = express_1.default.Router();
paymentsRouter.route("/createCheckoutSession").post(paymentController_1.createCheckoutSession);
paymentsRouter.route("/sessionStatus").get(paymentController_1.sessionStatus);
exports.default = paymentsRouter;
//# sourceMappingURL=paymentsRouter.js.map