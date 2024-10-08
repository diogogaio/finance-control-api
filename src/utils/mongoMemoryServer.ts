import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

//Local mongodb database:
export async function connectToMongoMemoryServer() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(
      `MongoDB successfully connected to in-memory server uri: ${mongoUri}`
    );
  } catch (err) {
    console.error("DB Connection Error:", err);
  }
}
