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
    console.log("=== FETCHING CREATIVES FOR MATERIALS ===");
    console.log("AccountId:", accountId);
    
    const creativesResponse = await kwaiAPI.getCreatives(parseInt(accountId));

    console.log("Response structure:", JSON.stringify(creativesResponse).substring(0, 500));
    console.log("Response total:", creativesResponse?.total);
    console.log("Response data exists:", !!creativesResponse?.data);
    console.log("Response data is array:", Array.isArray(creativesResponse?.data));

    // getCreatives retorna { total: X, data: [...] }
    // Então creativesResponse já é o objeto com total e data
    const creatives = creativesResponse?.data || [];
    
    if (!creatives || creatives.length === 0) {
      console.log("No creatives data found");
      return NextResponse.json({
        success: true,
        materials: [],
        total: 0,
      });
    }

    console.log("Total creatives:", creatives.length);
    
    // Log do primeiro criativo para ver estrutura
    if (creatives.length > 0) {
      console.log("First creative sample:", JSON.stringify(creatives[0]).substring(0, 500));
      console.log("First creative keys:", Object.keys(creatives[0]));
    }

    // Extrair photoIds únicos
    const materialsMap = new Map();
    let photoIdCount = 0;
    let noPhotoIdCount = 0;

    for (const creative of creatives) {
      // Verificar diferentes possíveis nomes de campo
      const photoId = creative.photoId || creative.photo_id || creative.materialId || creative.material_id;
      
      if (photoId && photoId > 0) {
        photoIdCount++;
        // Usar photoId como chave para evitar duplicatas
        if (!materialsMap.has(photoId)) {
          materialsMap.set(photoId, {
            photoId: photoId,
            materialType: creative.materialType || creative.material_type || 1, // 1 = video, 2 = image
            // Pegar nome do primeiro criativo que usa esse material
            name: creative.creativeName || creative.creative_name || `Material ${photoId}`,
            // Info adicional
            usedInCreatives: 1,
            lastUsed: creative.createTime || creative.create_time || null,
            // Se tiver cover/thumbnail
            coverUrl: creative.coverUrl || creative.cover_url || null,
          });
        } else {
          // Material já existe, incrementar contador
          const existing = materialsMap.get(photoId);
          existing.usedInCreatives++;
          // Atualizar lastUsed se esse for mais recente
          const createTime = creative.createTime || creative.create_time;
          if (createTime && existing.lastUsed && createTime > existing.lastUsed) {
            existing.lastUsed = createTime;
          }
        }
      } else {
        noPhotoIdCount++;
      }
    }
    
    console.log(`PhotoIds encontrados: ${photoIdCount}`);
    console.log(`Criativos sem photoId: ${noPhotoIdCount}`);

    // Converter Map para array e ordenar por uso
    const materials = Array.from(materialsMap.values()).sort(
      (a, b) => b.usedInCreatives - a.usedInCreatives
    );

    console.log(`=== MATERIALS EXTRACTED ===`);
    console.log(`Total creatives: ${creatives.length}`);
    console.log(`Unique materials: ${materials.length}`);
    if (materials.length > 0) {
      console.log(`First 3 materials:`, materials.slice(0, 3).map(m => ({
        photoId: m.photoId,
        name: m.name,
        type: m.materialType,
        used: m.usedInCreatives
      })));
    }
    console.log(`============================`);

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

