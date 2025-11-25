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
    const { accountId, campaignId } = body;

    if (!accountId || !campaignId) {
      return NextResponse.json(
        { error: "accountId e campaignId são obrigatórios" },
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

    // 1. Buscar dados da campanha original
    const campaigns = await kwaiAPI.getCampaigns(accountId);
    const originalCampaign = campaigns?.data?.find(
      (c: any) => c.campaignId === campaignId
    );

    if (!originalCampaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    // 2. Criar nova campanha com dados duplicados
    // Determinar budgetType baseado no orçamento
    // 1=sem limite, 2=orçamento diário, 3=orçamento total
    const budgetType =
      originalCampaign.campaignBudgetType === 1
        ? 2 // Diário
        : originalCampaign.campaignBudgetType === 2
          ? 1 // Sem limite (vitalício)
          : originalCampaign.campaignBudget && originalCampaign.campaignBudget > 0
            ? 2 // Se tem orçamento, usar diário
            : 1; // Sem orçamento = sem limite

    const newCampaignData = {
      campaignName: `${originalCampaign.campaignName} (Cópia)`,
      marketingGoal: originalCampaign.marketingGoal,
      objective: originalCampaign.objective,
      campaignBudgetType: originalCampaign.campaignBudgetType,
      campaignBudget: originalCampaign.campaignBudget,
      budgetType: budgetType, // Campo obrigatório
    };

    console.log("Duplicating campaign with budgetType:", budgetType);

    const result = await kwaiAPI.createCampaign(accountId, newCampaignData);

    return NextResponse.json({
      success: true,
      message: "Campanha duplicada com sucesso!",
      campaign: result,
    });
  } catch (error: any) {
    console.error("Erro ao duplicar campanha:", error);
    return NextResponse.json(
      {
        error: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}

