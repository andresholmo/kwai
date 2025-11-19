import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/kwai/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    
    // Aqui você salvaria os tokens no Supabase
    // await saveTokensToDatabase(userId, tokens);

    // Redireciona para o dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro ao processar autenticação";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}

