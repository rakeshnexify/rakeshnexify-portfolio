import mongoose from "mongoose";

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB_NAME;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from server/.env");
  }

  if (!databaseName) {
    throw new Error("MONGODB_DB_NAME is missing from server/.env");
  }

  const connection = await mongoose.connect(mongoUri, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(
    `MongoDB connected successfully: ${connection.connection.name}`,
  );
}

export default connectDatabase;