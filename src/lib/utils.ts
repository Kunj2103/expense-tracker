import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RecurringFrequency } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  return { start, end };
}

export function calculateNextRunDate(
  currentDateStr: string,
  frequency: RecurringFrequency
): string {
  const [year, month, day] = currentDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (frequency === "DAILY") date.setUTCDate(date.getUTCDate() + 1);
  if (frequency === "WEEKLY") date.setUTCDate(date.getUTCDate() + 7);
  if (frequency === "MONTHLY") date.setUTCMonth(date.getUTCMonth() + 1);
  if (frequency === "YEARLY") date.setUTCFullYear(date.getUTCFullYear() + 1);

  return date.toISOString().split("T")[0];
}

export const IS_DEV =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_DEMO_TOOLS === "true";