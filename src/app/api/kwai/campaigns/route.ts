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
    console.log("User ID:", user.id);
    console.log("Account ID:", accountId);
    console.log("Campaign Data:", JSON.stringify(campaignData, null, 2));

    const { data: tokenData, error: tokenError } = await (supabase.from("kwai_tokens") as any)
      .select("*")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error("Token error:", tokenError);
      return NextResponse.json(
        { error: "Token not found or expired" },
        { status: 401 }
      );
    }

    console.log("Token found:");
    console.log("- Expires at:", tokenData.expires_at);
    console.log(
      "- Access token (first 20):",
      tokenData.access_token?.substring(0, 20) || "MISSING"
    );
    console.log("- Scope:", tokenData.scope);

    // Verificar se token realmente não expirou
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    const minutesUntilExpiry =
      (expiresAt.getTime() - now.getTime()) / 1000 / 60;

    console.log("Token expiry check:");
    console.log("- Now:", now.toISOString());
    console.log("- Expires:", expiresAt.toISOString());
    console.log("- Minutes until expiry:", minutesUntilExpiry.toFixed(2));

    if (minutesUntilExpiry < 0) {
      console.error("Token expired!");
      return NextResponse.json(
        { error: "Token expired, please reconnect" },
        { status: 401 }
      );
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
      console.error("Main endpoint FAILED");
      console.error("Error object keys:", Object.keys(error));
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error config:", error.config);
      console.error("Error code:", error.code);

      lastError = error;

      // Tentar endpoint alternativo
      try {
        console.log("Trying alternative endpoint...");
        result = await kwaiAPI.createCampaignAlt(accountId, campaignData);
        console.log("Alternative endpoint SUCCESS");
      } catch (altError: any) {
        console.error("Alternative endpoint FAILED");
        console.error("Alt error:", altError.message);
        throw lastError;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Campanha criada com sucesso!",
      campaign: result,
    });
  } catch (error: any) {
    console.error("=== FINAL ERROR ===");
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error.constructor?.name);
    console.error("Has response:", !!error.response);
    console.error("Status:", error.response?.status);
    console.error("Message:", error.message);
    console.error("Response data:", error.response?.data);
    console.error("Config URL:", error.config?.url);
    console.error("Config data:", error.config?.data);
    console.error("===================");

    return NextResponse.json(
      {
        error:
          error.response?.data?.message ||
          error.response?.data?.err_msg ||
          error.message,
        details: error.response?.data,
      },
      { status: 500 }
    );
  }
}

