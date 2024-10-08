import Stripe from "stripe";
import CustomError from "../utils/customError";
import { Request, Response, NextFunction } from "express";
import asyncErroHandler from "../utils/asyncErrorHandler";

export const createCheckoutSession = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { email } = req.body;

    const MY_DOMAIN =
      process.env.NODE_ENV === "production"
        ? "https://equilibriofinanceiro.web.app"
        : "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      customer_email: email,
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: "price_1Q5ZShDzQr6iKDKIattJsU2T",
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url: `${MY_DOMAIN}/paymentReturn/session_id={CHECKOUT_SESSION_ID}`,
    });

    res.status(201).json({
      clientSecret: session.client_secret,
    });
  }
);

export const sessionStatus = asyncErroHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session_id = String(req.query.session_id);

    if (!session_id) {
      const error = new CustomError("Invalid session ID", 400);
      return next(error);
    }
    const session = await stripe.checkout.sessions.retrieve(session_id);

    res.send({
      status: session.status,
    });
  }
);
