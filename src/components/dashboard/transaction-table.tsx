"use client";

import { useState, useMemo, useOptimistic, useTransition } from "react";
import { Download, Repeat, Search, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { exportTransactionsToCsv } from "@/lib/csv-export";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Transaction } from "@/types/database";

const PAGE_SIZE = 12;

export function TransactionTable({
  transactions,
  activeOverviewMonth,
}: {
  transactions: Transaction[];
  activeOverviewMonth?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const [optimisticTransactions, removeOptimisticTransaction] = useOptimistic(
    transactions,
    (currentState, deletedId: string) =>
      currentState.filter((tx) => tx.id !== deletedId),
  );

  // Extract available months from transaction history for the table's own month filter
  const monthOptions = useMemo(() => {
    const set = new Set(optimisticTransactions.map((t) => t.date.slice(0, 7)));
    if (activeOverviewMonth) set.add(activeOverviewMonth);
    const sorted = Array.from(set).sort().reverse();
    return [
      { label: "All Months (Full History)", value: "ALL" },
      ...sorted.map((m) => {
        const [y, mo] = m.split("-").map(Number);
        const label = new Date(y, mo - 1, 1).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        return { label, value: m };
      }),
    ];
  }, [optimisticTransactions, activeOverviewMonth]);

  const handleOptimisticDelete = (id: string) => {
    startTransition(async () => {
      removeOptimisticTransaction(id);
      await deleteTransaction(id);
    });
  };

  const categories = useMemo(() => {
    const set = new Set(optimisticTransactions.map((t) => t.category));
    return [
      { label: "All Categories", value: "ALL" },
      ...Array.from(set).map((c) => ({ label: c, value: c })),
    ];
  }, [optimisticTransactions]);

  const methods = useMemo(() => {
    const set = new Set(
      optimisticTransactions.map((t) => t.payment_method).filter(Boolean),
    );
    return [
      { label: "All Methods", value: "ALL" },
      ...Array.from(set).map((m) => ({ label: m!, value: m! })),
    ];
  }, [optimisticTransactions]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return optimisticTransactions.filter((tx) => {
      const matchesSearch =
        (tx.counterparty ?? "").toLowerCase().includes(q) ||
        (tx.notes ?? "").toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q);

      const matchesMonth =
        selectedMonth === "ALL" || tx.date.startsWith(selectedMonth);
      const matchesCat =
        selectedCategory === "ALL" || tx.category === selectedCategory;
      const matchesMethod =
        selectedMethod === "ALL" || tx.payment_method === selectedMethod;

      return matchesSearch && matchesMonth && matchesCat && matchesMethod;
    });
  }, [
    optimisticTransactions,
    searchQuery,
    selectedMonth,
    selectedCategory,
    selectedMethod,
  ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  if (optimisticTransactions.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-slate-500">
          No transactions recorded yet. Click &ldquo;Add Transaction&rdquo; to
          get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search payee, notes, category, amount..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Select
              options={monthOptions}
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              options={categories}
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Select
              options={methods}
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={filtered.length === 0}
            onClick={() =>
              exportTransactionsToCsv(filtered, "filtered-expenses")
            }
            className="shrink-0"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV ({filtered.length})
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Payee / Sender</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    No matching transactions found.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => {
                  const isIncome = tx.type === "INCOME";
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {tx.date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                        {tx.counterparty || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
                            {tx.category}
                          </span>
                          {tx.recurring_rule_id && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700"
                              title="Recurring Transaction"
                            >
                              <Repeat className="h-3 w-3" />
                              Auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {tx.payment_method ?? "—"}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                        {tx.notes ?? "—"}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                          isIncome ? "text-emerald-600" : "text-slate-900"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleOptimisticDelete(tx.id)}
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-600">
            <span>
              Page <strong className="text-slate-900">{currentPage}</strong> of{" "}
              <strong className="text-slate-900">{totalPages}</strong> (
              {filtered.length} entries)
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
