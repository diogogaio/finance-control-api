import path from "path";
import app from "./app";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config({ path: "./../config" });
import { logErrorOnServer } from "./controllers";
// import { connectToMongoMemoryServer } from "./utils/mongoMemoryServer";

process.on("uncaughtException", async (err) => {
  console.log(err.name, err.message);
  await logErrorOnServer("Uncaught-exception", err);
  console.log("Uncaught Exception occurred! Shutting down...");
  process.exit(1);
});

const configPath = path.resolve(__dirname, "../config.env");
dotenv.config({ path: configPath });

const port = Number(process.env.PORT) || 3000;

mongoose
  .connect(process.env.CONN_STR || "")
  .then(() => {
    console.log("DB Connection Successful!");
  })
  .catch(() => {
    console.log("DB Connection Failed!");
  });

const server = app.listen(port, () => {
  console.log(`Server running on ${process.env.NODE_ENV} - PORT:${port}`);
});

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

// connectToMongoMemoryServer()
