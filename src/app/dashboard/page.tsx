import { LogOut, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getCounterpartySuggestions,
  getRecurringRules,
  getTransactions,
  getUserSettings,
  processDueRecurringRules,
} from "@/lib/actions/transactions";
import { signOut } from "@/lib/actions/auth";
import { MobileAutomationGuide } from "@/components/dashboard/mobile-automation-guide";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { DashboardClientView } from "@/components/dashboard/dashboard-client-view";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await processDueRecurringRules();

  const [settings, recurringRules, transactions, suggestions] =
    await Promise.all([
      getUserSettings(),
      getRecurringRules(),
      getTransactions(),
      getCounterpartySuggestions(),
    ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <MobileAutomationGuide />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Expense Tracker
              </h1>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CommandPalette transactions={transactions} />
            <form action={signOut}>
              <Button variant="secondary" size="sm" type="submit">
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <DashboardClientView
        transactions={transactions}
        recurringRules={recurringRules}
        settings={settings}
        suggestions={suggestions}
      />
    </div>
  );
}
