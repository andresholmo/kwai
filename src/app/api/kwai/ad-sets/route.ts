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
    const campaignId = searchParams.get("campaignId");

    console.log("=== API AD-SETS GET ===");
    console.log("accountId:", accountId);
    console.log("campaignId:", campaignId);
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

    let adSets;

    if (campaignId) {
      console.log("Calling getAdSets WITH campaignId:", campaignId);
      adSets = await kwaiAPI.getAdSets(parseInt(accountId), parseInt(campaignId));
    } else {
      console.log("Calling getAdSets WITHOUT campaignId");
      adSets = await kwaiAPI.getAdSets(parseInt(accountId));
    }

    console.log("Ad Sets returned:", adSets?.data?.length || 0);
    console.log("Ad Sets total:", adSets?.total || 0);

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
    const result = await kwaiAPI.createAdSet(accountId, adSetData);

    return NextResponse.json({
      success: true,
      adSet: result,
    });
  } catch (error: any) {
    console.error("Erro ao criar ad set:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

