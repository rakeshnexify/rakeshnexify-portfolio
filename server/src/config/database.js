import mongoose from "mongoose";

let connectionListenersRegistered = false;

function registerConnectionListeners() {
  if (connectionListenersRegistered) {
    return;
  }

  connectionListenersRegistered = true;

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB connection restored.");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection disconnected.");
  });

  mongoose.connection.on("error", (error) => {
    console.error(`MongoDB connection error: ${error.message}`);
  });
}

async function connectDatabase() {
  const mongoUri = String(process.env.MONGODB_URI || "").trim();

  const databaseName = String(process.env.MONGODB_DB_NAME || "").trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  if (!databaseName) {
    throw new Error("MONGODB_DB_NAME environment variable is missing.");
  }

  registerConnectionListeners();

  /*
   * readyState:
   * 0 = disconnected
   * 1 = connected
   * 2 = connecting
   * 3 = disconnecting
   */
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(mongoUri, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected successfully: ${mongoose.connection.name}`);

  return mongoose.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();

  console.log("MongoDB disconnected successfully.");
}

export { disconnectDatabase };

export default connectDatabase;
