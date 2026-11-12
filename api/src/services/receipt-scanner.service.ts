import sharp from "sharp";
import { askForJson } from "../lib/anthropic";

// Reads photographed Macedonian fiscal receipts (ФИСКАЛНА СМЕТКА).
// Haiku is plenty for printed text and costs a fraction of a cent per receipt.
export const RECEIPT_MODEL = process.env.RECEIPT_SCAN_MODEL || "claude-haiku-5-5";
const RECEIPT_EFFORT = (process.env.RECEIPT_SCAN_EFFORT || "low") as "low" | "medium" | "high";

// Long edge in px; keeps text legible and the request well under the 5MB per-image limit
const MAX_EDGE = 2000;

export const PAYMENT_METHODS = ["cash", "card", "mixed", "unknown"] as const;
export const RECEIPT_CATEGORIES = [
  "restaurant",
  "groceries",
  "fuel",
  "office",
  "transport",
  "utilities",
  "other",
] as const;

const SYSTEM = `You read photographed Macedonian fiscal receipts ("ФИСКАЛНА СМЕТКА") and return their contents as JSON.

Reading rules:
- Numbers use a comma as the decimal separator ("2780,00" means 2780). Return plain numbers.
- The receipt font draws zero with a mark inside; don't read it as 8. Check that line items add up to the total and that the VAT lines are consistent when they are legible.
- Copy names and addresses as printed, in Cyrillic, with normal capitalisation fixed only where obvious.
- Use null (or an empty list) for anything you can't read with confidence; never guess a date, an amount or an identifier.

Fields:
- date: purchase date printed after "ДАТУМ" (DD-MM-YYYY on the receipt), returned as YYYY-MM-DD.
- time: time printed after "ЧАС", as HH:MM.
- total: receipt total in MKD ("ВКУПЕН ПРОМЕТ"; else the payment line).
- merchantName: the business name at the top (e.g. "ГЕНЕРАЛ ЛОРД ДООЕЛ").
- merchantAddress: the address of the shop where the purchase happened (the branch / "ПОДРУЖНИЦА" address when one is printed, else the head office address).
- merchantTaxNumber: the number after "ДАН. БРОЈ" / "ЕДБ".
- merchantVatNumber: the number after "ДДВ БРОЈ" (usually starts with MK).
- paymentMethod: "cash" for "ВО ГОТОВО", "card" for card ("КАРТИЧКА"), "mixed" when both, else "unknown".
- category: what kind of spending this is, inferred from the merchant and items: restaurant (restaurants, cafés, bars, food delivery), groceries, fuel, office (office supplies, equipment), transport (taxi, parking, tolls, tickets), utilities, or other.
- receiptNumber: the receipt number printed under the title (e.g. "#0023" -> "0023").
- fiscalCodes: the fiscal device / signature codes near the bottom (e.g. "AC415815989"), as printed.
- vatTotal: total VAT ("ВКУПНО ДДВ").
- vatBreakdown: one entry per VAT group with a non-zero amount: group letter as printed (А, Б, В, Г), its rate in percent, and the VAT amount.
- items: every line item: name as printed, quantity, unit price, line amount, and VAT group letter.
- receiptBox: the smallest rectangle around the whole paper receipt in the image, in pixels of the image as given (its size is stated in the message): left, top, right, bottom. Include the entire paper, from its top edge to its bottom edge, even where it's curled or partly in shadow. Null when the receipt fills the image or you can't tell where it is.`;

const nullable = (type: string) => ({ type: [type, "null"] });

const SCHEMA = {
  type: "object",
  properties: {
    date: { ...nullable("string"), description: "YYYY-MM-DD" },
    time: { ...nullable("string"), description: "HH:MM" },
    total: nullable("number"),
    merchantName: nullable("string"),
    merchantAddress: nullable("string"),
    merchantTaxNumber: nullable("string"),
    merchantVatNumber: nullable("string"),
    paymentMethod: { type: "string", enum: [...PAYMENT_METHODS] },
    category: { type: "string", enum: [...RECEIPT_CATEGORIES] },
    receiptNumber: nullable("string"),
    fiscalCodes: { type: "array", items: { type: "string" } },
    vatTotal: nullable("number"),
    vatBreakdown: {
      type: "array",
      items: {
        type: "object",
        properties: {
          group: { type: "string" },
          ratePercent: nullable("number"),
          vat: { type: "number" },
        },
        required: ["group", "ratePercent", "vat"],
        additionalProperties: false,
      },
    },
    receiptBox: {
      anyOf: [
        {
          type: "object",
          properties: {
            left: { type: "number" },
            top: { type: "number" },
            right: { type: "number" },
            bottom: { type: "number" },
          },
          required: ["left", "top", "right", "bottom"],
          additionalProperties: false,
        },
        { type: "null" },
      ],
    },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: nullable("number"),
          unitPrice: nullable("number"),
          amount: nullable("number"),
          vatGroup: nullable("string"),
        },
        required: ["name", "quantity", "unitPrice", "amount", "vatGroup"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "date", "time", "total", "merchantName", "merchantAddress", "merchantTaxNumber",
    "merchantVatNumber", "paymentMethod", "category", "receiptNumber", "fiscalCodes",
    "vatTotal", "vatBreakdown", "items", "receiptBox",
  ],
  additionalProperties: false,
};

export type ReceiptItem = {
  name: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
  vatGroup: string | null;
};
export type VatLine = { group: string; ratePercent: number | null; vat: number };

