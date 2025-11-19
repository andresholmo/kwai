import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { kwaiAPI } from "@/lib/kwai/api";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    console.log("=== SYNC ACCOUNTS DEBUG ===");
    console.log("ENV KWAI_CORP_ID:", process.env.KWAI_CORP_ID);
    console.log("ENV KWAI_AGENT_ID:", process.env.KWAI_AGENT_ID);
    console.log(
      "Todas as ENV que começam com KWAI:",
      Object.keys(process.env).filter((k) => k.startsWith("KWAI"))
    );

    // Verificar usuário
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User ID:", user.id);

    // Buscar token
    const { data: tokenData, error: tokenError } = await (supabase
      .from("kwai_tokens") as any)
      .select("*")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.log("Token error:", tokenError);
      return NextResponse.json(
        {
          error: "Token not found or expired",
        },
        { status: 400 }
      );
    }

    console.log("Token OK, expires:", tokenData.expires_at);
    kwaiAPI.setAccessToken(tokenData.access_token);

    // TENTAR AMBAS AS FORMAS
    console.log("\n=== TENTATIVA 1: COM CORPID ===");
    try {
      const corpId = 76407091; // HARDCODED para teste
      console.log("Usando corpId hardcoded:", corpId);
      const accounts1 = await kwaiAPI.getAccounts(corpId);
      console.log("Sucesso com corpId!", accounts1);

      if (accounts1 && accounts1.length > 0) {
        // Salvar contas
        const accountsToInsert = accounts1.map((account: any) => ({
          user_id: user.id,
          account_id: account.accountId,
          account_name: account.accountName,
          account_type: account.accountType || "advertiser",
          timezone: account.timezone || "UTC",
          currency: account.currency || "BRL",
          status: "active",
          last_synced_at: new Date().toISOString(),
        }));

        await (supabase.from("kwai_accounts") as any).upsert(accountsToInsert, {
          onConflict: "account_id",
        });

        return NextResponse.json({
          success: true,
          message: `${accounts1.length} conta(s) sincronizada(s) com corpId`,
          accounts: accounts1,
        });
      }
    } catch (error1: any) {
      console.log("Erro com corpId:", error1.message);
      console.log("Stack:", error1.stack);
    }

    console.log("\n=== TENTATIVA 2: COM AGENTID ===");
    try {
      // Resetar token (pode ter sido invalidado)
      kwaiAPI.setAccessToken(tokenData.access_token);

      const agentId = 76407091; // HARDCODED
      console.log("Usando agentId hardcoded:", agentId);

      // Chamar API diretamente aqui para testar
      const testResponse = await fetch(
        "https://developers.kwai.com/rest/n/mapi/report/crmAccountQueryByAgentOrCorp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Token": tokenData.access_token,
          },
          body: JSON.stringify({ agentId }),
        }
      );

      const testData = await testResponse.json();
      console.log("Response com agentId:", JSON.stringify(testData, null, 2));

      if (testData.status === 200 && testData.data?.data) {
        const accounts2 = testData.data.data;

        if (accounts2 && accounts2.length > 0) {
          const accountsToInsert = accounts2.map((account: any) => ({
            user_id: user.id,
            account_id: account.accountId,
            account_name: account.accountName,
            account_type: account.accountType || "advertiser",
            timezone: account.timezone || "UTC",
            currency: account.currency || "BRL",
            status: "active",
            last_synced_at: new Date().toISOString(),
          }));

          await (supabase.from("kwai_accounts") as any).upsert(
            accountsToInsert,
            {
              onConflict: "account_id",
            }
          );

          return NextResponse.json({
            success: true,
            message: `${accounts2.length} conta(s) sincronizada(s) com agentId`,
            accounts: accounts2,
          });
        }
      }
    } catch (error2: any) {
      console.log("Erro com agentId:", error2.message);
      console.log("Stack:", error2.stack);
    }

    console.log("\n=== TENTATIVA 3: SEM PARAMETROS (VAZIO) ===");
    try {
      kwaiAPI.setAccessToken(tokenData.access_token);

      const testResponse = await fetch(
        "https://developers.kwai.com/rest/n/mapi/report/crmAccountQueryByAgentOrCorp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Access-Token": tokenData.access_token,
          },
          body: JSON.stringify({}),
        }
      );

      const testData = await testResponse.json();
      console.log(
        "Response sem parâmetros:",
        JSON.stringify(testData, null, 2)
      );
    } catch (error3: any) {
      console.log("Erro sem parâmetros:", error3.message);
      console.log("Stack:", error3.stack);
    }

    return NextResponse.json(
      {
        error: "Nenhuma tentativa funcionou",
        message: "Verifique os logs do Vercel para mais detalhes",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}

