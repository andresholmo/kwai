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

    console.log("=== EMERGENCY CONNECT ===");
    console.log("User:", user.id);

    // Obter novo token via Authorization Code flow
    // Usuário precisa fornecer o code manualmente
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        {
          error: "Authorization code required",
          instructions:
            "Acesse a URL de autorização e copie o código da URL de callback",
        },
        { status: 400 }
      );
    }

    console.log("Code recebido:", code.substring(0, 10) + "...");

    // Trocar code por token
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      client_id: process.env.KWAI_CLIENT_ID!,
      client_secret: process.env.KWAI_CLIENT_SECRET!,
      redirect_uri: process.env.KWAI_REDIRECT_URI!,
    });

    const tokenResponse = await fetch(process.env.KWAI_TOKEN_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenResponse.json();
    console.log("Token response:", tokenData);

    if (!tokenData.access_token) {
      return NextResponse.json(
        {
          error: "Failed to get token",
          details: tokenData,
        },
        { status: 400 }
      );
    }

    // Salvar token
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await (supabase.from("kwai_tokens") as any)
      .delete()
      .eq("user_id", user.id);

    const { error: tokenError } = await (supabase.from("kwai_tokens") as any).insert({
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      expires_at: expiresAt.toISOString(),
      scope: tokenData.scope,
    });

    if (tokenError) {
      console.error("Erro ao salvar token:", tokenError);
      return NextResponse.json(
        { error: tokenError.message },
        { status: 500 }
      );
    }

    console.log("Token salvo!");

    // Buscar contas
    const accountsResponse = await fetch(
      "https://developers.kwai.com/rest/n/mapi/report/crmAccountQueryByAgentOrCorp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": tokenData.access_token,
        },
        body: JSON.stringify({ agentId: 76407091 }),
      }
    );

    const accountsData = await accountsResponse.json();
    console.log("Accounts response:", accountsData);

    if (accountsData.status === 200 && accountsData.data?.data) {
      const accounts = accountsData.data.data;

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
      });

      return NextResponse.json({
        success: true,
        message: "Conectado com sucesso!",
        accounts: accounts.length,
        accountsList: accounts,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch accounts",
        details: accountsData,
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}

