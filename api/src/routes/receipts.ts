import { Router, Response } from "express";
import multer from "multer";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { uploadToBunny, deleteFromBunny } from "../lib/bunny";
import { requireAuth, AuthRequest } from "../middleware/auth";
import {
  cropReceiptImage,
  isPlausibleReceiptDate,
  scanReceipt,
  CropArea,
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
      crop: scan.crop,
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
      crop: undefined, // unknown: leave the stored images as they are
      fields: { scanError: err instanceof Error ? err.message : "Scan failed" },
    };
  }
}

// Store the crop of the photo as the receipt image. Falls back to the original photo (no crop)
// when there is nothing to cut away or the crop fails.
async function storeCrop(
  original: Buffer,
  originalUrl: string,
  fileName: string,
  crop: CropArea | null
): Promise<{ imageUrl: string; originalImageUrl: string | null }> {
  if (!crop) return { imageUrl: originalUrl, originalImageUrl: null };
  try {
    const cropped = await cropReceiptImage(original, crop);
    const name = `${fileName.replace(/\.[^.]+$/, "")}-receipt.jpg`;
    const imageUrl = await uploadToBunny(cropped, name, "Receipts");
    return { imageUrl, originalImageUrl: originalUrl };
  } catch (err) {
    console.error("[receipts] Crop failed, keeping the original photo:", err);
    return { imageUrl: originalUrl, originalImageUrl: null };
  }
}

const deleteImage = (url: string, id: string) =>
  deleteFromBunny(url).catch((err) => console.error(`[receipts] Failed to delete image for ${id}:`, err));

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

  // The photo as taken is stored first, so nothing is lost whatever happens next
  let originalUrl: string;
  try {
    originalUrl = await uploadToBunny(req.file.buffer, req.file.originalname, "Receipts");
  } catch (err) {
    console.error("[receipts] Upload failed:", err);
    res.status(502).json({ error: "Failed to upload the image" });
    return;
  }

  // Unreadable date: file it under today so nothing is lost
  const { scannedDate, crop, fields } = await scanFields(req.file.buffer);
  const images = await storeCrop(req.file.buffer, originalUrl, req.file.originalname, crop ?? null);
  const date = toDbDate(scannedDate ?? todayInSkopje());
  const duplicateOfId = await findDuplicate({ ...fields, date });

  const receipt = await prisma.receipt.create({
    data: {
      ...fields,
      ...images,
      fileName: req.file.originalname,
      date,
      dateSource: scannedDate ? "scanned" : "upload",
      duplicateOfId,
    },
  });
  res.status(201).json(receipt);
});

const optionalText = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

