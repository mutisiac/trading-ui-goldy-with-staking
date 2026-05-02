import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  const mongoURI = env.MONGO_URI;
  const dbName = env.DB_NAME;

  let connectionString = mongoURI;

  try {
    const url = new URL(mongoURI);
    const pathName = url.pathname.replace(/^\/+/, "");
    const hasDbName = pathName.length > 0;

    if (!hasDbName) {
      if (!dbName) {
        console.error("Missing DB_NAME when MONGO_URI has no database path.");
        process.exit(1);
      }
      url.pathname = `/${dbName}`;
      connectionString = url.toString();
    }
  } catch {
    if (!dbName) {
      console.error("Missing DB_NAME for non-URL MONGO_URI.");
      process.exit(1);
    }
    const trimmedUri = mongoURI.replace(/\/+$/, "");
    connectionString = `${trimmedUri}/${dbName}`;
  }

  const connectionInstance = await mongoose.connect(connectionString);
  console.log(`MongoDB connected. Host: ${connectionInstance.connection.host}`);
}
