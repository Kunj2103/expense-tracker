"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Smartphone, FlaskConical, Zap } from "lucide-react";
import { usePlatform } from "@/hooks/use-platform";
import { IS_DEV } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export function MobileAutomationGuide({
  webhookToken,
}: {
  webhookToken?: string;
}) {
  const { origin } = usePlatform();
  const [isOpen, setIsOpen] = useState(false);
  const [syncMode, setSyncMode] = useState<"background" | "interactive">(
    "background",
  );
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const targetUrl =
    syncMode === "background"
      ? `${origin}/api/quick-log?token=${webhookToken ?? "YOUR_TOKEN"}&sms=`
      : `${origin}/dashboard?sms=`;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSms = () => {
    setIsOpen(false);
    const sampleSms = encodeURIComponent(
      "Rs. 420.00 debited from A/c XX1234 via UPI to Swiggy on 09-11-26",
    );
    router.push(`/dashboard?sms=${sampleSms}`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/95 px-3.5 py-2 text-xs font-semibold text-indigo-950 shadow-lg backdrop-blur-xs transition-all hover:border-indigo-300 hover:bg-indigo-50"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Smartphone className="h-3 w-3" />
        </span>
        <span>iOS / Android SMS Auto-Sync</span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="iOS & Android SMS Auto-Sync Setup"
      >
        <div className="space-y-4">
          {/* Mode Switcher: Silent Background vs Interactive Modal */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setSyncMode("background");
                setCopied(false);
              }}
              className={`rounded-md py-1.5 transition-all ${
                syncMode === "background"
                  ? "bg-white font-semibold text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ⚡ Silent Background (Best)
            </button>
            <button
              type="button"
              onClick={() => {
                setSyncMode("interactive");
                setCopied(false);
              }}
              className={`rounded-md py-1.5 transition-all ${
                syncMode === "interactive"
                  ? "bg-white font-semibold text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🖥️ Open Modal Prefilled
            </button>
          </div>

          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-950">
            <p className="font-semibold flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              {syncMode === "background"
                ? "Logs Debit & Credit SMS in the background without opening Safari!"
                : "Opens the app with the form pre-filled so you can review before saving."}
            </p>
          </div>

          <ol className="space-y-2 text-xs text-slate-700 list-decimal list-inside">
            <li>
              Open Apple <strong>Shortcuts</strong> &rarr;{" "}
              <strong>Automation</strong> &rarr;{" "}
              <strong>+ New Automation</strong> &rarr; <strong>Message</strong>.
            </li>
            <li>
              In <em>Message Contains</em>, add currency keywords:{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-900">
                Rs.
              </code>
              ,{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-900">
                INR
              </code>
              ,{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-900">
                ₹
              </code>{" "}
              (captures both Debit & Credit!) and select{" "}
              <strong>Run Immediately</strong>.
            </li>
            <li>
              Add <strong>Get Text from Input</strong> &rarr; tap <em>Input</em>{" "}
              &rarr; select <strong>Shortcut Input</strong> &rarr; tap it again
              and set to <strong>Content</strong>.
            </li>
            <li>
              Add <strong>URL Encode</strong> (encodes the <em>Text</em>).
            </li>
            <li>
              Add a <strong>Text</strong> action: paste the URL below and place
              the <strong>URL Encoded Text</strong> pill right after{" "}
              <code className="font-mono">=</code> (with no spaces or newlines).
            </li>
            <li>
              {syncMode === "background" ? (
                <>
                  Add <strong>Get Contents of URL</strong> (passing the{" "}
                  <em>Text</em> block). Done—it now logs silently in the
                  background!
                </>
              ) : (
                <>
                  Add <strong>Open URLs</strong> (passing the <em>Text</em>{" "}
                  block).
                </>
              )}
            </li>
          </ol>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {syncMode === "background"
                ? "Your Private Background Webhook URL"
                : "Your Interactive Modal URL"}
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <code className="flex-1 truncate text-xs text-slate-800">
                {targetUrl}
              </code>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            {IS_DEV ? (
              <button
                type="button"
                onClick={handleSimulateSms}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                [Dev] Test with sample ₹420 Swiggy SMS
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                Supports both Debit & Credit alerts automatically
              </span>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
