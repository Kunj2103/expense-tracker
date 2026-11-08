"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Command,
  Download,
  PlusCircle,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { exportTransactionsToCsv } from "@/lib/csv-export";
import { formatCurrency, IS_DEV } from "@/lib/utils";
import type { Transaction } from "@/types/database";

export function CommandPalette({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const quickActions = useMemo(
    () => [
      {
        id: "new-upi",
        label: "Log Quick UPI Expense",
        icon: PlusCircle,
        action: () => {
          setIsOpen(false);
          router.push("/dashboard?quickAdd=true&method=UPI");
        },
      },
      ...(IS_DEV
        ? [
            {
              id: "sim-sms",
              label: "[Dev] Simulate Bank SMS Auto-Parse (₹420 Swiggy)",
              icon: Sparkles,
              action: () => {
                setIsOpen(false);
                const sms = encodeURIComponent(
                  "Rs. 420.00 debited from A/c XX1234 via UPI to Swiggy on 08-11-26",
                );
                router.push(`/dashboard?sms=${sms}`);
              },
            },
          ]
        : []),
      {
        id: "export-csv",
        label: `Export All Transactions to CSV (${transactions.length} rows)`,
        icon: Download,
        action: () => {
          exportTransactionsToCsv(transactions, "full-expense-ledger");
          setIsOpen(false);
        },
      },
    ],
    [router, transactions],
  );

  const monthShortcuts = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      list.push({ val, label });
    }
    return list;
  }, []);

  const filteredActions = quickActions.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  const matchingTransactions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return transactions
      .filter(
        (tx) =>
          (tx.counterparty ?? "").toLowerCase().includes(q) ||
          (tx.notes ?? "").toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q),
      )
      .slice(0, 5);
  }, [transactions, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
      >
        <Search className="h-3.5 w-3.5 text-slate-400" />
        <span>Quick Command...</span>
        <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
          Ctrl K
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center border-b border-slate-200 px-4">
              <Command className="mr-2.5 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, payee, category, or month..."
                className="h-12 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:bg-slate-200"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 space-y-3">
              {filteredActions.length > 0 && (
                <div>
                  <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Quick Actions
                  </p>
                  {filteredActions.map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={act.action}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-indigo-600" />
                          {act.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              )}

              <div>
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Jump to Month
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {monthShortcuts.map((m) => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/dashboard?month=${m.val}`);
                      }}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {matchingTransactions.length > 0 && (
                <div>
                  <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Matching Transactions
                  </p>
                  {matchingTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs hover:bg-slate-50"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">
                          {tx.counterparty || tx.category}
                        </span>
                        <span className="ml-2 text-slate-400">{tx.date}</span>
                      </div>
                      <span
                        className={`font-semibold ${
                          tx.type === "INCOME"
                            ? "text-emerald-600"
                            : "text-slate-900"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
