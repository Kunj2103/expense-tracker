"use client";

import { useState, useMemo } from "react";
import { Calendar, BarChart3, PieChart } from "lucide-react";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BudgetCutoffCard } from "@/components/dashboard/budget-cutoff-card";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, UserSettings } from "@/types/database";

interface MonthlyOverviewSectionProps {
  transactions: Transaction[];
  settings: UserSettings;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function MonthlyOverviewSection({
  transactions,
  settings,
  selectedMonth,
  onMonthChange,
}: MonthlyOverviewSectionProps) {
  // 1. Generate trailing 6 months list
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

  // 2. Compute Summary Stats & Category Breakdown for `selectedMonth`
  const { stats, categoryBreakdown } = useMemo(() => {
    let totalEarned = 0;
    let totalSpent = 0;
    const catMap = new Map<string, number>();

    for (const tx of transactions) {
      if (tx.date.startsWith(selectedMonth)) {
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

    return {
      stats: {
        totalEarned,
        totalSpent,
        remainingBalance: totalEarned - totalSpent,
      },
      categoryBreakdown: breakdown,
    };
  }, [transactions, selectedMonth]);

  // 3. Compute 6-Month Cash Flow Bars
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

  const activeMonthLabel =
    monthOptions.find((m) => m.key === selectedMonth)?.fullLabel ??
    selectedMonth;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 shadow-2xs sm:p-6 space-y-5">
      {/* Scoped Section Header + Month Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Monthly Financial Overview
          </h2>
          <p className="text-xs text-slate-500">
            Showing summary metrics, budget guard, and category split for{" "}
            <strong className="text-slate-800">{activeMonthLabel}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
          <Calendar className="h-4 w-4 text-indigo-600" />
          <label htmlFor="overview-month" className="sr-only">
            Select Overview Month
          </label>
          <select
            id="overview-month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            {[...monthOptions].reverse().map((m) => (
              <option key={m.key} value={m.key}>
                {m.fullLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Scoped Monthly Summary Cards */}
      <SummaryCards stats={stats} />

      {/* 2. Scoped Monthly Budget Cutoff Bar */}
      <BudgetCutoffCard settings={settings} totalSpent={stats.totalSpent} />

      {/* 3. Interactive 6-Month Chart + Scoped Category Breakdown */}
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
                  Click any month bar to inspect its breakdown
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
              const isSelected = t.key === selectedMonth;

              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onMonthChange(t.key)}
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
                  Category Split ({activeMonthLabel})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Where your money went in {activeMonthLabel}
                </p>
              </div>
            </div>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-xs text-slate-400">
              No expenses recorded in {activeMonthLabel}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {categoryBreakdown.slice(0, 4).map((item) => (
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
