import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreativesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Criativos</h1>
        <p className="text-muted-foreground">
          Gerencie seus criativos de anúncios
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Criativos</CardTitle>
          <CardDescription>
            Todos os seus criativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum criativo encontrado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

