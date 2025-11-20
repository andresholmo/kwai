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

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId required" },
        { status: 400 }
      );
    }

    // Buscar token
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
    const campaigns = await kwaiAPI.getCampaigns(parseInt(accountId));

    // Salvar no banco local
    if (campaigns?.data && campaigns.data.length > 0) {
      const campaignsToSave = campaigns.data.map((c: any) => ({
        user_id: user.id,
        account_id: accountId,
        kwai_campaign_id: c.campaignId,
        name: c.campaignName,
        objective: c.objective === 1 ? "APP" : "WEBSITE",
        status: c.openStatus === 1 ? "active" : "paused",
        kwai_data: c,
        synced_at: new Date().toISOString(),
      }));

      await (supabase.from("campaigns") as any).upsert(campaignsToSave, {
        onConflict: "kwai_campaign_id",
      });
    }

    return NextResponse.json({
      success: true,
      total: campaigns?.total || 0,
      campaigns: campaigns?.data || [],
    });
  } catch (error: any) {
    console.error("Erro ao buscar campanhas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    const { accountId, campaignData } = body;

    // Buscar token
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
    const result = await kwaiAPI.createCampaign(accountId, campaignData);

    return NextResponse.json({
      success: true,
      campaign: result,
    });
  } catch (error: any) {
    console.error("Erro ao criar campanha:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

