import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdSetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ad Sets</h1>
        <p className="text-muted-foreground">
          Gerencie seus conjuntos de anúncios
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Ad Sets</CardTitle>
          <CardDescription>
            Todos os seus conjuntos de anúncios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum ad set encontrado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

