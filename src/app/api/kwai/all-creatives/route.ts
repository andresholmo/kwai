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

    // Buscar campanhas → ad sets → criativos
    const campaignsData = await kwaiAPI.getCampaigns(parseInt(accountId));
    const campaigns = campaignsData?.data || [];

    const allCreatives: any[] = [];

    for (const campaign of campaigns.slice(0, 10)) {
      // Limitar por performance
      try {
        const adSetsData = await kwaiAPI.getAdSets(
          parseInt(accountId),
          campaign.campaignId
        );
        const adSets = adSetsData?.data || [];

        for (const adSet of adSets.slice(0, 5)) {
          try {
            const creativesData = await kwaiAPI.getCreatives(
              parseInt(accountId),
              adSet.unitId
            );
            if (creativesData?.data) {
              const creativesWithContext = creativesData.data.map(
                (creative: any) => ({
                  ...creative,
                  unitName: adSet.unitName,
                  campaignName: campaign.campaignName,
                })
              );
              allCreatives.push(...creativesWithContext);
            }
          } catch (error) {
            console.error(
              `Erro ao buscar criativos do ad set ${adSet.unitId}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(
          `Erro ao buscar ad sets da campanha ${campaign.campaignId}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      total: allCreatives.length,
      creatives: allCreatives,
    });
  } catch (error: any) {
    console.error("Erro ao buscar todos os criativos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

