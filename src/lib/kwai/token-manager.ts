import { createClient } from "@/lib/supabase/server";
import { kwaiAPI } from "./api";

export async function getValidToken(userId: string): Promise<string | null> {
  const supabase = createClient();

  // Buscar token atual
  const { data: tokenData } = await (supabase.from("kwai_tokens") as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tokenData) {
    return null;
  }

  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();

  // Se expira em menos de 5 minutos, fazer refresh
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt <= fiveMinutesFromNow) {
    console.log("Token expirando, fazendo refresh...");

    try {
      const newTokenData = await kwaiAPI.refreshToken(tokenData.refresh_token);

      // Atualizar no banco
      await supabase.from("kwai_tokens").delete().eq("user_id", userId);

      const newExpiresAt = new Date(Date.now() + newTokenData.expires_in * 1000);

      await (supabase.from("kwai_tokens") as any).insert({
        user_id: userId,
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token,
        token_type: newTokenData.token_type,
        expires_in: newTokenData.expires_in,
        expires_at: newExpiresAt.toISOString(),
        scope: newTokenData.scope,
      });

      console.log("Token renovado automaticamente!");
      return newTokenData.access_token;
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      return tokenData.access_token; // Tentar usar o antigo mesmo
    }
  }

  return tokenData.access_token;
}

