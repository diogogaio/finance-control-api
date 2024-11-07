import cors from "cors";
import express from "express";
import "./utils/taskScheduler";
import authRouter from "./routes/authRouter";
import CustomError from "./utils/customError";
import { rateLimit } from "express-rate-limit";
import { setOrigin } from "./utils/corsConfig";
import { globalErrorHandler } from "./controllers";
import mongoSanitize from "express-mongo-sanitize";
import sanitizeRequest from "./middleware/sanitize";
import paymentsRouter from "./routes/paymentsRouter";
import transactionRouter from "./routes/transactionRouter";
// import cookieParser from "cookie-parser";
// import mongoose from "mongoose";
// mongoose.set("debug", true);

const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 220, // Limit each IP to 100 requests
  statusCode: 429,
  message:
    "Too many server request for a certain period, please try again later...",
});

//https://express-rate-limit.mintlify.app/guides/troubleshooting-proxy-issues
// Solve the render.com proxies issue with rate limiter:
if (process.env.RENDER === "true") {
  app.set("trust proxy", 3); // Render setup
} else {
  app.set("trust proxy", 1); // Nginx or local setup
}

// Apply the rate limiting middleware to all requests.
app.use(limiter);

// Define the CORS options
const corsOptions = {
  origin: setOrigin(),
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS",
  allowedHeaders: "Authorization, Content-Type",
  exposedHeaders: ["rate-limit-remaining"], //Expose this header so axios can intercept it in client side
  // credentials: true,
  optionsSuccessStatus: 204,
};

// Use the CORS middleware
app.use(cors(corsOptions));

//This middleware adds RateLimit-Remaining to all responses since I can't reach the default X-Rate-Limit header on client side
app.use((req, res, next) => {
  const rateLimitRemaining = res.get("x-ratelimit-remaining");
  res.setHeader("rate-limit-remaining", rateLimitRemaining); // Set custom header
  next();
});
// Handle preflight requests
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10kb" })); //Limit maximum request body data
app.use(sanitizeRequest);
// app.use(cookieParser()); // Middleware to parse cookies

// By default, $ and . characters are removed completely from user-supplied input in the following places:
// - req.body
// - req.params
// - req.headers
// - req.query

// To remove data using these defaults:
app.use(mongoSanitize());

//Routes
app.use("/finance-api/v1/user", authRouter);
app.use("/finance-api/v1/transactions", transactionRouter);
app.use("/finance-api/v1/payments", paymentsRouter);
app.all("*", (req, res, next) => {
  const err = new CustomError(
    `Can not find this URL on server: "${req.originalUrl}" `,
    404
  );
  next(err);
});

app.use(globalErrorHandler as any);

export default app;
