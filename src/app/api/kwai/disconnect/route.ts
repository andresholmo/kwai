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

    // Deletar tokens
    await supabase.from("kwai_tokens").delete().eq("user_id", user.id);

    // Deletar contas
    await supabase.from("kwai_accounts").delete().eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      message: "Desconectado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao desconectar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

