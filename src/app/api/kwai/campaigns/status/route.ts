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

    // Converter openStatus para valores válidos (1 ou 2)
    // API Kwai aceita apenas: 1=ativo, 2=pausado (NÃO aceita 0)
    const validOpenStatus = openStatus === 1 || openStatus === true ? 1 : 2;

    console.log("Updating campaign status:", {
      accountId,
      campaignId,
      original: openStatus,
      valid: validOpenStatus,
    });

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
    const result = await kwaiAPI.updateCampaignStatus(
      accountId,
      campaignId,
      validOpenStatus
    );

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

