"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Smartphone, Sparkles, FlaskConical } from "lucide-react";
import { usePlatform, type DevicePlatform } from "@/hooks/use-platform";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { IS_DEV } from "@/lib/utils";

export function MobileAutomationGuide() {
  const { platform, setPlatform, origin } = usePlatform();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const activeTab: "ios" | "android" =
    platform === "android" ? "android" : "ios";

  const targetUrl =
    activeTab === "ios"
      ? `${origin}/dashboard?sms=`
      : `${origin}/dashboard?sms={sms_body}`;

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSms = () => {
    setIsOpen(false);
    const sampleSms = encodeURIComponent(
      "Rs. 420.00 debited from A/c XX1234 via UPI to Swiggy on 08-11-26",
    );
    router.push(`/dashboard?sms=${sampleSms}`);
  };

  const switchTab = (target: DevicePlatform) => {
    setPlatform(target);
    setCopied(false);
  };

  return (
    <>
      {/* Floating Top-Left Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-20 z-40 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/95 px-3.5 py-2 text-xs font-semibold text-indigo-950 shadow-md backdrop-blur-xs transition-all hover:border-indigo-300 hover:bg-indigo-50/90 sm:top-4"
        title="Setup Auto SMS / UPI Tracking"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Smartphone className="h-3 w-3" />
        </span>
        <span>
          {platform === "ios"
            ? "iOS UPI Auto-Sync"
            : platform === "android"
              ? "Android UPI Auto-Sync"
              : "Mobile SMS Auto-Sync"}
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Auto-Track UPI & Bank SMS"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-100 p-1 grid grid-cols-2 gap-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => switchTab("ios")}
              className={`rounded-md py-1.5 transition-colors ${
                activeTab === "ios"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              iPhone (iOS Shortcuts)
            </button>
            <button
              type="button"
              onClick={() => switchTab("android")}
              className={`rounded-md py-1.5 transition-colors ${
                activeTab === "android"
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Android (MacroDroid)
            </button>
          </div>

          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-950">
            <p className="font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              {platform === "ios"
                ? "Detected iOS Device — Follow these 4 steps:"
                : platform === "android"
                  ? "Detected Android Device — Follow these 3 steps:"
                  : "Select your phone OS above to set up 1-tap UPI logging:"}
            </p>
          </div>

          {activeTab === "ios" ? (
            <ol className="space-y-2.5 text-xs text-slate-700 list-decimal list-inside">
              <li>
                Open the built-in Apple <strong>Shortcuts</strong> app &rarr;{" "}
                <strong>Automation</strong> tab &rarr; tap{" "}
                <strong>+ New Automation</strong>.
              </li>
              <li>
                Select <strong>Message</strong> &rarr; set{" "}
                <em>Message Contains</em> to{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-900">
                  debited
                </code>{" "}
                &rarr; select <strong>Run Immediately</strong>.
              </li>
              <li>
                Add action <strong>URL Encode</strong> and pass{" "}
                <strong>Shortcut Input</strong> as the text.
              </li>
              <li>
                Add action <strong>Open URLs</strong> and paste the URL below
                followed by the <strong>URL Encoded Text</strong> variable:
              </li>
            </ol>
          ) : (
            <ol className="space-y-2.5 text-xs text-slate-700 list-decimal list-inside">
              <li>
                Install <strong>MacroDroid</strong> &rarr; tap{" "}
                <strong>Add Macro</strong>.
              </li>
              <li>
                Under <strong>Triggers</strong>, choose{" "}
                <strong>SMS Received</strong> &rarr; Content contains{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-900">
                  debited
                </code>
                .
              </li>
              <li>
                Under <strong>Actions</strong>, choose{" "}
                <strong>Open Website / HTTP URL</strong> and paste the URL
                below:
              </li>
            </ol>
          )}

          {/* Copyable Deep-Link URL Box */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Your Personal Automation URL
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

          {/* 1-Click Live Simulator */}
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
                Works automatically with iOS Shortcuts & MacroDroid
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
