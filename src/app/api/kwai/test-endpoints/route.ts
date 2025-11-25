import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import axios from "axios";

// Domínios para testar
const DOMAINS = ["https://developers.kwai.com", "https://ad.e.kuaishou.com"];

// Endpoints para testar em cada domínio
const ENDPOINTS_TO_TEST = [
  // === MATERIAIS ===
  // Formato OpenAPI (usado no SDK oficial)
  {
    name: "openapi-video-list",
    path: "/rest/openapi/v1/file/ad/video/list",
    method: "post",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-image-list",
    path: "/rest/openapi/v1/file/ad/image/list",
    method: "post",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-video-get",
    path: "/rest/openapi/v1/file/ad/video/get",
    method: "post",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-image-get",
    path: "/rest/openapi/v1/file/ad/image/get",
    method: "post",
    bodyType: "advertiserId",
  },

  // Formato MAPI
  {
    name: "mapi-material",
    path: "/rest/n/mapi/material/list",
    method: "post",
    bodyType: "accountId",
  },
  {
    name: "mapi-video",
    path: "/rest/n/mapi/file/video/list",
    method: "post",
    bodyType: "accountId",
  },
  {
    name: "mapi-image",
    path: "/rest/n/mapi/file/image/list",
    method: "post",
    bodyType: "accountId",
  },

  // === CONVERSÕES/PIXELS ===
  {
    name: "openapi-convert",
    path: "/rest/openapi/v1/tool/convert/list",
    method: "post",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-pixel",
    path: "/rest/openapi/v1/pixel/list",
    method: "post",
    bodyType: "advertiserId",
  },
  {
    name: "mapi-convert",
    path: "/rest/n/mapi/tool/convert/list",
    method: "post",
    bodyType: "accountId",
  },
  {
    name: "mapi-pixel",
    path: "/rest/n/mapi/pixel/list",
    method: "post",
    bodyType: "accountId",
  },

  // === OCPC (Conversões otimizadas) ===
  {
    name: "openapi-ocpc",
    path: "/rest/openapi/v1/unit/ocpc/conversion/list",
    method: "post",
    bodyType: "advertiserId",
  },
  {
    name: "mapi-ocpc",
    path: "/rest/n/mapi/unit/ocpc/list",
    method: "post",
    bodyType: "accountId",
  },

  // === CRIATIVOS (para comparar - sabemos que funciona) ===
  {
    name: "mapi-creative",
    path: "/rest/n/mapi/creative/dspCreativePageQueryPerformance",
    method: "post",
    bodyType: "accountId",
  },
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

    // Testar cada domínio
    for (const domain of DOMAINS) {
      console.log(`\n========== TESTANDO DOMÍNIO: ${domain} ==========\n`);

      // Testar cada endpoint
      for (const endpoint of ENDPOINTS_TO_TEST) {
        const url = `${domain}${endpoint.path}`;

        // Montar body baseado no tipo
        const body =
          endpoint.bodyType === "advertiserId"
            ? { advertiserId: parseInt(accountId), pageNo: 1, pageSize: 10 }
            : { accountId: parseInt(accountId), pageNo: 1, pageSize: 10 };

        try {
          console.log(`Testando: ${url}`);

          const response = await axios({
            method: endpoint.method,
            url: url,
            headers: {
              "Content-Type": "application/json",
              "Access-Token": tokenData.access_token,
            },
            data: body,
            timeout: 10000, // 10 segundos timeout
          });

          results.push({
            domain,
            name: endpoint.name,
            path: endpoint.path,
            url,
            status: response.status,
            success: true,
            hasData: !!response.data?.data,
            dataLength: response.data?.data?.length || 0,
            responsePreview: JSON.stringify(response.data).substring(0, 200),
          });

          console.log(`✅ FUNCIONA: ${url}`);
          console.log(`   Status: ${response.status}`);
          console.log(
            `   Data: ${JSON.stringify(response.data).substring(0, 100)}...`
          );
        } catch (error: any) {
          const status = error.response?.status || "timeout";
          const errorData = error.response?.data;

          results.push({
            domain,
            name: endpoint.name,
            path: endpoint.path,
            url,
            status: status,
            success: false,
            error: error.message,
            errorData: errorData
              ? JSON.stringify(errorData).substring(0, 200)
              : null,
          });

          // Logar erros diferentes de 404
          if (status !== 404) {
            console.log(`⚠️ ERRO ${status}: ${url}`);
            console.log(`   Mensagem: ${error.message}`);
            if (errorData) {
              console.log(
                `   Response: ${JSON.stringify(errorData).substring(0, 100)}`
              );
            }
          }
        }
      }
    }

    // Separar resultados por domínio
    const byDomain: any = {};
    for (const domain of DOMAINS) {
      const domainResults = results.filter((r) => r.domain === domain);
      byDomain[domain] = {
        working: domainResults.filter((r) => r.success),
        errors: domainResults.filter((r) => !r.success && r.status !== 404),
        notFound: domainResults.filter((r) => r.status === 404).length,
      };
    }

    // Resumo geral
    const allWorking = results.filter((r) => r.success);

    return NextResponse.json({
      success: true,
      summary: {
        totalTests: results.length,
        totalWorking: allWorking.length,
        domains: DOMAINS,
      },
      byDomain,
      allWorking,
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
