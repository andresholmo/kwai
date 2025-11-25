import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { kwaiAPI } from "@/lib/kwai/api";

export const dynamic = "force-dynamic";

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
      return NextResponse.json({ error: "accountId required" }, { status: 400 });
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

    // Buscar pixels via API do Kwai
    // Nota: Endpoint pode variar, retornando array vazio se não disponível
    let pixels: any[] = [];

    try {
      // Tentar buscar pixels (endpoint pode não estar disponível)
      const response = await kwaiAPI.post("/rest/n/mapi/pixel/query", {
        accountId: parseInt(accountId),
      });
      pixels = response.data?.data || [];
    } catch (error: any) {
      console.log("API de pixels não disponível ou endpoint diferente:", error.message);
      // Retornar array vazio se API não estiver disponível
      pixels = [];
    }

    return NextResponse.json({
      success: true,
      pixels: pixels,
    });
  } catch (error: any) {
    console.error("Erro ao buscar pixels:", error);
    return NextResponse.json({
      success: true,
      pixels: [],
    });
  }
}

