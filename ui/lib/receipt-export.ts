import * as XLSX from "xlsx";

// The receipt fields the export uses (the receipts page's Receipt type fits this)
export interface ExportReceipt {
  date: string; // ISO; only the YYYY-MM-DD part is meaningful
  dateSource: string;
  time: string | null;
  total: number | null;
  vatTotal: number | null;
  merchantName: string | null;
  merchantAddress: string | null;
  merchantTaxNumber: string | null;
  merchantVatNumber: string | null;
  paymentMethod: string | null;
  category: string | null;
  receiptNumber: string | null;
  fiscalCodes: string[];
  vatBreakdown: { group: string; ratePercent: number | null; vat: number }[] | null;
  items:
    | { name: string; quantity: number | null; unitPrice: number | null; amount: number | null; vatGroup: string | null }[]
    | null;
  imageUrl: string | null;
  originalImageUrl: string | null;
  duplicateOfId: string | null;
  scanError: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AMOUNT_FORMAT = "#,##0.00";
const DATE_FORMAT = "dd.mm.yyyy";

// A real Excel date (sortable, filterable), at local midnight so the day doesn't shift
const toSheetDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Apply a number format to whole columns and set their widths
function formatSheet(
  ws: XLSX.WorkSheet,
  widths: number[],
  formats: Record<number, string>
) {
  ws["!cols"] = widths.map((wch) => ({ wch }));
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let r = 1; r <= range.e.r; r++) {
    for (const [col, z] of Object.entries(formats)) {
      const cell = ws[XLSX.utils.encode_cell({ r, c: Number(col) })];
      if (cell && (cell.t === "n" || cell.t === "d")) cell.z = z;
    }
  }
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ r: 0, c: 0 }, { r: range.e.r, c: range.e.c }) };
}

const byDate = (a: ExportReceipt, b: ExportReceipt) =>
  a.date.slice(0, 10).localeCompare(b.date.slice(0, 10)) || (a.time ?? "").localeCompare(b.time ?? "");

