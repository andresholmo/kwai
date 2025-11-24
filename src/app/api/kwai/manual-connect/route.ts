import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const { access_token, refresh_token } = body;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        {
          error: "access_token e refresh_token são obrigatórios",
        },
        { status: 400 }
      );
    }

    console.log("=== MANUAL CONNECT ===");
    console.log("User:", user.id);

    // Deletar tokens antigos
    await supabase.from("kwai_tokens").delete().eq("user_id", user.id);

    // Salvar novo token (validade de 1 hora)
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    const { error: tokenError } = await (supabase.from("kwai_tokens") as any).insert({
      user_id: user.id,
      access_token,
      refresh_token,
      token_type: "bearer",
      expires_in: 3600,
      expires_at: expiresAt.toISOString(),
      scope:
        "ad_mapi_report ad_mapi_campaign_write ad_mapi_campaign_read ad_mapi_unit_write ad_mapi_unit_read ad_mapi_creative_write ad_mapi_creative_read ad_mapi_material_write ad_mapi_material_read",
    });

    if (tokenError) {
      console.error("Erro ao salvar token:", tokenError);
      throw tokenError;
    }

    console.log("Token salvo com sucesso");

    // Tentar buscar contas para validar o token
    let accountsCount = 0;
    try {
      const agentId = parseInt(process.env.KWAI_AGENT_ID || "76407091");
      const accountsResponse = await fetch(
        "https://developers.kwai.com/rest/n/mapi/report/crmAccountQueryByAgentOrCorp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Token": access_token,
          },
          body: JSON.stringify({ agentId }),
        }
      );

      const accountsData = await accountsResponse.json();
      console.log("Accounts response:", accountsData);

      if (accountsData.status === 200 && accountsData.data?.data) {
        const accounts = accountsData.data.data;
        accountsCount = accounts.length;

        if (accounts.length > 0) {
          const accountsToInsert = accounts.map((account: any) => ({
            user_id: user.id,
            account_id: account.accountId,
            account_name: account.accountName,
            account_type: "advertiser",
            timezone: "America/Sao_Paulo",
            currency: account.currency || "BRL",
            status: "active",
            last_synced_at: new Date().toISOString(),
          }));

          await (supabase.from("kwai_accounts") as any).upsert(accountsToInsert, {
            onConflict: "account_id",
            ignoreDuplicates: true,
          });
        }
      }
    } catch (accountError) {
      console.log("Erro ao buscar contas (não crítico):", accountError);
    }

    return NextResponse.json({
      success: true,
      message: "Conectado com sucesso!",
      accounts: accountsCount,
    });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}

