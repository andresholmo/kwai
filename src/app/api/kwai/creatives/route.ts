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

    console.log("=== API CREATIVES GET ===");
    console.log("accountId:", accountId);
    console.log("Note: Fetching ALL creatives (API ignores unitId filter)");
    console.log("========================");

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

    // Buscar TODOS os criativos (API ignora unitId)
    const creatives = await kwaiAPI.getCreatives(parseInt(accountId));

    console.log("Total creatives returned:", creatives?.data?.length || 0);

    return NextResponse.json({
      success: true,
      total: creatives?.total || 0,
      creatives: creatives?.data || [],
    });
  } catch (error: any) {
    console.error("Erro ao buscar criativos:", error);
    return NextResponse.json({
      success: true,
      total: 0,
      creatives: [],
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
    const { accountId, creativeData } = body;

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
    const result = await kwaiAPI.createCreative(accountId, creativeData);

    return NextResponse.json({
      success: true,
      creative: result,
    });
  } catch (error: any) {
    console.error("Erro ao criar criativo:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

