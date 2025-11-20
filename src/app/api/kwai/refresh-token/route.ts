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

    // Buscar token atual
    const { data: currentToken } = await (supabase.from("kwai_tokens") as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!currentToken) {
      return NextResponse.json(
        {
          error: "No token found. Please reconnect.",
        },
        { status: 400 }
      );
    }

    // Refresh token
    const newTokenData = await kwaiAPI.refreshToken(currentToken.refresh_token);

    // Atualizar no banco
    await (supabase.from("kwai_tokens") as any)
      .delete()
      .eq("user_id", user.id);

    const expiresAt = new Date(Date.now() + newTokenData.expires_in * 1000);

    await (supabase.from("kwai_tokens") as any).insert({
      user_id: user.id,
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token,
      token_type: newTokenData.token_type,
      expires_in: newTokenData.expires_in,
      expires_at: expiresAt.toISOString(),
      scope: newTokenData.scope,
    });

    return NextResponse.json({
      success: true,
      message: "Token renovado com sucesso!",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Erro ao renovar token:", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}

