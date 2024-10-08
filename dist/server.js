"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config({ path: "./../config" });
const controllers_1 = require("./controllers");
// import { connectToMongoMemoryServer } from "./utils/mongoMemoryServer";
process.on("uncaughtException", async (err) => {
    console.log(err.name, err.message);
    await (0, controllers_1.logErrorOnServer)("Uncaught-exception", err);
    console.log("Uncaught Exception occurred! Shutting down...");
    process.exit(1);
});
const configPath = path_1.default.resolve(__dirname, "../config.env");
dotenv_1.default.config({ path: configPath });
const port = Number(process.env.PORT) || 3000;
mongoose_1.default
    .connect(process.env.CONN_STR || "")
    .then(() => {
    console.log("DB Connection Successful!");
})
    .catch(() => {
    console.log("DB Connection Failed!");
});
const server = app_1.default.listen(port, () => {
    console.log(`Server running on ${process.env.NODE_ENV} - PORT:${port}`);
});
// Handle any promise rejection that was not caught
process.on("unhandledRejection", async (err) => {
    console.log(err.name, err.message);
    await (0, controllers_1.logErrorOnServer)("Unhandled-rejection", err);
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
//# sourceMappingURL=server.js.map