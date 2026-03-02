import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, TrendingUp, TrendingDown, Clock, CheckCircle, Filter } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Legend,
  FunnelChart, Funnel, LabelList, Cell,
} from "recharts";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReferralRow {
  id: string;
  status: string;
  created_at: string;
  deal_value: number | null;
  affiliate_id: string;
  affiliates?: { referral_code: string; profiles?: { full_name: string | null } | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  contacted: "Contatado",
  scheduled: "Agendado",
  attended: "Atendido",
  converted: "Convertido",
  confirmed: "Confirmada",
  rejected: "Rejeitada",
};

const FUNNEL_COLORS = [
  "hsl(210, 70%, 50%)",
  "hsl(210, 60%, 58%)",
  "hsl(210, 50%, 65%)",
  "hsl(45, 80%, 50%)",
  "hsl(140, 60%, 45%)",
];

const FUNNEL_STAGES = ["pending", "contacted", "scheduled", "attended", "converted"];

export default function AdminReports() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("referrals")
        .select("id, status, created_at, deal_value, affiliate_id, affiliates(referral_code, profiles(full_name))");
      if (data) setReferrals(data as unknown as ReferralRow[]);
    };
    fetch();
  }, []);

  const filtered = useMemo(() => {
    if (period === "all") return referrals;
    const months = parseInt(period);
    const cutoff = subMonths(new Date(), months);
    return referrals.filter(r => new Date(r.created_at) >= cutoff);
  }, [referrals, period]);

  const totalLeads = filtered.length;
  const converted = filtered.filter(r => r.status === "converted" || r.status === "confirmed").length;
  const rejected = filtered.filter(r => r.status === "rejected").length;
  const inProgress = filtered.filter(r => !["converted", "confirmed", "rejected"].includes(r.status)).length;
  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : "0.0";
  const lossRate = totalLeads > 0 ? ((rejected / totalLeads) * 100).toFixed(1) : "0.0";

  // Funnel data
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    FUNNEL_STAGES.forEach(s => { counts[s] = 0; });
    // Cumulative: each stage includes all stages after it
    filtered.forEach(r => {
      const idx = FUNNEL_STAGES.indexOf(r.status);
      if (idx >= 0) {
        for (let i = 0; i <= idx; i++) counts[FUNNEL_STAGES[i]]++;
      } else if (r.status === "confirmed") {
        // confirmed = converted
        FUNNEL_STAGES.forEach(s => { counts[s]++; });
      }
    });
    // For pending, count all leads
    counts["pending"] = filtered.length;
    return FUNNEL_STAGES.map(s => ({
      name: STATUS_LABELS[s] || s,
      value: counts[s],
    }));
  }, [filtered]);

  // Leads by affiliate (origin)
  const originData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      const name = r.affiliates?.profiles?.full_name || r.affiliates?.referral_code || "Sem origem";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

  // Monthly evolution (last 6 months)
  const evolutionData = useMemo(() => {
    const now = new Date();
    const months: { month: string; total: number; fechados: number; perdidos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM 'de' yyyy", { locale: ptBR });
      const monthRefs = referrals.filter(r => r.created_at.startsWith(key));
      months.push({
        month: label,
        total: monthRefs.length,
        fechados: monthRefs.filter(r => r.status === "converted" || r.status === "confirmed").length,
        perdidos: monthRefs.filter(r => r.status === "rejected").length,
      });
    }
    return months;
  }, [referrals]);

  const kpis = [
    { label: "Total de Leads", value: totalLeads, sub: "No período selecionado", icon: Users, color: "text-foreground" },
    { label: "Taxa de Conversão", value: `${conversionRate}%`, sub: "Leads fechados", icon: TrendingUp, color: "text-green-600" },
    { label: "Taxa de Perda", value: `${lossRate}%`, sub: "Leads perdidos", icon: TrendingDown, color: "text-destructive" },
    { label: "Em Progresso", value: inProgress, sub: "Leads ativos", icon: Clock, color: "text-amber-500" },
    { label: "Fechados", value: converted, sub: "Negócios ganhos", icon: CheckCircle, color: "text-foreground" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <p className="text-muted-foreground text-sm">Análise completa de desempenho e métricas</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="1">Último mês</SelectItem>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil de Vendas</CardTitle>
            <CardDescription>Progressão dos leads no processo</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="name" fontSize={12} />
                  <LabelList position="center" fill="white" stroke="none" dataKey="value" fontSize={13} fontWeight={600} />
                  {funnelData.map((_, i) => (
                    <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads by origin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por Origem</CardTitle>
            <CardDescription>Principais fontes de leads</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={originData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Evolution chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução de Leads (Últimos 6 Meses)</CardTitle>
          <CardDescription>Tendência de leads, fechamentos e perdas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="total" stroke="hsl(0, 70%, 55%)" fill="hsl(0, 70%, 55%)" fillOpacity={0.1} name="Total Leads" />
              <Area type="monotone" dataKey="fechados" stroke="hsl(140, 60%, 45%)" fill="hsl(140, 60%, 45%)" fillOpacity={0.1} name="Fechados" />
              <Area type="monotone" dataKey="perdidos" stroke="hsl(45, 80%, 50%)" fill="hsl(45, 80%, 50%)" fillOpacity={0.1} name="Perdidos" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
