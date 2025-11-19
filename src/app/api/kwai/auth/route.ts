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
  authUrl.searchParams.append("scope", "ad_mapi_report");

  return NextResponse.redirect(authUrl.toString());
}

