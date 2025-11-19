import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { kwaiAPI } from "@/lib/kwai/api";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: tokenData } = await (supabase.from("kwai_tokens") as any)
      .select("*")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenData) {
      return NextResponse.json(
        {
          error: "Token not found. Please reconnect.",
          needsReconnect: true,
        },
        { status: 400 }
      );
    }

    kwaiAPI.setAccessToken(tokenData.access_token);
    const accounts = await kwaiAPI.getAccounts();

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma conta encontrada",
        accounts: [],
      });
    }

    const accountsToInsert = accounts.map((account: any) => ({
      user_id: user.id,
      account_id: account.accountId,
      account_name: account.accountName,
      account_type: "advertiser",
      timezone: "America/Sao_Paulo",
      currency: account.currency || "BRL",
      status: "active",
      last_synced_at: new Date().toISOString(),
    }));

    await (supabase.from("kwai_accounts") as any).upsert(accountsToInsert, {
      onConflict: "account_id",
    });

    return NextResponse.json({
      success: true,
      message: `${accounts.length} conta(s) sincronizada(s)`,
      accounts: accounts.map((a: any) => ({
        id: a.accountId,
        name: a.accountName,
        currency: a.currency,
      })),
    });
  } catch (error: any) {
    console.error("Erro no sync:", error.message);
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}
