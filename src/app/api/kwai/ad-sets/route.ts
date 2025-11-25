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

    console.log("=== API AD-SETS GET ===");
    console.log("accountId:", accountId);
    console.log("Note: Fetching ALL ad sets (API ignores campaignId filter)");
    console.log("=======================");

    if (!accountId) {
      return NextResponse.json({ error: "accountId required" }, { status: 400 });
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

    // Buscar TODOS os ad sets (API ignora campaignId)
    const adSets = await kwaiAPI.getAdSets(parseInt(accountId));

    console.log("Total ad sets returned:", adSets?.data?.length || 0);

    return NextResponse.json({
      success: true,
      total: adSets?.total || 0,
      adSets: adSets?.data || [],
    });
  } catch (error: any) {
    console.error("Erro ao buscar ad sets:", error);
    return NextResponse.json({
      success: true,
      total: 0,
      adSets: [],
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, adSetData } = body;

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
    
    // Incluir pixelId se fornecido
    const adSetPayload = {
      ...adSetData,
      ...(adSetData.pixelId && { pixelId: adSetData.pixelId }),
    };
    
    const result = await kwaiAPI.createAdSet(accountId, adSetPayload);

    console.log("Ad Set result:", JSON.stringify(result, null, 2));

    // Extrair unitId - tentar múltiplos caminhos
    const unitId =
      result.unitId || // Do retorno modificado
      result.data?.data?.[0]?.unitId || // Estrutura original
      result.data?.[0]?.unitId; // Alternativa

    console.log("Using unitId:", unitId);

    if (!unitId) {
      console.error("UnitId not found in response");
      return NextResponse.json(
        {
          success: false,
          error: "UnitId não encontrado na resposta da API",
          debug: result,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      unitId: unitId,
      adSet: result,
    });
  } catch (error: any) {
    console.error("Erro ao criar ad set:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