export type ReceiptScan = {
  date: string | null;
  time: string | null;
  total: number | null;
  merchantName: string | null;
  merchantAddress: string | null;
  merchantTaxNumber: string | null;
  merchantVatNumber: string | null;
  paymentMethod: (typeof PAYMENT_METHODS)[number];
  category: (typeof RECEIPT_CATEGORIES)[number];
  receiptNumber: string | null;
  fiscalCodes: string[];
  vatTotal: number | null;
  vatBreakdown: VatLine[];
  items: ReceiptItem[];
};

type Box = { left: number; top: number; right: number; bottom: number };
// Region of the (EXIF-rotated) original photo to keep
export type CropArea = { left: number; top: number; width: number; height: number };

// Margin around the box the model reports, as a share of the box size, so a slightly
// off estimate doesn't cut the receipt's edge
const CROP_MARGIN = 0.04;

// Turn the model's box (in pixels of the image it saw) into a crop of the original photo.
// Null when the box is unusable or the receipt already fills most of the photo.
function toCropArea(
  box: Box | null | undefined,
  sent: { width: number; height: number },
  original: { width: number; height: number }
): CropArea | null {
  if (!box) return null;
  const { left, top, right, bottom } = box;
  if (![left, top, right, bottom].every(Number.isFinite) || right <= left || bottom <= top) return null;

  const scaleX = original.width / sent.width;
  const scaleY = original.height / sent.height;
  const marginX = (right - left) * CROP_MARGIN;
  const marginY = (bottom - top) * CROP_MARGIN;
  const x0 = Math.max(0, Math.floor((left - marginX) * scaleX));
  const y0 = Math.max(0, Math.floor((top - marginY) * scaleY));
  const x1 = Math.min(original.width, Math.ceil((right + marginX) * scaleX));
  const y1 = Math.min(original.height, Math.ceil((bottom + marginY) * scaleY));
  const width = x1 - x0;
  const height = y1 - y0;

  // Too small to be the receipt, or so large that cropping gains nothing
  const share = (width * height) / (original.width * original.height);
  if (width < 50 || height < 50 || share > 0.85) return null;
  return { left: x0, top: y0, width, height };
}

// The original photo cut down to the receipt, as JPEG
export async function cropReceiptImage(image: Buffer, area: CropArea): Promise<Buffer> {
  return sharp(image).rotate().extract(area).jpeg({ quality: 90 }).toBuffer();
}

// A YYYY-MM-DD that is a real calendar day, not in the future and not absurdly old
export function isPlausibleReceiptDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
  return date.getUTCFullYear() >= 2015 && date.getTime() <= tomorrow;
}

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const amount = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);

// `warning`: the scan looks internally inconsistent and should be checked by a person.
// `crop`: where the receipt is in the original photo, when there's background worth cutting away.
export async function scanReceipt(
  image: Buffer
): Promise<ReceiptScan & { warning: string | null; crop: CropArea | null }> {
  // Size after the phone's EXIF rotation is applied
  const meta = await sharp(image).rotate().metadata();
  const rotated90 = (meta.orientation ?? 1) >= 5;
  const original = {
    width: (rotated90 ? meta.height : meta.width) ?? 0,
    height: (rotated90 ? meta.width : meta.height) ?? 0,
  };

  const { data: jpeg, info: sent } = await sharp(image)
    .rotate() // honour the phone's EXIF orientation
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer({ resolveWithObject: true });

  const r = await askForJson<ReceiptScan & { receiptBox: Box | null }>({
    model: RECEIPT_MODEL,
    system: SYSTEM,
    schema: SCHEMA,
    subject: "receipt",
    effort: RECEIPT_EFFORT,
    content: [
      {
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") },
      },
      { type: "text", text: `Read this receipt. The image is ${sent.width}×${sent.height} pixels.` },
    ],
  });

  const time = text(r.time);
  const vatBreakdown = (r.vatBreakdown ?? []).filter((v) => text(v.group) && amount(v.vat) !== null);
  const items = (r.items ?? []).filter((i) => text(i.name));
  const total = amount(r.total) || null;

  // The per-rate VAT lines are printed twice on the receipt, the VAT total once; when they
  // disagree the single number is the misread one (seen: 340,25 read as 348,25)
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const vatSum = vatBreakdown.length ? round2(vatBreakdown.reduce((s, v) => s + v.vat, 0)) : null;
  const vatTotal = vatSum ?? amount(r.vatTotal);

  // Line items should add up to the total; a mismatch means something was misread
  const itemAmounts = items.map((i) => i.amount);
  const itemsSum = itemAmounts.every((a): a is number => typeof a === "number")
    ? round2(itemAmounts.reduce((s, a) => s + a, 0))
    : null;
  const warning =
    total !== null && itemsSum !== null && items.length && Math.abs(itemsSum - total) > 0.01
      ? `Line items add up to ${itemsSum}, not ${total}; check the total`
      : null;

  return {
    warning,
    crop: original.width && original.height ? toCropArea(r.receiptBox, sent, original) : null,
    date: isPlausibleReceiptDate(r.date) ? r.date : null,
    time: time && /^\d{2}:\d{2}$/.test(time) ? time : null,
    total,
    merchantName: text(r.merchantName),
    merchantAddress: text(r.merchantAddress),
    merchantTaxNumber: text(r.merchantTaxNumber)?.replace(/\s/g, "") ?? null,
    merchantVatNumber: text(r.merchantVatNumber)?.replace(/\s/g, "") ?? null,
    paymentMethod: PAYMENT_METHODS.includes(r.paymentMethod) ? r.paymentMethod : "unknown",
    category: RECEIPT_CATEGORIES.includes(r.category) ? r.category : "other",
    receiptNumber: text(r.receiptNumber)?.replace(/^#/, "") ?? null,
    fiscalCodes: (r.fiscalCodes ?? []).map(text).filter((c): c is string => !!c),
    vatTotal,
    vatBreakdown,
    items,
  };
}
