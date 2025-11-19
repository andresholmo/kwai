import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { kwaiAPI } from "@/lib/kwai/api";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar usuário autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar token válido do Kwai
    const { data: tokenData } = await (supabase.from("kwai_tokens") as any)
      .select("*")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenData) {
      return NextResponse.json(
        { error: "Kwai account not connected" },
        { status: 401 }
      );
    }

    // Configurar token na API
    kwaiAPI.setAccessToken(tokenData.access_token);

    // Obter parâmetros da requisição
    const body = await request.json();
    const {
      accountId,
      granularity = 1, // 1 = diário, 2 = semanal, 3 = mensal
      dataBeginTime,
      dataEndTime,
      timeZoneIana = "America/Sao_Paulo",
      pageNo = 1,
      pageSize = 100,
    } = body;

    if (!accountId || !dataBeginTime || !dataEndTime) {
      return NextResponse.json(
        { error: "accountId, dataBeginTime and dataEndTime are required" },
        { status: 400 }
      );
    }

    // Buscar relatório de performance
    const reportData = await kwaiAPI.getPerformanceReport(
      parseInt(accountId),
      {
        granularity,
        dataBeginTime: parseInt(dataBeginTime),
        dataEndTime: parseInt(dataEndTime),
        timeZoneIana,
        pageNo,
        pageSize,
      }
    );

    return NextResponse.json({ data: reportData });
  } catch (error: any) {
    console.error("Erro ao buscar relatório:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

