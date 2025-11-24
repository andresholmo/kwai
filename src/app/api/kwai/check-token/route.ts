import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ connected: false });
    }

    const { data: tokenData } = await (supabase.from("kwai_tokens") as any)
      .select("expires_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!tokenData) {
      return NextResponse.json({ connected: false });
    }

    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    // Se expira em menos de 10 minutos, precisa renovar
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const needsRefresh = expiresAt <= tenMinutesFromNow;

    // Tempo restante em minutos
    const minutesRemaining = Math.round((expiresAt.getTime() - now.getTime()) / 60000);

    return NextResponse.json({
      connected: true,
      needsRefresh,
      expiresAt: expiresAt.toISOString(),
      minutesRemaining: Math.max(0, minutesRemaining),
    });
  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error.message });
  }
}

