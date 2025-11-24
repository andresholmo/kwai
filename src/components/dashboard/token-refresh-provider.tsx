"use client";

import { TokenAutoRefresh } from "./token-refresh";

export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TokenAutoRefresh />
      {children}
    </>
  );
}

