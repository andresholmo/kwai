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
    // IMPORTANTE: Passar adCategory
    const campaigns = await kwaiAPI.getCampaigns(parseInt(accountId), { adCategory: 1 });

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
    console.error("Erro ao buscar campanhas:", error.message);
    return NextResponse.json({
      success: true,
      total: 0,
      campaigns: [],
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
    const { accountId, campaignData } = body;

    if (!accountId || !campaignData) {
      return NextResponse.json(
        { error: "accountId e campaignData são obrigatórios" },
        { status: 400 }
      );
    }

    console.log("=== CAMPAIGN CREATION REQUEST ===");
    console.log("Account ID:", accountId);
    console.log("Campaign Data:", JSON.stringify(campaignData, null, 2));

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

    let result;
    let lastError;

    // Tentar endpoint principal
    try {
      console.log("Trying main endpoint...");
      result = await kwaiAPI.createCampaign(accountId, campaignData);
      console.log("Main endpoint SUCCESS");
    } catch (error: any) {
      console.log(
        "Main endpoint FAILED:",
        error.response?.data?.message || error.message
      );
      lastError = error;

      // Tentar endpoint alternativo
      try {
        console.log("Trying alternative endpoint...");
        result = await kwaiAPI.createCampaignAlt(accountId, campaignData);
        console.log("Alternative endpoint SUCCESS");
      } catch (altError: any) {
        console.log(
          "Alternative endpoint FAILED:",
          altError.response?.data?.message || altError.message
        );
        throw lastError; // Lançar o erro original
      }
    }

    return NextResponse.json({
      success: true,
      message: "Campanha criada com sucesso!",
      campaign: result,
    });
  } catch (error: any) {
    console.error("=== FINAL ERROR ===");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.response?.data?.message || error.message);
    console.error("Full error:", JSON.stringify(error.response?.data, null, 2));
    console.error("===================");

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.response?.data?.err_msg ||
          error.message,
      },
      { status: 500 }
    );
  }
}

