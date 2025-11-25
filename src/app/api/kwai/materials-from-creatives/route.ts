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

    // Buscar criativos (endpoint que funciona!)
    const creativesResponse = await kwaiAPI.getCreatives(parseInt(accountId));

    if (!creativesResponse?.data?.data) {
      return NextResponse.json({
        success: true,
        materials: [],
        total: 0,
      });
    }

    const creatives = creativesResponse.data.data;

    // Extrair photoIds únicos
    const materialsMap = new Map();

    for (const creative of creatives) {
      if (creative.photoId && creative.photoId > 0) {
        // Usar photoId como chave para evitar duplicatas
        if (!materialsMap.has(creative.photoId)) {
          materialsMap.set(creative.photoId, {
            photoId: creative.photoId,
            materialType: creative.materialType, // 1 = video, 2 = image
            // Pegar nome do primeiro criativo que usa esse material
            name: creative.creativeName || `Material ${creative.photoId}`,
            // Info adicional
            usedInCreatives: 1,
            lastUsed: creative.createTime,
            // Se tiver cover/thumbnail
            coverUrl: creative.coverUrl || null,
          });
        } else {
          // Material já existe, incrementar contador
          const existing = materialsMap.get(creative.photoId);
          existing.usedInCreatives++;
          // Atualizar lastUsed se esse for mais recente
          if (creative.createTime && existing.lastUsed && creative.createTime > existing.lastUsed) {
            existing.lastUsed = creative.createTime;
          }
        }
      }
    }

    // Converter Map para array e ordenar por uso
    const materials = Array.from(materialsMap.values()).sort(
      (a, b) => b.usedInCreatives - a.usedInCreatives
    );

    console.log(`=== MATERIALS FROM CREATIVES ===`);
    console.log(`Total creatives: ${creatives.length}`);
    console.log(`Unique materials: ${materials.length}`);
    console.log(`================================`);

    return NextResponse.json({
      success: true,
      materials,
      total: materials.length,
      source: "extracted_from_creatives",
    });
  } catch (error: any) {
    console.error("Erro ao buscar materiais:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        materials: [],
      },
      { status: 500 }
    );
  }
}