export function exportReceiptsToExcel(
  receipts: ExportReceipt[],
  filename: string,
  labels: { category: Record<string, string>; payment: Record<string, string> }
) {
  const list = [...receipts].sort(byDate);
  const wb = XLSX.utils.book_new();

  // Sheet 1: one row per receipt
  const vatGroups = [...new Set(list.flatMap((r) => (r.vatBreakdown ?? []).map((v) => v.group)))].sort();
  const vatGroupLabel = (g: string) => {
    const rate = list.flatMap((r) => r.vatBreakdown ?? []).find((v) => v.group === g)?.ratePercent;
    return rate != null ? `VAT ${g} (${rate}%)` : `VAT ${g}`;
  };
  const receiptRows = list.map((r) => [
    toSheetDate(r.date),
    r.time ?? "",
    r.merchantName ?? "",
    r.merchantAddress ?? "",
    r.merchantTaxNumber ?? "",
    r.merchantVatNumber ?? "",
    r.category ? labels.category[r.category] ?? r.category : "",
    r.paymentMethod ? labels.payment[r.paymentMethod] ?? r.paymentMethod : "",
    r.receiptNumber ?? "",
    ...vatGroups.map((g) => (r.vatBreakdown ?? []).find((v) => v.group === g)?.vat ?? ""),
    r.vatTotal ?? "",
    r.total ?? "",
    r.fiscalCodes.join(", "),
    r.dateSource === "manual" ? "Manual" : r.dateSource === "upload" ? "Upload day (not read)" : "Scanned",
    [r.duplicateOfId && "Possible duplicate", r.scanError].filter(Boolean).join("; "),
    r.originalImageUrl ?? r.imageUrl ?? "",
  ]);
  const totalCol = 9 + vatGroups.length + 1;
  const receiptsSheet = XLSX.utils.aoa_to_sheet(
    [
      [
        "Date", "Time", "Merchant", "Address", "ЕДБ", "VAT no.", "Category", "Payment", "Receipt no.",
        ...vatGroups.map(vatGroupLabel), "VAT total", "Total (MKD)", "Fiscal codes", "Date source", "Notes", "Photo",
      ],
      ...receiptRows,
    ],
    { cellDates: true }
  );
  const amountCols = Object.fromEntries(
    Array.from({ length: vatGroups.length + 2 }, (_, i) => [9 + i, AMOUNT_FORMAT])
  );
  formatSheet(
    receiptsSheet,
    [12, 7, 30, 35, 16, 18, 12, 12, 12, ...vatGroups.map(() => 12), 12, 14, 24, 20, 30, 50],
    { 0: DATE_FORMAT, ...amountCols }
  );
  // Grand total under the table
  const last = receiptRows.length + 1;
  if (receiptRows.length) {
    const sumRow = last + 1; // one blank row, 0-based index
    const col = (c: number) => XLSX.utils.encode_col(c);
    XLSX.utils.sheet_add_aoa(receiptsSheet, [["Total"]], { origin: { r: sumRow, c: 0 } });
    for (let c = 9; c <= totalCol; c++) {
      // The value is stored too: the writer drops formula cells without one, and viewers that
      // don't recalculate show it
      const value = receiptRows.reduce((s, row) => s + (typeof row[c] === "number" ? (row[c] as number) : 0), 0);
      receiptsSheet[XLSX.utils.encode_cell({ r: sumRow, c })] = {
        t: "n",
        v: Math.round(value * 100) / 100,
        f: `SUM(${col(c)}2:${col(c)}${last})`,
        z: AMOUNT_FORMAT,
      };
    }
    const ref = XLSX.utils.decode_range(receiptsSheet["!ref"]!);
    ref.e.r = Math.max(ref.e.r, sumRow);
    receiptsSheet["!ref"] = XLSX.utils.encode_range(ref);
  }
  XLSX.utils.book_append_sheet(wb, receiptsSheet, "Receipts");

  // Sheet 2: totals per month
  const months = new Map<string, { count: number; vat: number; total: number }>();
  for (const r of list) {
    const key = r.date.slice(0, 7);
    const m = months.get(key) ?? { count: 0, vat: 0, total: 0 };
    m.count++;
    m.vat += r.vatTotal ?? 0;
    m.total += r.total ?? 0;
    months.set(key, m);
  }
  const monthRows = [...months.entries()].map(([key, m]) => {
    const [y, mo] = key.split("-").map(Number);
    return [`${MONTHS[mo - 1]} ${y}`, m.count, m.vat, m.total];
  });
  const sum = (i: number) => monthRows.reduce((s, row) => s + (row[i] as number), 0);
  const monthsSheet = XLSX.utils.aoa_to_sheet([
    ["Month", "Receipts", "VAT (MKD)", "Total (MKD)"],
    ...monthRows,
    [],
    ["Total", sum(1), sum(2), sum(3)],
  ]);
  formatSheet(monthsSheet, [18, 10, 14, 14], { 2: AMOUNT_FORMAT, 3: AMOUNT_FORMAT });
  delete monthsSheet["!autofilter"];
  XLSX.utils.book_append_sheet(wb, monthsSheet, "By month");

  // Sheet 3: every line item, with the receipt it came from
  const itemRows = list.flatMap((r) =>
    (r.items ?? []).map((i) => [
      toSheetDate(r.date),
      r.merchantName ?? "",
      r.receiptNumber ?? "",
      i.name,
      i.quantity ?? "",
      i.unitPrice ?? "",
      i.amount ?? "",
      i.vatGroup ?? "",
    ])
  );
  const itemsSheet = XLSX.utils.aoa_to_sheet(
    [["Date", "Merchant", "Receipt no.", "Item", "Qty", "Unit price", "Amount", "VAT group"], ...itemRows],
    { cellDates: true }
  );
  formatSheet(itemsSheet, [12, 30, 12, 40, 8, 12, 12, 10], {
    0: DATE_FORMAT,
    5: AMOUNT_FORMAT,
    6: AMOUNT_FORMAT,
  });
  XLSX.utils.book_append_sheet(wb, itemsSheet, "Items");

  XLSX.writeFile(wb, filename, { cellDates: true });
}
