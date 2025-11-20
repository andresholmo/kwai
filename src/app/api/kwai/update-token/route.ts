import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Dados do novo token
    const newToken = {
      access_token: "f613b6fe-fd68-4c19-95dd-80bc4f99fb23",
      refresh_token: "2644749c-b3b3-4dec-be2f-b10ff2ae010d",
      token_type: "bearer",
      expires_in: 3599,
      scope:
        "ad_mapi_report ad_mapi_campaign_write ad_mapi_campaign_read ad_mapi_unit_write ad_mapi_unit_read ad_mapi_creative_write ad_mapi_creative_read ad_mapi_material_write ad_mapi_material_read profile_mapi_post_read",
    };

    // Deletar token antigo
    await (supabase.from("kwai_tokens") as any)
      .delete()
      .eq("user_id", user.id);

    // Salvar novo token
    const expiresAt = new Date(Date.now() + newToken.expires_in * 1000);

    const { error: tokenError } = await (supabase.from("kwai_tokens") as any).insert({
      user_id: user.id,
      access_token: newToken.access_token,
      refresh_token: newToken.refresh_token,
      token_type: newToken.token_type,
      expires_in: newToken.expires_in,
      expires_at: expiresAt.toISOString(),
      scope: newToken.scope,
    });

    if (tokenError) {
      throw tokenError;
    }

    return NextResponse.json({
      success: true,
      message: "Token atualizado com todas as permissões!",
      scopes: newToken.scope.split(" "),
    });
  } catch (error: any) {
    console.error("Erro:", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}

