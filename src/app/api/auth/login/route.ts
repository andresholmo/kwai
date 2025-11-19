import { NextResponse } from "next/server";
import { getKwaiAuthUrl } from "@/lib/kwai/auth";

export async function GET() {
  try {
    const authUrl = getKwaiAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}

