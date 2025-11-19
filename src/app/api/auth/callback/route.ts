import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { kwaiAPI } from "@/lib/kwai/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Se for callback do Supabase (tem 'token_hash' ou 'type')
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Detectar callback do Supabase
  if (tokenHash || type === "signup" || type === "recovery") {
    // Callback do Supabase - processar confirmação de email ou recuperação
    if (code) {
      const supabase = createClient();
      await supabase.auth.exchangeCodeForSession(code);
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Se não tem code e não tem error, pode ser callback do Supabase sem parâmetros
  if (!code && !error) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Callback do Kwai OAuth
  console.log("=== KWAI OAUTH CALLBACK ===");
  console.log("Code:", code ? "received" : "missing");
  console.log("Error:", error);

  if (error || !code) {
    console.log("Callback com erro ou sem code, redirecionando...");
    return NextResponse.redirect(
      new URL(`/dashboard?error=${error || "no_code"}`, request.url)
    );
  }

  try {
    const supabase = createClient();

    // Verificar usuário autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("Usuário autenticado:", user ? `Sim (${user.id})` : "Não");

    // Se não há usuário autenticado e há code, pode ser callback do Supabase
    // Tentar processar como Supabase primeiro
    if (!user) {
      console.log("Tentando processar como callback do Supabase...");
      try {
        await supabase.auth.exchangeCodeForSession(code);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (supabaseError) {
        console.log("Não é callback do Supabase, redirecionando para login");
        // Se falhar, não é callback do Supabase, redirecionar para login
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    console.log("Iniciando troca de code por access token...");
    // Trocar code por access token
    const tokenData = await kwaiAPI.getAccessToken(code);

    console.log("Token obtido com sucesso:", {
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
    });

    // Salvar tokens no banco
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    console.log("Token expira em:", expiresAt.toISOString());

    // Deletar tokens antigos do usuário antes de inserir novos
    console.log("Deletando tokens antigos do usuário...");
    await (supabase.from("kwai_tokens") as any)
      .delete()
      .eq("user_id", user.id);

    const tokenInsert: any = {
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      expires_at: expiresAt.toISOString(),
      scope: tokenData.scope,
    };

    console.log("Salvando token no banco...");
    const { error: tokenError } = await (supabase
      .from("kwai_tokens") as any).insert(tokenInsert);

    if (tokenError) {
      console.error("Erro ao salvar token:", tokenError);
      throw tokenError;
    }

    console.log("Token salvo no banco com sucesso");

    // Buscar contas do Kwai
    console.log("Configurando access token na API...");
    kwaiAPI.setAccessToken(tokenData.access_token);

    console.log("Buscando contas do Kwai...");

    const accounts = await kwaiAPI.getAccounts();
    console.log("Contas retornadas:", accounts.length);
    console.log("Contas retornadas:", JSON.stringify(accounts, null, 2));
    console.log("Número de contas:", accounts?.length || 0);

    // Salvar contas no banco
    if (accounts && accounts.length > 0) {
      console.log("Processando contas para salvar no banco...");
      const accountsToInsert = accounts.map((account: any) => {
        const accountData = {
          user_id: user.id,
          account_id: account.accountId,
          account_name: account.accountName,
          account_type: account.accountType,
          timezone: account.timezone || "UTC",
          currency: account.currency || "USD",
          status: "active",
          last_synced_at: new Date().toISOString(),
        };
        console.log("Conta a ser inserida:", JSON.stringify(accountData, null, 2));
        return accountData;
      });

      console.log("Salvando contas no banco...");
      const { error: accountsError, data: accountsData } = await (supabase
        .from("kwai_accounts") as any).upsert(accountsToInsert);

      if (accountsError) {
        console.error("Erro ao salvar contas:", accountsError);
      } else {
        console.log("Contas salvas com sucesso:", accountsData);
      }
    } else {
      console.log("AVISO: Nenhuma conta retornada pela API do Kwai");
      // Redirecionar mesmo assim
      return NextResponse.redirect(
        new URL("/dashboard?connected=true&warning=no_accounts", request.url)
      );
    }

    console.log("Callback concluído com sucesso, redirecionando...");
    // Redirecionar para dashboard com sucesso
    return NextResponse.redirect(
      new URL("/dashboard?connected=true", request.url)
    );
  } catch (error: any) {
    console.error("ERRO NO CALLBACK:", error);
    console.error("Mensagem de erro:", error.message);
    console.error("Stack:", error.stack);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}

