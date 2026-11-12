import { Router, Response } from "express";
import multer from "multer";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { uploadToBunny, deleteFromBunny } from "../lib/bunny";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  isPlausibleReceiptDate,
  scanReceipt,
  PAYMENT_METHODS,
  RECEIPT_CATEGORIES,
} from "../services/receipt-scanner.service";

export const receiptsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG or WebP images are allowed"));
    }
  },
});

receiptsRouter.use(requireAuth);

// Today in Skopje as YYYY-MM-DD; the fallback date when a receipt can't be read
const todayInSkopje = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Skopje" }).format(new Date());

const toDbDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

// Scan the image and turn the result into receipt fields (everything except the date, which
// the caller decides on). A failed scan only records the error, so the receipt is still saved
// and can be rescanned later.
async function scanFields(image: Buffer) {
  try {
    const scan = await scanReceipt(image);
    const missing = [!scan.date && "date", scan.total === null && "total"].filter(Boolean);
    return {
      scannedDate: scan.date,
      fields: {
        time: scan.time,
        total: scan.total,
        merchantName: scan.merchantName,
        merchantAddress: scan.merchantAddress,
        merchantTaxNumber: scan.merchantTaxNumber,
        merchantVatNumber: scan.merchantVatNumber,
        paymentMethod: scan.paymentMethod,
        category: scan.category,
        receiptNumber: scan.receiptNumber,
        fiscalCodes: scan.fiscalCodes,
        vatTotal: scan.vatTotal,
        vatBreakdown: scan.vatBreakdown,
        items: scan.items,
        scanError: missing.length
          ? `Couldn't read the ${missing.join(" or ")} from the receipt`
          : scan.warning,
        scannedAt: new Date(),
      },
    };
  } catch (err) {
    console.error("[receipts] Scan failed:", err);
    return {
      scannedDate: null,
      fields: { scanError: err instanceof Error ? err.message : "Scan failed" },
    };
  }
}

// An earlier receipt from the same merchant with the same number, date and total
async function findDuplicate(r: {
  id?: string;
  merchantTaxNumber?: string | null;
  receiptNumber?: string | null;
  date?: Date;
  total?: number | null;
}) {
  if (!r.merchantTaxNumber || !r.receiptNumber || !r.date || r.total == null) return null;
  const match = await prisma.receipt.findFirst({
    where: {
      merchantTaxNumber: r.merchantTaxNumber,
      receiptNumber: r.receiptNumber,
      date: r.date,
      total: r.total,
      ...(r.id ? { id: { not: r.id } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return match?.id ?? null;
}

// All receipts, newest purchase first; the CMS groups them by year and month.
// Optional ?year=2026 narrows to one year.
receiptsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const year = parseInt(String(req.query.year ?? ""), 10);
  const where = Number.isInteger(year)
    ? { date: { gte: toDbDate(`${year}-01-01`), lt: toDbDate(`${year + 1}-01-01`) } }
    : {};
  const receipts = await prisma.receipt.findMany({
    where,
    orderBy: [{ date: "desc" }, { time: "desc" }, { createdAt: "desc" }],
  });
  res.json(receipts);
});

// Upload one receipt photo; everything on it is read by Claude
receiptsRouter.post("/", upload.single("image"), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "Image file is required" });
    return;
  }

  let imageUrl: string;
  try {
    imageUrl = await uploadToBunny(req.file.buffer, req.file.originalname, "Receipts");
  } catch (err) {
    console.error("[receipts] Upload failed:", err);
    res.status(502).json({ error: "Failed to upload the image" });
    return;
  }

  // Unreadable date: file it under today so nothing is lost
  const { scannedDate, fields } = await scanFields(req.file.buffer);
  const date = toDbDate(scannedDate ?? todayInSkopje());
  const duplicateOfId = await findDuplicate({ ...fields, date });

  const receipt = await prisma.receipt.create({
    data: {
      ...fields,
      imageUrl,
      fileName: req.file.originalname,
      date,
      dateSource: scannedDate ? "scanned" : "upload",
      duplicateOfId,
    },
  });
  res.status(201).json(receipt);
});

