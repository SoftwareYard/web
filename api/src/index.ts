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
import { salariesRouter } from "./routes/salaries";
import { invoicesRouter } from "./routes/invoices";
import { assetsRouter } from "./routes/assets";
import { storesRouter } from "./routes/stores";
import { clientsRouter } from "./routes/clients";
import { assetTypesRouter } from "./routes/asset-types";
import { assetImagesRouter } from "./routes/asset-images";
import { assetHistoryRouter } from "./routes/asset-history";
import { timeOffRouter } from "./routes/time-off";
import { portalAuthRouter } from "./routes/portal-auth";
import { publicHolidaysRouter } from "./routes/public-holidays";
import { notificationsRouter } from "./routes/notifications";
import { startInvoiceRenewalCron } from "./services/invoice-renewal.service";
import { startTimeOffCarryoverCron } from "./services/time-off-carryover.service";
import { startOverdueInvoicesCron } from "./services/overdue-invoices.service";
import { startOverdueContractsCron } from "./services/overdue-contracts.service";
import { startHolidayNoticeCron } from "./services/holiday-notice.service";

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
app.use("/api/salaries", salariesRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/stores", storesRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/asset-types", assetTypesRouter);
app.use("/api/assets/:assetId/images", assetImagesRouter);
app.use("/api/assets/:assetId/history", assetHistoryRouter);
app.use("/api/portal-auth", portalAuthRouter);
app.use("/api/time-off", timeOffRouter);
app.use("/api/public-holidays", publicHolidaysRouter);
app.use("/api/notifications", notificationsRouter);


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  startInvoiceRenewalCron();
  startTimeOffCarryoverCron();
  startOverdueInvoicesCron();
  startOverdueContractsCron();
  startHolidayNoticeCron();
});




