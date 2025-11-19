import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Target, Image, BarChart3 } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();

  // Buscar estatísticas básicas
  const { count: campaignsCount } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });

  const { count: adSetsCount } = await supabase
    .from("ad_sets")
    .select("*", { count: "exact", head: true });

  const { count: creativesCount } = await supabase
    .from("creatives")
    .select("*", { count: "exact", head: true });

  const { count: materialsCount } = await supabase
    .from("materials")
    .select("*", { count: "exact", head: true });

  const stats = [
    {
      title: "Campanhas",
      value: campaignsCount || 0,
      icon: Megaphone,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Ad Sets",
      value: adSetsCount || 0,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Criativos",
      value: creativesCount || 0,
      icon: Image,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Materiais",
      value: materialsCount || 0,
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Visão geral das suas campanhas no Kwai</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Megaphone className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">Conecte sua conta do Kwai</h3>
              <p className="text-sm text-gray-500">
                Conecte sua conta do Kwai Business para começar a criar campanhas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

