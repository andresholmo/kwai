import { NextResponse } from "next/server";

export async function GET() {
  // Construir URL de autorização do Kwai
  const authUrl = new URL(process.env.KWAI_AUTH_URL!);

  authUrl.searchParams.append("client_id", process.env.KWAI_CLIENT_ID!);
  authUrl.searchParams.append(
    "redirect_uri",
    process.env.KWAI_REDIRECT_URI!
  );
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append(
    "scope",
    "ad_mapi_report ad_mapi_campaign_read ad_mapi_campaign_write ad_mapi_unit_read ad_mapi_unit_write ad_mapi_creative_read ad_mapi_creative_write ad_mapi_material_read ad_mapi_material_write"
  );

  return NextResponse.redirect(authUrl.toString());
}

