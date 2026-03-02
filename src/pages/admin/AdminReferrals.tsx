import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search } from "lucide-react";

interface Referral {
  id: string;
  referred_name: string;
  referred_phone: string;
  referred_email: string | null;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  affiliates?: { referral_code: string; profiles?: { full_name: string | null } | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  pending: { label: "Pendente", variant: "secondary" },
  contacted: { label: "Contatado", variant: "outline" },
  scheduled: { label: "Agendado", className: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100/80" },
  attended: { label: "Atendido", className: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80" },
  converted: { label: "Convertido", className: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80" },
  confirmed: { label: "Confirmada", className: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80" },
  rejected: { label: "Rejeitada", variant: "destructive" },
};

const STATUS_OPTIONS = ["pending", "contacted", "scheduled", "attended", "converted", "rejected"] as const;

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    const { data } = await supabase
      .from("referrals")
      .select("*, affiliates(referral_code, profiles(full_name))")
      .order("created_at", { ascending: false });
    if (data) setReferrals(data as unknown as Referral[]);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "converted") {
      updates.confirmed_at = new Date().toISOString();
    }
    await supabase.from("referrals").update(updates).eq("id", id);
    toast({ title: `Status atualizado para: ${STATUS_CONFIG[newStatus]?.label ?? newStatus}` });
    fetchData();
  };

  const statusBadge = (s: string) => {
    const cfg = STATUS_CONFIG[s] ?? { label: s, variant: "secondary" as const };
    return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
  };

  const counts = referrals.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const searchLower = search.toLowerCase();
  const filtered = referrals
    .filter(r => filterStatus === "all" || r.status === filterStatus)
    .filter(r => !search || r.referred_name.toLowerCase().includes(searchLower) || r.referred_phone.includes(search));

  const FILTER_OPTIONS = [
    { value: "all", label: "Todos" },
    ...STATUS_OPTIONS.map(s => ({ value: s, label: STATUS_CONFIG[s].label })),
  ];

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(opt => (
          <Button
            key={opt.value}
            variant={filterStatus === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(opt.value)}
          >
            {opt.label}
            {opt.value === "all"
              ? ` (${referrals.length})`
              : counts[opt.value] ? ` (${counts[opt.value]})` : ""}
          </Button>
        ))}
      </div>
      <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Indicado</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Afiliado</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.referred_name}</TableCell>
              <TableCell>{r.referred_phone}</TableCell>
              <TableCell>{r.affiliates?.profiles?.full_name ?? r.affiliates?.referral_code ?? "—"}</TableCell>
              <TableCell>{statusBadge(r.status)}</TableCell>
              <TableCell className="text-sm">{format(new Date(r.created_at), "dd/MM/yyyy")}</TableCell>
              <TableCell>
                {r.status !== "converted" && r.status !== "confirmed" && r.status !== "rejected" && (
                  <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhuma indicação registrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