// Read the stored image again, e.g. after a failed scan. A date set by hand is kept.
receiptsRouter.post("/:id/rescan", async (req: AuthRequest, res: Response) => {
  const receipt = await prisma.receipt.findUnique({ where: { id: String(req.params.id) } });
  if (!receipt) {
    res.status(404).json({ error: "Receipt not found" });
    return;
  }

  let image: Buffer;
  try {
    const download = await fetch(receipt.imageUrl);
    if (!download.ok) throw new Error(`status ${download.status}`);
    image = Buffer.from(await download.arrayBuffer());
  } catch (err) {
    console.error(`[receipts] Image download failed for ${receipt.id}:`, err);
    res.status(502).json({ error: "Couldn't download the receipt image" });
    return;
  }

  // A date set by hand wins; otherwise take the newly read one, or keep the current date
  const { scannedDate, fields } = await scanFields(image);
  const useScanned = !!scannedDate && receipt.dateSource !== "manual";
  const date = useScanned ? toDbDate(scannedDate) : receipt.date;
  const duplicateOfId = await findDuplicate({ ...fields, id: receipt.id, date });

  const updated = await prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      ...fields,
      ...(useScanned ? { date, dateSource: "scanned" } : {}),
      duplicateOfId,
    },
  });
  res.json(updated);
});

// Correct what the scan got wrong
receiptsRouter.patch("/:id", async (req: AuthRequest, res: Response) => {
  const { date, total, merchantName, category, paymentMethod } = req.body ?? {};
  const data: Prisma.ReceiptUpdateInput = {};

  if (date !== undefined) {
    if (!isPlausibleReceiptDate(date)) {
      res.status(400).json({ error: "Date must be a valid YYYY-MM-DD that isn't in the future" });
      return;
    }
    data.date = toDbDate(date);
    data.dateSource = "manual";
  }

  if (total !== undefined) {
    if (total === null || total === "") {
      data.total = null;
    } else {
      const value = Number(total);
      if (!Number.isFinite(value) || value < 0) {
        res.status(400).json({ error: "Total must be a number of 0 or more" });
        return;
      }
      data.total = value;
    }
  }

  if (merchantName !== undefined) {
    data.merchantName = typeof merchantName === "string" && merchantName.trim() ? merchantName.trim() : null;
  }

  if (category !== undefined) {
    if (!RECEIPT_CATEGORIES.includes(category)) {
      res.status(400).json({ error: `Category must be one of: ${RECEIPT_CATEGORIES.join(", ")}` });
      return;
    }
    data.category = category;
  }

  if (paymentMethod !== undefined) {
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      res.status(400).json({ error: `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}` });
      return;
    }
    data.paymentMethod = paymentMethod;
  }

  const exists = await prisma.receipt.findUnique({ where: { id: String(req.params.id) } });
  if (!exists) {
    res.status(404).json({ error: "Receipt not found" });
    return;
  }

  const receipt = await prisma.receipt.update({ where: { id: exists.id }, data });
  res.json(receipt);
});

receiptsRouter.delete("/:id", async (req: AuthRequest, res: Response) => {
  const receipt = await prisma.receipt.findUnique({ where: { id: String(req.params.id) } });
  if (!receipt) {
    res.status(404).json({ error: "Receipt not found" });
    return;
  }
  await prisma.receipt.delete({ where: { id: receipt.id } });
  // Receipts that pointed at this one as their original are no longer duplicates of anything
  await prisma.receipt.updateMany({ where: { duplicateOfId: receipt.id }, data: { duplicateOfId: null } });
  await deleteFromBunny(receipt.imageUrl).catch((err) =>
    console.error(`[receipts] Failed to delete image for ${receipt.id}:`, err)
  );
  res.json({ success: true });
});
