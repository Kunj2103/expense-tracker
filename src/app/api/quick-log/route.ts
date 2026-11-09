import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { parseTransactionSms } from "@/lib/sms-parser";

async function handleSmsIngest(token: string | null, smsText: string | null) {
  if (!token || !smsText) {
    return NextResponse.json(
      { ok: false, message: "Missing token or sms parameter" },
      { status: 400 }
    );
  }

  const parsed = parseTransactionSms(smsText);

  if (!parsed.isValidTransaction || !parsed.amount || parsed.amount <= 0) {
    return NextResponse.json({
      ok: false,
      skipped: true,
      message: "Ignored: Message is an OTP, promo, or missing valid amount.",
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase.rpc("log_transaction_via_token", {
    p_token: token,
    p_type: parsed.type,
    p_amount: parsed.amount,
    p_date: today,
    p_category: parsed.category,
    p_payment_method: parsed.payment_method,
    p_counterparty: parsed.counterparty || null,
    p_notes: parsed.notes || "Auto-logged via iOS Shortcut",
  });

  if (error || !data?.success) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? data?.error ?? "Insert failed" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    summary: `Logged ${parsed.type === "INCOME" ? "+" : "-"}₹${parsed.amount} (${
      parsed.counterparty || parsed.category
    })`,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return handleSmsIngest(searchParams.get("token"), searchParams.get("sms"));
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const token = body.token ?? searchParams.get("token");
  const sms = body.sms ?? searchParams.get("sms");
  return handleSmsIngest(token, sms);
}