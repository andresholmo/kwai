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
    const marketingType = searchParams.get("marketingType") || "2"; // 2 = Website

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

    try {
      const conversions = await kwaiAPI.getConversions(
        parseInt(accountId),
        parseInt(marketingType)
      );
      return NextResponse.json({
        success: true,
        conversions: conversions?.data || [],
      });
    } catch (error) {
      console.log("Conversions endpoint not available");
      return NextResponse.json({
        success: true,
        conversions: [],
      });
    }
  } catch (error: any) {
    console.error("Erro na API de conversões:", error);
    return NextResponse.json({
      success: true,
      conversions: [],
    });
  }
}

