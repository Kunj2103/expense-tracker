import type { Transaction } from "@/types/database";

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportTransactionsToCsv(
  transactions: Transaction[],
  filenamePrefix = "expense-ledger"
) {
  if (transactions.length === 0) return;

  const headers = [
    "Date",
    "Type",
    "Amount (INR)",
    "Category",
    "Payee / Sender",
    "Payment Method",
    "Notes",
    "Recurring",
  ];

  const rows = transactions.map((tx) => [
    escapeCsvCell(tx.date),
    escapeCsvCell(tx.type),
    escapeCsvCell(tx.amount.toFixed(2)),
    escapeCsvCell(tx.category),
    escapeCsvCell(tx.counterparty ?? ""),
    escapeCsvCell(tx.payment_method ?? ""),
    escapeCsvCell(tx.notes ?? ""),
    escapeCsvCell(tx.recurring_rule_id ? "Yes" : "No"),
  ]);

  const csvContent =
    "\uFEFF" +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStamp = new Date().toISOString().split("T")[0];

  link.href = url;
  link.setAttribute("download", `${filenamePrefix}-${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}