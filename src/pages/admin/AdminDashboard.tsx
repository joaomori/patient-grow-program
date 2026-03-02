import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, Gift, TrendingUp, LogOut, DollarSign, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminAffiliates from "./AdminAffiliates";
import AdminReferrals from "./AdminReferrals";
import AdminRewardRules from "./AdminRewardRules";
import AdminRewards from "./AdminRewards";

const PIE_COLORS = ["hsl(220,14%,70%)", "hsl(210,40%,60%)", "hsl(210,70%,50%)", "hsl(45,80%,50%)", "hsl(140,60%,45%)", "hsl(0,70%,55%)"];

interface ReferralRow {
  id: string;
  status: string;
  created_at: string;
  deal_value: number | null;
  affiliate_id: string;
  affiliates?: { profiles?: { full_name: string | null } | null } | null;
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [stats, setStats] = useState({ affiliates: 0, referrals: 0, confirmed: 0, rewards: 0 });
  const [revenue, setRevenue] = useState(0);
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [topAffiliates, setTopAffiliates] = useState<{ name: string; conversions: number; revenue: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      // Stats counts
      const [aff, ref, conf, rew] = await Promise.all([
        supabase.from("affiliates").select("id", { count: "exact", head: true }),
        supabase.from("referrals").select("id", { count: "exact", head: true }),
        supabase.from("referrals").select("id", { count: "exact", head: true }).eq("status", "confirmed").or("status.eq.converted"),
        supabase.from("rewards").select("id", { count: "exact", head: true }),
      ]);

      const confirmedCount = (conf.count ?? 0);
      setStats({
        affiliates: aff.count ?? 0,
        referrals: ref.count ?? 0,
        confirmed: confirmedCount,
        rewards: rew.count ?? 0,
      });

      // Fetch all referrals for charts
      const { data: allRefs } = await supabase
        .from("referrals")
        .select("id, status, created_at, deal_value, affiliate_id, affiliates(profiles(full_name))");

      if (!allRefs) return;
      const refs = allRefs as unknown as ReferralRow[];

      // Revenue
      const totalRevenue = refs.reduce((sum, r) => sum + ((r.status === "converted" || r.status === "confirmed") && r.deal_value ? r.deal_value : 0), 0);
      setRevenue(totalRevenue);

      // Monthly (last 6 months)
      const now = new Date();
      const months: { month: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const key = format(d, "yyyy-MM");
        const label = format(d, "MMM", { locale: ptBR });
        const count = refs.filter(r => r.created_at.startsWith(key)).length;
        months.push({ month: label, count });
      }
      setMonthlyData(months);

      // Status distribution
      const statusMap: Record<string, number> = {};
      const STATUS_LABELS: Record<string, string> = {
        pending: "Pendente", contacted: "Contatado", scheduled: "Agendado",
        attended: "Atendido", converted: "Convertido", confirmed: "Confirmada", rejected: "Rejeitada",
      };
      refs.forEach(r => { statusMap[r.status] = (statusMap[r.status] || 0) + 1; });
      setStatusData(Object.entries(statusMap).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v })));

      // Top affiliates
      const affMap: Record<string, { name: string; conversions: number; revenue: number }> = {};
      refs.forEach(r => {
        if (r.status !== "converted" && r.status !== "confirmed") return;
        const id = r.affiliate_id;
        if (!affMap[id]) {
          affMap[id] = { name: r.affiliates?.profiles?.full_name || id.slice(0, 8), conversions: 0, revenue: 0 };
        }
        affMap[id].conversions++;
        affMap[id].revenue += r.deal_value ?? 0;
      });
      setTopAffiliates(Object.values(affMap).sort((a, b) => b.conversions - a.conversions).slice(0, 5));
    };
    fetchAll();
  }, []);

  const ticketMedio = stats.confirmed > 0 ? revenue / stats.confirmed : 0;

  const statCards = [
    { label: "Afiliados", value: stats.affiliates, icon: Users },
    { label: "Indicações", value: stats.referrals, icon: TrendingUp },
    { label: "Conversões", value: stats.confirmed, icon: UserCheck },
    { label: "Recompensas", value: stats.rewards, icon: Gift },
    { label: "Receita Total", value: `R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign },
    { label: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: BarChart3 },
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
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Indicações por mês</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(222.2, 47.4%, 11.2%)" radius={[4, 4, 0, 0]} name="Indicações" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por status</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top affiliates */}
        {topAffiliates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Afiliados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Afiliado</TableHead>
                    <TableHead>Conversões</TableHead>
                    <TableHead>Receita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAffiliates.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{i + 1}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.conversions}</TableCell>
                      <TableCell>R$ {a.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
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
