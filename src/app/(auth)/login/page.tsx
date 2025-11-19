"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("Failed to get auth URL");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Kwai Marketing</CardTitle>
          <CardDescription>
            Faça login com sua conta Kwai para acessar o dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogin} 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? "Carregando..." : "Entrar com Kwai"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

