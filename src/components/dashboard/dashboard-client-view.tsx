"use client";

import { useState, Suspense } from "react";
import { MonthlyOverviewSection } from "@/components/dashboard/monthly-overview-section";
import { RecurringRulesList } from "@/components/dashboard/recurring-rules-list";
import { TransactionModal } from "@/components/dashboard/transaction-modal";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import type {
  CounterpartySuggestion,
  RecurringRule,
  Transaction,
  UserSettings,
} from "@/types/database";

interface DashboardClientViewProps {
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  settings: UserSettings;
  suggestions: CounterpartySuggestion[];
}

export function DashboardClientView({
  transactions,
  recurringRules,
  settings,
  suggestions,
}: DashboardClientViewProps) {
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Zone 1: Scoped Monthly Overview (Cards + Budget + Trend + Category) */}
      <MonthlyOverviewSection
        transactions={transactions}
        settings={settings}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      {/* Zone 2: Global Active Recurring Subscriptions */}
      <RecurringRulesList rules={recurringRules} />

      {/* Zone 3: Full Transaction Ledger with Independent / Synced Month Filter */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Transaction Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Search and filter across all historical months or isolate a
              specific month
            </p>
          </div>
          <Suspense fallback={null}>
            <TransactionModal suggestions={suggestions} />
          </Suspense>
        </div>

        <TransactionTable
          transactions={transactions}
          activeOverviewMonth={selectedMonth}
        />
      </section>
    </main>
  );
}
