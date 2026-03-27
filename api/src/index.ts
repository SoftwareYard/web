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
import { adminsRouter } from "./routes/admins";
import { invoicesRouter } from "./routes/invoices";
import { assetsRouter } from "./routes/assets";
import { storesRouter } from "./routes/stores";
import { assetTypesRouter } from "./routes/asset-types";
import { assetImagesRouter } from "./routes/asset-images";
import { startInvoiceRenewalCron } from "./services/invoice-renewal.service";

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
app.use("/api/admins", adminsRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/stores", storesRouter);
app.use("/api/asset-types", assetTypesRouter);
app.use("/api/assets/:assetId/images", assetImagesRouter);


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  startInvoiceRenewalCron();
});