// Parse an amount typed by hand ("2780", "2 780,50"); undefined when it isn't a valid amount
function parseAmount(v: unknown): number | null | undefined {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

// Enter a receipt by hand, for ones too damaged or faded to scan. The photo is optional and
// is stored as is, without scanning.
receiptsRouter.post("/manual", upload.single("image"), async (req: AuthRequest, res: Response) => {
  const body = req.body ?? {};

  if (!isPlausibleReceiptDate(body.date)) {
    res.status(400).json({ error: "Date must be a valid YYYY-MM-DD that isn't in the future" });
    return;
  }
  const total = parseAmount(body.total);
  if (total === undefined || total === null) {
    res.status(400).json({ error: "Total is required and must be a number of 0 or more" });
    return;
  }
  const vatTotal = parseAmount(body.vatTotal);
  if (vatTotal === undefined) {
    res.status(400).json({ error: "VAT must be a number of 0 or more" });
    return;
  }
  const time = optionalText(body.time);
  if (time && !/^\d{2}:\d{2}$/.test(time)) {
    res.status(400).json({ error: "Time must be HH:MM" });
    return;
  }
  const category = optionalText(body.category) ?? "other";
  if (!(RECEIPT_CATEGORIES as readonly string[]).includes(category)) {
    res.status(400).json({ error: `Category must be one of: ${RECEIPT_CATEGORIES.join(", ")}` });
    return;
  }
  const paymentMethod = optionalText(body.paymentMethod) ?? "unknown";
  if (!(PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
    res.status(400).json({ error: `Payment method must be one of: ${PAYMENT_METHODS.join(", ")}` });
    return;
  }

  let imageUrl: string | null = null;
  if (req.file) {
    try {
      imageUrl = await uploadToBunny(req.file.buffer, req.file.originalname, "Receipts");
    } catch (err) {
      console.error("[receipts] Upload failed:", err);
      res.status(502).json({ error: "Failed to upload the image" });
      return;
    }
  }

  const fields = {
    date: toDbDate(body.date),
    time,
    total,
    vatTotal,
    merchantName: optionalText(body.merchantName),
    merchantTaxNumber: optionalText(body.merchantTaxNumber)?.replace(/\s/g, "") ?? null,
    receiptNumber: optionalText(body.receiptNumber)?.replace(/^#/, "") ?? null,
    category,
    paymentMethod,
  };
  const duplicateOfId = await findDuplicate(fields);

  const receipt = await prisma.receipt.create({
    data: {
      ...fields,
      imageUrl,
      fileName: req.file?.originalname ?? null,
      dateSource: "manual",
      duplicateOfId,
    },
  });
  res.status(201).json(receipt);
});

// Read the original photo again, e.g. after a failed scan, and redo the crop. A date set by hand is kept.
receiptsRouter.post("/:id/rescan", async (req: AuthRequest, res: Response) => {
  const receipt = await prisma.receipt.findUnique({ where: { id: String(req.params.id) } });
  if (!receipt) {
    res.status(404).json({ error: "Receipt not found" });
    return;
  }

  const originalUrl = receipt.originalImageUrl ?? receipt.imageUrl;
  if (!originalUrl) {
    res.status(400).json({ error: "This receipt was entered by hand and has no photo to scan" });
    return;
  }
  let image: Buffer;
  try {
    const download = await fetch(originalUrl);
    if (!download.ok) throw new Error(`status ${download.status}`);
    image = Buffer.from(await download.arrayBuffer());
  } catch (err) {
    console.error(`[receipts] Image download failed for ${receipt.id}:`, err);
    res.status(502).json({ error: "Couldn't download the receipt image" });
    return;
  }

  // A date set by hand wins; otherwise take the newly read one, or keep the current date
  const { scannedDate, crop, fields } = await scanFields(image);
  // A failed scan says nothing about the crop, so the images stay as they are
  const images =
    crop === undefined
      ? {}
      : await storeCrop(image, originalUrl, receipt.fileName ?? "receipt.jpg", crop);
  const useScanned = !!scannedDate && receipt.dateSource !== "manual";
  const date = useScanned ? toDbDate(scannedDate) : receipt.date;
  const duplicateOfId = await findDuplicate({ ...fields, id: receipt.id, date });

  const updated = await prisma.receipt.update({
    where: { id: receipt.id },
    data: {
      ...fields,
      ...images,
      ...(useScanned ? { date, dateSource: "scanned" } : {}),
      duplicateOfId,
    },
  });

  // The previous crop is replaced (never delete the original photo)
  if (
    "imageUrl" in images &&
    receipt.imageUrl &&
    receipt.imageUrl !== originalUrl &&
    receipt.imageUrl !== images.imageUrl
  ) {
    await deleteImage(receipt.imageUrl, receipt.id);
  }
  res.json(updated);
});

// Correct what the scan got wrong
receiptsRouter.patch("/:id", async (req: AuthRequest, res: Response) => {
  const { date, total, merchantName, receiptNumber, category, paymentMethod } = req.body ?? {};
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

  if (receiptNumber !== undefined) {
    data.receiptNumber =
      typeof receiptNumber === "string" && receiptNumber.trim() ? receiptNumber.trim().replace(/^#/, "") : null;
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

  // Saving a correction means a person has looked at it, so the scan's note is dismissed
  if (Object.keys(data).length) data.scanError = null;

  let receipt = await prisma.receipt.update({ where: { id: exists.id }, data });

  // Number, date and total identify a duplicate, so check again after they change
  const duplicateOfId = await findDuplicate(receipt);
  if (duplicateOfId !== receipt.duplicateOfId) {
    receipt = await prisma.receipt.update({ where: { id: receipt.id }, data: { duplicateOfId } });
  }
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
  if (receipt.imageUrl) await deleteImage(receipt.imageUrl, receipt.id);
  if (receipt.originalImageUrl) await deleteImage(receipt.originalImageUrl, receipt.id);
  res.json({ success: true });
});
