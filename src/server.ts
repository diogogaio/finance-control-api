import path from "path";
import dotenv from "dotenv";
const configPath = path.resolve(__dirname, "../config.env");
dotenv.config({ path: configPath }); //must be at the top to load

import app from "./app";
import mongoose from "mongoose";
import { logErrorOnServer } from "./controllers";
// import { connectToMongoMemoryServer } from "./utils/mongoMemoryServer";

process.on("uncaughtException", async (err) => {
  console.log(err.name, err.message);
  await logErrorOnServer("Uncaught-exception", err);
  console.log("Uncaught Exception occurred! Shutting down...");
  process.exit(1);
});

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(
    `Server running on ${
      process.env.NODE_ENV
    } - PORT:${port}\n time:${new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    })}`
  );
});

let count = 0;

const connectWithRetry = () => {
  mongoose
    .connect(process.env.CONN_STR || "")
    .then(() => {
      console.log("DB Connection Successful!");
    })
    .catch((err) => {
      console.log(
        "DB Connection Failed. Retrying in 3 seconds...",
        err.message
      );
      count++;
      if (count > 5) {
        console.log("Failed to connect after 5 attempts...");
      }
      setTimeout(connectWithRetry, 3000);
    });
};

connectWithRetry();

// Handle any promise rejection that was not caught
process.on("unhandledRejection", async (err: Error) => {
  console.log(err.name, err.message);
  await logErrorOnServer("Unhandled-rejection", err);
  console.log("Unhandled rejection occurred! Shutting down...");
  //Optionally: Finish all the pending requests before shutting down the server with server.close:
  server.close(() => {
    // Shut the server down:
    process.exit(1);
    // 0: means success, 1: means uncaught exception
  });
});

// Run mongodb locally:
// connectToMongoMemoryServer();
