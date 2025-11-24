"use client";

import { useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export function TokenAutoRefresh() {
  const { toast } = useToast();

  const checkAndRefreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/kwai/check-token");
      const data = await res.json();

      if (data.needsRefresh) {
        console.log("Token expirando, renovando automaticamente...");

        const refreshRes = await fetch("/api/kwai/refresh-token", { method: "POST" });
        const refreshData = await refreshRes.json();

        if (refreshData.success) {
          console.log("Token renovado automaticamente!");
          toast({
            title: "🔄 Token renovado",
            description: "Conexão mantida automaticamente",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao verificar token:", error);
    }
  }, [toast]);

  useEffect(() => {
    // Verificar ao carregar
    checkAndRefreshToken();

    // Verificar a cada 10 minutos
    const interval = setInterval(checkAndRefreshToken, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAndRefreshToken]);

  return null; // Componente invisível
}

