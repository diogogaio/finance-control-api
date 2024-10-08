"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToMongoMemoryServer = connectToMongoMemoryServer;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
//Local mongodb database:
async function connectToMongoMemoryServer() {
    try {
        const mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose_1.default.connect(mongoUri);
        console.log(`MongoDB successfully connected to in-memory server uri: ${mongoUri}`);
    }
    catch (err) {
        console.error("DB Connection Error:", err);
    }
}
//# sourceMappingURL=mongoMemoryServer.js.map