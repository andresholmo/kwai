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
    const { accountId, unitId, updates } = body;

    if (!accountId || !unitId) {
      return NextResponse.json(
        { error: "accountId e unitId são obrigatórios" },
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

    // Atualizar Ad Set
    const result = await kwaiAPI.updateAdSet(accountId, unitId, updates);

    return NextResponse.json({
      success: true,
      message: "Ad Set atualizado com sucesso!",
      result,
    });
  } catch (error: any) {
    console.error("Erro ao editar Ad Set:", error);
    return NextResponse.json(
      {
        error: error.response?.data?.message || error.message,
      },
      { status: 500 }
    );
  }
}

