"use client";

import { useState, Suspense } from "react";
import { LayoutDashboard, ListFilter, Repeat } from "lucide-react";
import { MonthlyOverviewSection } from "@/components/dashboard/monthly-overview-section";
import { RecurringRulesList } from "@/components/dashboard/recurring-rules-list";
import { TransactionModal } from "@/components/dashboard/transaction-modal";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { Card } from "@/components/ui/card";
import type {
  CounterpartySuggestion,
  RecurringRule,
  Transaction,
  UserSettings,
} from "@/types/database";

type ActiveTab = "OVERVIEW" | "LEDGER" | "RECURRING";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("OVERVIEW");

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("OVERVIEW")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "OVERVIEW"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Overview & Analytics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("LEDGER")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "LEDGER"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            Transactions ({transactions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RECURRING")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === "RECURRING"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
            Subscriptions ({recurringRules.length})
          </button>
        </div>

        {/* Global Add Transaction Modal (Always mounted so ?sms= deep links work on any tab) */}
        <Suspense fallback={null}>
          <TransactionModal suggestions={suggestions} />
        </Suspense>
      </div>

      {/* Tab 1: Financial Overview & Recent 5 Transactions Preview */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <MonthlyOverviewSection
            transactions={transactions}
            settings={settings}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Recent Transactions
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("LEDGER")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                View Full Ledger &rarr;
              </button>
            </div>
            <TransactionTable
              transactions={transactions.slice(0, 5)}
              suggestions={suggestions}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Dedicated Full Ledger View */}
      {activeTab === "LEDGER" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Complete Transaction Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Search, filter, edit, or export your historical income and
              expenses
            </p>
          </div>
          <TransactionTable
            transactions={transactions}
            suggestions={suggestions}
          />
        </section>
      )}

      {/* Tab 3: Dedicated Recurring Subscriptions View */}
      {activeTab === "RECURRING" && (
        <section className="space-y-4">
          {recurringRules.length > 0 ? (
            <RecurringRulesList rules={recurringRules} />
          ) : (
            <Card className="p-10 text-center">
              <p className="text-sm text-slate-500">
                No active recurring subscriptions yet. Click &ldquo;Add
                Transaction&rdquo; and check &ldquo;Repeat as recurring
                subscription&rdquo; to schedule one.
              </p>
            </Card>
          )}
        </section>
      )}
    </main>
  );
}
