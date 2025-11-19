"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { exchangeCodeForTokens } from "@/lib/kwai/auth";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Processando autenticação...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Erro na autenticação: ${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Código de autorização não encontrado");
      return;
    }

    const handleAuth = async () => {
      try {
        await exchangeCodeForTokens(code);
        setStatus("success");
        setMessage("Autenticação realizada com sucesso! Redirecionando...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Erro ao processar autenticação"
        );
      }
    };

    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {status === "loading" && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            )}
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Carregando...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

