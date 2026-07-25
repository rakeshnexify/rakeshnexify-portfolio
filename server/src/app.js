import "dotenv/config";
import cors from "cors";
import express from "express";

import healthRoutes from "./routes/health.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the RakeshNexify Portfolio API.",
  });
});

app.use("/api/health", healthRoutes);

export default app;