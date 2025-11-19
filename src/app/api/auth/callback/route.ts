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

  if (tokenHash || type === "signup") {
    // Callback do Supabase - processar confirmação de email
    if (code) {
      const supabase = createClient();
      await supabase.auth.exchangeCodeForSession(code);
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Callback do Kwai OAuth
  if (error || !code) {
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
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Trocar code por access token
    const tokenData = await kwaiAPI.getAccessToken(code);

    // Salvar tokens no banco
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Deletar tokens antigos do usuário antes de inserir novos
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

    const { error: tokenError } = await (supabase
      .from("kwai_tokens") as any).insert(tokenInsert);

    if (tokenError) throw tokenError;

    // Buscar contas do Kwai
    kwaiAPI.setAccessToken(tokenData.access_token);
    const accounts = await kwaiAPI.getAccounts();

    // Salvar contas no banco
    if (accounts && accounts.length > 0) {
      const accountsToInsert = accounts.map((account: any) => ({
        user_id: user.id,
        account_id: account.accountId,
        account_name: account.accountName,
        account_type: account.accountType,
        timezone: account.timezone || "UTC",
        currency: account.currency || "USD",
        status: "active",
        last_synced_at: new Date().toISOString(),
      }));

      const { error: accountsError } = await (supabase
        .from("kwai_accounts") as any).upsert(accountsToInsert);

      if (accountsError) {
        console.error("Erro ao salvar contas:", accountsError);
      }
    }

    // Redirecionar para dashboard com sucesso
    return NextResponse.redirect(
      new URL("/dashboard?connected=true", request.url)
    );
  } catch (error: any) {
    console.error("Erro no callback do Kwai:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}

