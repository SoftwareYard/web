import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { contactRouter } from "./routes/contact";
import { authRouter } from "./routes/auth";
import { teamRouter } from "./routes/team";
import { jobsRouter } from "./routes/jobs";
import { applyRouter } from "./routes/apply";
import { applicationsRouter } from "./routes/applications";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/contact", contactRouter);
app.use("/api/auth", authRouter);
app.use("/api/team", teamRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/apply", applyRouter);
app.use("/api/applications", applicationsRouter);


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});




