import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import employeeRoutes from "./routes/employee.routes";
import orgRoutes from "./routes/org.routes";
import positionRoutes from "./routes/position.routes";
import workflowRoutes from "./routes/workflow.routes";
import automationRoutes from "./routes/automation.routes";
import feedbackRoutes from "./routes/feedback.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/feedback", feedbackRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Root route
app.get("/", (req, res) => {
  res.send("PeopleFlow API is running");
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server." });
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[Server] PeopleFlow API is listening on port ${PORT}`);
});

