"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

// A locale-independent date field: always shown and typed as dd-mm-yyyy.
// The native <input type="date"> follows the browser's locale (mm/dd/yyyy in
// en-US browsers), which led to swapped day/month on saved birthdays.
// The value given to and reported by this component is ISO "yyyy-mm-dd" (or ""),
// same as the native date input, so forms and the API don't change.
// While the typed text is incomplete or not a real date, the raw text is reported
// so form validation (see isoDateOrEmpty) can flag it instead of saving it.

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isoDateOrEmpty(value: string | undefined): boolean {
  return !value || ISO_DATE_RE.test(value);
}

function isoToDisplay(iso: string | undefined | null): string {
  if (!iso || !ISO_DATE_RE.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function displayToIso(text: string): string | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(text);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

// Keeps digits only and inserts the dashes: "11081990" -> "11-08-1990"
function maskDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join("-");
}

type DateInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value?: string | null;
  onChange?: (value: string) => void;
};

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [text, setText] = React.useState(() => isoToDisplay(value));

    // Sync when the value changes from outside (e.g. form reset after loading data)
    React.useEffect(() => {
      setText((current) => {
        const currentIso = displayToIso(current) ?? (current === "" ? "" : current);
        return currentIso === (value ?? "") ? current : isoToDisplay(value);
      });
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = maskDigits(e.target.value);
      setText(next);
      if (next === "") onChange?.("");
      else onChange?.(displayToIso(next) ?? next);
    };

    const invalid = text !== "" && displayToIso(text) === null;

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="dd-mm-yyyy"
        maxLength={10}
        autoComplete="off"
        {...props}
        aria-invalid={invalid || props["aria-invalid"]}
        value={text}
        onChange={handleChange}
      />
    );
  }
);
DateInput.displayName = "DateInput";
