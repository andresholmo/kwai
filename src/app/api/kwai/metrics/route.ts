import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { kwaiAPI } from "@/lib/kwai/api";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const level = searchParams.get("level") || "campaign"; // campaign, adset, ad
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId é obrigatório" },
        { status: 400 }
      );
    }

    const { data: tokenData } = await (supabase.from("kwai_tokens") as any)
      .select("access_token")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenData) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    kwaiAPI.setAccessToken(tokenData.access_token);

    // Definir datas padrão (últimos 30 dias)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // Buscar métricas
    const metrics = await kwaiAPI.getReport(parseInt(accountId), {
      startDate: formatDate(start),
      endDate: formatDate(end),
      reportLevel: level === "campaign" ? 1 : level === "adset" ? 2 : 3,
      metrics: ["impression", "click", "cost", "conversion", "ctr", "cpc", "cpm"],
    });

    return NextResponse.json({
      success: true,
      metrics: metrics?.data || [],
      period: {
        start: formatDate(start),
        end: formatDate(end),
      },
    });
  } catch (error: any) {
    console.error("Erro ao buscar métricas:", error);
    return NextResponse.json({
      success: true,
      metrics: [],
      error: error.message,
    });
  }
}

