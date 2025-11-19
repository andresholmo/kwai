"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "./useSupabase";

export function useKwaiConnection() {
  const supabase = useSupabase();
  const [isConnected, setIsConnected] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    try {
      // Verificar se há token válido
      const { data: tokens } = await (supabase.from("kwai_tokens") as any)
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (tokens) {
        setIsConnected(true);

        // Buscar contas
        const { data: accountsData } = await (supabase.from("kwai_accounts") as any)
          .select("*")
          .eq("status", "active");

        setAccounts(accountsData || []);
      } else {
        setIsConnected(false);
        setAccounts([]);
      }
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setIsConnected(false);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const connect = () => {
    // Redirecionar para iniciar OAuth
    window.location.href = "/api/kwai/auth";
  };

  const disconnect = async () => {
    try {
      // Deletar tokens
      await (supabase.from("kwai_tokens") as any)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Marcar contas como inativas
      await (supabase.from("kwai_accounts") as any)
        .update({ status: "deleted" })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      setIsConnected(false);
      setAccounts([]);
    } catch (error) {
      console.error("Erro ao desconectar:", error);
    }
  };

  return {
    isConnected,
    accounts,
    loading,
    connect,
    disconnect,
    refresh: checkConnection,
  };
}

