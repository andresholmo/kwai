import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize relatórios e análises das suas campanhas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios e Analytics</CardTitle>
          <CardDescription>
            Métricas detalhadas das suas campanhas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Gráficos e relatórios serão exibidos aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

