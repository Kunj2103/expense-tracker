"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, MailCheck, Wallet } from "lucide-react";
import {
  emailSchema,
  otpVerifySchema,
  type EmailFormValues,
  type OtpFormValues,
} from "@/lib/validations";
import { sendOtpOrMagicLink, verifyEmailOtp } from "@/lib/actions/auth";
import { useActionStatus } from "@/hooks/use-action-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const { error, isPending, runAction } = useActionStatus();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpVerifySchema),
  });

  const handleSendEmail = (values: EmailFormValues) => {
    runAction(
      () => sendOtpOrMagicLink(values),
      () => {
        setSentEmail(values.email);
        otpForm.setValue("email", values.email);
      },
    );
  };

  const handleVerifyOtp = (values: OtpFormValues) => {
    runAction(() => verifyEmailOtp(values));
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Unified Expense Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {sentEmail
              ? `Check your inbox at ${sentEmail}`
              : "Sign in with your email to access your private ledger"}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {!sentEmail ? (
          <form
            onSubmit={emailForm.handleSubmit(handleSendEmail)}
            className="space-y-4"
          >
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register("email")}
            />
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Sending Magic Link..." : "Continue with Email"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-center">
              <MailCheck className="mx-auto mb-2 h-7 w-7 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-950">
                Magic Link Sent!
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                Click the sign-in link in your email to log in automatically.
              </p>
            </div>

            {!showOtpInput ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setShowOtpInput(true)}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Have a 6-digit OTP code instead?
              </Button>
            ) : (
              <form
                onSubmit={otpForm.handleSubmit(handleVerifyOtp)}
                className="space-y-3 pt-2 border-t border-slate-200"
              >
                <Input
                  id="token"
                  type="text"
                  label="6-Digit OTP"
                  placeholder="123456"
                  maxLength={6}
                  error={otpForm.formState.errors.token?.message}
                  {...otpForm.register("token")}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Verifying..." : "Verify OTP & Login"}
                </Button>
              </form>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSentEmail(null);
                setShowOtpInput(false);
              }}
            >
              Use a different email
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
