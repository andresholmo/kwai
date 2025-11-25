import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import axios from "axios";

// Lista de endpoints possíveis para testar
const ENDPOINTS_TO_TEST = [
  // Materiais - variações possíveis
  { name: "material-query", path: "/rest/n/mapi/material/query", method: "post" },
  { name: "material-list", path: "/rest/n/mapi/material/list", method: "post" },
  {
    name: "material-video-list",
    path: "/rest/n/mapi/material/video/list",
    method: "post",
  },
  {
    name: "material-image-list",
    path: "/rest/n/mapi/material/image/list",
    method: "post",
  },
  { name: "file-video-list", path: "/rest/n/mapi/file/video/list", method: "post" },
  { name: "file-image-list", path: "/rest/n/mapi/file/image/list", method: "post" },
  {
    name: "creative-material",
    path: "/rest/n/mapi/creative/material/list",
    method: "post",
  },
  { name: "asset-list", path: "/rest/n/mapi/asset/list", method: "post" },
  { name: "video-list", path: "/rest/n/mapi/video/list", method: "post" },

  // Conversões/Pixels - variações possíveis
  { name: "convert-list", path: "/rest/n/mapi/convert/list", method: "post" },
  {
    name: "conversion-list",
    path: "/rest/n/mapi/conversion/list",
    method: "post",
  },
  { name: "pixel-list", path: "/rest/n/mapi/pixel/list", method: "post" },
  {
    name: "tool-convert",
    path: "/rest/n/mapi/tool/convert/list",
    method: "post",
  },
  { name: "tool-pixel", path: "/rest/n/mapi/tool/pixel/list", method: "post" },
  { name: "track-list", path: "/rest/n/mapi/track/list", method: "post" },
  { name: "event-list", path: "/rest/n/mapi/event/list", method: "post" },

  // DSP endpoints - variações
  { name: "dsp-material", path: "/rest/n/mapi/dsp/material/list", method: "post" },
  { name: "dsp-video", path: "/rest/n/mapi/dsp/video/list", method: "post" },
  { name: "dsp-convert", path: "/rest/n/mapi/dsp/convert/list", method: "post" },

  // OpenAPI style
  {
    name: "openapi-video",
    path: "/rest/openapi/v1/file/ad/video/list",
    method: "post",
  },
  {
    name: "openapi-image",
    path: "/rest/openapi/v1/file/ad/image/list",
    method: "post",
  },
  {
    name: "openapi-convert",
    path: "/rest/openapi/v1/tool/convert/list",
    method: "post",
  },

  // Outros
  { name: "ad-material", path: "/rest/n/mapi/ad/material/list", method: "post" },
  { name: "creative-list", path: "/rest/n/mapi/creative/list", method: "post" },
];

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

    const results: any[] = [];

    // Testar cada endpoint
    for (const endpoint of ENDPOINTS_TO_TEST) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `https://developers.kwai.com${endpoint.path}`,
          headers: {
            "Content-Type": "application/json",
            "Access-Token": tokenData.access_token,
          },
          data: {
            accountId: parseInt(accountId),
            pageNo: 1,
            pageSize: 10,
          },
          timeout: 5000, // 5 segundos timeout
        });

        results.push({
          name: endpoint.name,
          path: endpoint.path,
          status: response.status,
          success: true,
          data: response.data,
        });

        console.log(`✅ ENDPOINT FUNCIONA: ${endpoint.path}`);
        console.log("Response:", JSON.stringify(response.data, null, 2));
      } catch (error: any) {
        const status = error.response?.status || "timeout";
        results.push({
          name: endpoint.name,
          path: endpoint.path,
          status: status,
          success: false,
          error: error.message,
        });

        // Só logar se não for 404 (404 é esperado para endpoints inexistentes)
        if (status !== 404) {
          console.log(`⚠️ ${endpoint.path}: ${status} - ${error.message}`);
        }
      }
    }

    // Separar endpoints que funcionam dos que não funcionam
    const working = results.filter((r) => r.success);
    const notFound = results.filter((r) => r.status === 404);
    const otherErrors = results.filter((r) => !r.success && r.status !== 404);

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        working: working.length,
        notFound: notFound.length,
        otherErrors: otherErrors.length,
      },
      working,
      otherErrors,
      // Não retornar todos os 404 para não poluir
      notFoundCount: notFound.length,
    });
  } catch (error: any) {
    console.error("Erro ao testar endpoints:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

