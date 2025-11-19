import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function MaterialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materiais</h1>
          <p className="text-muted-foreground">
            Faça upload e gerencie seus materiais de mídia
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload de Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biblioteca de Materiais</CardTitle>
          <CardDescription>
            Seus materiais de mídia para uso em anúncios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum material encontrado. Faça upload do seu primeiro material.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

