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

    const body = await request.json();
    const { accountId, campaignId, openStatus } = body;

    console.log("Updating campaign status:", { accountId, campaignId, openStatus });

    if (!accountId || !campaignId) {
      return NextResponse.json(
        { error: "accountId and campaignId required" },
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
    const result = await kwaiAPI.updateCampaignStatus(accountId, campaignId, openStatus);

    console.log("Campaign status update result:", result);

    if (result.status !== 200) {
      throw new Error(result.message || "Erro ao atualizar status");
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

