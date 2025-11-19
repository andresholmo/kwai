import { kwaiClient } from "./client";
import type { KwaiTokenResponse } from "./types";

export interface KwaiAuthState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
}

/**
 * Gera URL de autorização OAuth do Kwai
 * Nota: Esta função deve ser usada apenas no servidor
 */
export function getKwaiAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_KWAI_CLIENT_ID || process.env.KWAI_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_KWAI_REDIRECT_URI || process.env.KWAI_REDIRECT_URI!,
    response_type: "code",
    scope: "ads_read ads_write",
    ...(state && { state }),
  });

  const authUrl = process.env.NEXT_PUBLIC_KWAI_AUTH_URL || process.env.KWAI_AUTH_URL!;
  return `${authUrl}?${params.toString()}`;
}

/**
 * Troca código de autorização por tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<KwaiTokenResponse> {
  const response = await fetch(process.env.KWAI_TOKEN_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.KWAI_CLIENT_ID!,
      client_secret: process.env.KWAI_CLIENT_SECRET!,
      redirect_uri: process.env.KWAI_REDIRECT_URI!,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to exchange code for tokens");
  }

  const tokens: KwaiTokenResponse = await response.json();
  
  // Configura tokens no cliente
  kwaiClient.setTokens(tokens.access_token, tokens.refresh_token);

  return tokens;
}

/**
 * Salva tokens no Supabase (para persistência)
 */
export async function saveTokensToDatabase(
  userId: string,
  tokens: KwaiTokenResponse
): Promise<void> {
  // Implementar salvamento no Supabase
  // Esta função será implementada quando a estrutura do banco estiver pronta
}

