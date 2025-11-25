import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import axios from "axios";

// Testar apenas no domínio do Kwai Brasil com formatos OpenAPI
const DOMAIN = "https://developers.kwai.com";

const ENDPOINTS_TO_TEST = [
  // Formato OpenAPI - mesmo path do domínio chinês
  {
    name: "openapi-video-list",
    path: "/rest/openapi/v1/file/ad/video/list",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-image-list",
    path: "/rest/openapi/v1/file/ad/image/list",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-video-get",
    path: "/rest/openapi/v1/file/ad/video/get",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-image-get",
    path: "/rest/openapi/v1/file/ad/image/get",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-convert",
    path: "/rest/openapi/v1/tool/convert/list",
    bodyType: "advertiserId",
  },
  {
    name: "openapi-pixel",
    path: "/rest/openapi/v1/pixel/list",
    bodyType: "advertiserId",
  },

  // Variações com accountId ao invés de advertiserId
  {
    name: "openapi-video-list-acc",
    path: "/rest/openapi/v1/file/ad/video/list",
    bodyType: "accountId",
  },
  {
    name: "openapi-image-list-acc",
    path: "/rest/openapi/v1/file/ad/image/list",
    bodyType: "accountId",
  },
  {
    name: "openapi-convert-acc",
    path: "/rest/openapi/v1/tool/convert/list",
    bodyType: "accountId",
  },

  // Tentar com /gw/ prefix (alguns APIs usam gateway)
  {
    name: "gw-video-list",
    path: "/gw/rest/openapi/v1/file/ad/video/list",
    bodyType: "advertiserId",
  },
  {
    name: "gw-image-list",
    path: "/gw/rest/openapi/v1/file/ad/image/list",
    bodyType: "advertiserId",
  },
  {
    name: "gw-convert",
    path: "/gw/rest/openapi/v1/tool/convert/list",
    bodyType: "advertiserId",
  },

  // Tentar com /api/ prefix
  {
    name: "api-video-list",
    path: "/api/rest/openapi/v1/file/ad/video/list",
    bodyType: "advertiserId",
  },
  {
    name: "api-image-list",
    path: "/api/rest/openapi/v1/file/ad/image/list",
    bodyType: "advertiserId",
  },

  // MAPI com estrutura OpenAPI
  {
    name: "mapi-openapi-video",
    path: "/rest/n/mapi/file/ad/video/list",
    bodyType: "accountId",
  },
  {
    name: "mapi-openapi-image",
    path: "/rest/n/mapi/file/ad/image/list",
    bodyType: "accountId",
  },
  {
    name: "mapi-openapi-convert",
    path: "/rest/n/mapi/tool/convert/list",
    bodyType: "accountId",
  },

  // Tentar buscar via creative (já sabemos que funciona)
  {
    name: "creative-with-material",
    path: "/rest/n/mapi/creative/dspCreativePageQueryPerformance",
    bodyType: "accountId",
    extra: { adCategory: 1 },
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

    for (const endpoint of ENDPOINTS_TO_TEST) {
      const url = `${DOMAIN}${endpoint.path}`;

      // Montar body
      let body: any = { pageNo: 1, pageSize: 10 };
      if (endpoint.bodyType === "advertiserId") {
        body.advertiserId = parseInt(accountId);
      } else {
        body.accountId = parseInt(accountId);
      }
      if (endpoint.extra) {
        body = { ...body, ...endpoint.extra };
      }

      try {
        console.log(`Testando: ${url}`);
        console.log(`Body: ${JSON.stringify(body)}`);

        const response = await axios({
          method: "post",
          url: url,
          headers: {
            "Content-Type": "application/json",
            "Access-Token": tokenData.access_token,
          },
          data: body,
          timeout: 10000,
        });

        const isRealSuccess =
          response.data?.status !== 404 &&
          response.data?.status !== 500 &&
          response.data?.code !== 402004;

        results.push({
          name: endpoint.name,
          path: endpoint.path,
          bodyType: endpoint.bodyType,
          status: response.status,
          apiStatus: response.data?.status || response.data?.code,
          success: isRealSuccess,
          message: response.data?.message,
          hasData: !!response.data?.data,
          dataPreview: response.data?.data
            ? JSON.stringify(response.data.data).substring(0, 300)
            : null,
          fullResponse: JSON.stringify(response.data).substring(0, 500),
        });

        if (isRealSuccess) {
          console.log(`✅ FUNCIONA: ${endpoint.name}`);
          console.log(
            `   Response: ${JSON.stringify(response.data).substring(0, 200)}`
          );
        }
      } catch (error: any) {
        const status = error.response?.status || "timeout";
        results.push({
          name: endpoint.name,
          path: endpoint.path,
          status: status,
          success: false,
          error: error.message,
        });
      }
    }

    const working = results.filter((r) => r.success);
    const apiErrors = results.filter((r) => !r.success && r.status === 200); // 200 mas com erro interno
    const notFound = results.filter((r) => r.status === 404);

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        working: working.length,
        apiErrors: apiErrors.length,
        notFound: notFound.length,
      },
      working,
      apiErrors,
      allResults: results,
    });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
