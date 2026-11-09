"use client";

import { useState, useMemo } from "react";
import { Calendar, BarChart3, PieChart } from "lucide-react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BudgetCutoffCard } from "@/components/dashboard/budget-cutoff-card";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, UserSettings } from "@/types/database";

export type FilterPeriodMode = "DAILY" | "MONTHLY" | "YEARLY" | "CUSTOM";

interface OverviewSectionProps {
  transactions: Transaction[];
  settings: UserSettings;
}

export function MonthlyOverviewSection({
  transactions,
  settings,
}: OverviewSectionProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.slice(0, 7);
  const currentYearStr = todayStr.slice(0, 4);

  const [periodMode, setPeriodMode] = useState<FilterPeriodMode>("MONTHLY");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [customStart, setCustomStart] = useState<string>(
    `${currentMonthStr}-01`,
  );
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // Generate trailing 6 months list
  const monthOptions = useMemo(() => {
    const list: { key: string; shortLabel: string; fullLabel: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const shortLabel = d.toLocaleString("default", { month: "short" });
      const fullLabel = d.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      list.push({ key, shortLabel, fullLabel });
    }
    return list;
  }, []);

  // Generate available years
  const yearOptions = useMemo(() => {
    const years = new Set<string>([currentYearStr]);
    for (const tx of transactions) {
      years.add(tx.date.slice(0, 4));
    }
    return Array.from(years).sort().reverse();
  }, [transactions, currentYearStr]);

  // Filter transactions based on active periodMode
  const { stats, categoryBreakdown, activePeriodLabel } = useMemo(() => {
    let totalEarned = 0;
    let totalSpent = 0;
    const catMap = new Map<string, number>();

    const matchesPeriod = (dateStr: string) => {
      if (periodMode === "DAILY") return dateStr === selectedDate;
      if (periodMode === "MONTHLY") return dateStr.startsWith(selectedMonth);
      if (periodMode === "YEARLY") return dateStr.startsWith(selectedYear);
      return dateStr >= customStart && dateStr <= customEnd;
    };

    for (const tx of transactions) {
      if (matchesPeriod(tx.date)) {
        const amt = Number(tx.amount);
        if (tx.type === "INCOME") {
          totalEarned += amt;
        } else {
          totalSpent += amt;
          catMap.set(tx.category, (catMap.get(tx.category) ?? 0) + amt);
        }
      }
    }

    const breakdown = Array.from(catMap.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage: totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    let label = "";
    if (periodMode === "DAILY") label = `Day: ${selectedDate}`;
    else if (periodMode === "MONTHLY") {
      label =
        monthOptions.find((m) => m.key === selectedMonth)?.fullLabel ??
        selectedMonth;
    } else if (periodMode === "YEARLY") label = `Year ${selectedYear}`;
    else label = `${customStart} to ${customEnd}`;

    return {
      stats: {
        totalEarned,
        totalSpent,
        remainingBalance: totalEarned - totalSpent,
      },
      categoryBreakdown: breakdown,
      activePeriodLabel: label,
    };
  }, [
    transactions,
    periodMode,
    selectedDate,
    selectedMonth,
    selectedYear,
    customStart,
    customEnd,
    monthOptions,
  ]);

  // Compute current calendar month's spend specifically for the Monthly Budget Guard
  const currentMonthSpend = useMemo(() => {
    const targetMonth =
      periodMode === "MONTHLY" ? selectedMonth : currentMonthStr;
    return transactions
      .filter((tx) => tx.type === "EXPENSE" && tx.date.startsWith(targetMonth))
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }, [transactions, periodMode, selectedMonth, currentMonthStr]);

  // 6-Month Cash Flow Bars
  const sixMonthTrends = useMemo(() => {
    return monthOptions.map((m) => {
      let earned = 0;
      let spent = 0;
      for (const tx of transactions) {
        if (tx.date.startsWith(m.key)) {
          if (tx.type === "INCOME") earned += Number(tx.amount);
          else spent += Number(tx.amount);
        }
      }
      return { ...m, earned, spent };
    });
  }, [transactions, monthOptions]);

  const maxTrendAmount = Math.max(
    ...sixMonthTrends.map((t) => Math.max(t.earned, t.spent)),
    1000,
  );

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-2xs sm:p-6 space-y-5">
      {/* Header + Multi-Mode Timeframe Filter */}
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Financial Overview & Cash Flow
          </h2>
          <p className="text-xs text-slate-500">
            Showing Credit vs. Debit summary for{" "}
            <strong className="text-indigo-700">{activePeriodLabel}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Tabs: Daily | Monthly | Yearly | Custom */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-medium">
            {(
              ["DAILY", "MONTHLY", "YEARLY", "CUSTOM"] as FilterPeriodMode[]
            ).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPeriodMode(mode)}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  periodMode === mode
                    ? "bg-white font-semibold text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {mode === "DAILY"
                  ? "Daily"
                  : mode === "MONTHLY"
                    ? "Monthly"
                    : mode === "YEARLY"
                      ? "Yearly"
                      : "Custom Range"}
              </button>
            ))}
          </div>

          {/* Dynamic Picker per Mode */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
            <Calendar className="h-4 w-4 text-indigo-600 shrink-0" />

            {periodMode === "DAILY" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none"
              />
            )}

            {periodMode === "MONTHLY" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
              >
                {[...monthOptions].reverse().map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.fullLabel}
                  </option>
                ))}
              </select>
            )}

            {periodMode === "YEARLY" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            )}

            {periodMode === "CUSTOM" && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-transparent font-semibold text-slate-900 focus:outline-none"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-transparent font-semibold text-slate-900 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards for Active Period */}
      <SummaryCards stats={stats} />

      {/* Monthly Budget Guard */}
      <BudgetCutoffCard settings={settings} totalSpent={currentMonthSpend} />

      {/* 6-Month Cash Flow + Active Period Category Split */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  6-Month Cash Flow
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click any month bar to inspect that month
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
                Earned
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Spent
              </span>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2 pt-2">
            {sixMonthTrends.map((t) => {
              const earnedHeight = Math.round(
                (t.earned / maxTrendAmount) * 105,
              );
              const spentHeight = Math.round((t.spent / maxTrendAmount) * 105);
              const isSelected =
                periodMode === "MONTHLY" && t.key === selectedMonth;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setPeriodMode("MONTHLY");
                    setSelectedMonth(t.key);
                  }}
                  className={`group flex flex-col items-center gap-2 rounded-xl p-2 transition-all ${
                    isSelected
                      ? "bg-indigo-50/80 ring-1 ring-indigo-200"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex h-28 w-full items-end justify-center gap-1 border-b border-slate-200/70 pb-1">
                    <div
                      style={{ height: `${Math.max(earnedHeight, 4)}px` }}
                      className="w-2.5 rounded-t bg-emerald-500 transition-all"
                      title={`Earned: ${formatCurrency(t.earned)}`}
                    />
                    <div
                      style={{ height: `${Math.max(spentHeight, 4)}px` }}
                      className="w-2.5 rounded-t bg-slate-900 transition-all"
                      title={`Spent: ${formatCurrency(t.spent)}`}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isSelected ? "text-indigo-700" : "text-slate-500"
                    }`}
                  >
                    {t.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <PieChart className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Category Split ({activePeriodLabel})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Top expense categories in this period
                </p>
              </div>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-400">
              No expenses recorded in {activePeriodLabel}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {categoryBreakdown.slice(0, 5).map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      {item.category}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(item.total)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
