import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Gift, TrendingUp, LogOut } from "lucide-react";
import AdminAffiliates from "./AdminAffiliates";
import AdminReferrals from "./AdminReferrals";
import AdminRewardRules from "./AdminRewardRules";
import AdminRewards from "./AdminRewards";

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [stats, setStats] = useState({ affiliates: 0, referrals: 0, confirmed: 0, rewards: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [aff, ref, conf, rew] = await Promise.all([
        supabase.from("affiliates").select("id", { count: "exact", head: true }),
        supabase.from("referrals").select("id", { count: "exact", head: true }),
        supabase.from("referrals").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
        supabase.from("rewards").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        affiliates: aff.count ?? 0,
        referrals: ref.count ?? 0,
        confirmed: conf.count ?? 0,
        rewards: rew.count ?? 0,
      });
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Afiliados", value: stats.affiliates, icon: Users },
    { label: "Indicações", value: stats.referrals, icon: TrendingUp },
    { label: "Conversões", value: stats.confirmed, icon: UserCheck },
    { label: "Recompensas", value: stats.rewards, icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Painel Admin — Dr. Erick</h1>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </header>

      <main className="mx-auto max-w-6xl p-4 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="affiliates">
          <TabsList>
            <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
            <TabsTrigger value="referrals">Indicações</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
            <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          </TabsList>
          <TabsContent value="affiliates"><AdminAffiliates /></TabsContent>
          <TabsContent value="referrals"><AdminReferrals /></TabsContent>
          <TabsContent value="rules"><AdminRewardRules /></TabsContent>
          <TabsContent value="rewards"><AdminRewards /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
