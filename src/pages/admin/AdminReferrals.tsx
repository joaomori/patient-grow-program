import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, Pencil, MessageCircle, Plus } from "lucide-react";
import { formatWhatsAppUrl } from "@/lib/whatsapp";

interface Referral {
  id: string;
  referred_name: string;
  referred_phone: string;
  referred_email: string | null;
  status: string;
  created_at: string;
  confirmed_at: string | null;
  deal_value: number | null;
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

interface Affiliate {
  id: string;
  referral_code: string;
  profiles?: { full_name: string | null } | null;
}

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [editForm, setEditForm] = useState({ referred_name: "", referred_phone: "", referred_email: "", status: "", deal_value: "" });
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ referred_name: "", referred_phone: "", referred_email: "", affiliate_id: "" });
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const { toast } = useToast();

  const openEdit = (r: Referral) => {
    setEditForm({
      referred_name: r.referred_name,
      referred_phone: r.referred_phone,
      referred_email: r.referred_email ?? "",
      status: r.status,
      deal_value: r.deal_value != null ? String(r.deal_value) : "",
    });
    setEditingReferral(r);
  };

  const saveEdit = async () => {
    if (!editingReferral) return;
    if (!editForm.referred_email.trim()) {
      toast({ title: "Email é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const updates: Record<string, unknown> = {
      referred_name: editForm.referred_name.trim(),
      referred_phone: editForm.referred_phone.trim(),
      referred_email: editForm.referred_email.trim(),
      status: editForm.status,
      deal_value: editForm.deal_value ? parseFloat(editForm.deal_value) : null,
    };
    if (editForm.status === "converted" && editingReferral.status !== "converted") {
      updates.confirmed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("referrals").update(updates).eq("id", editingReferral.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Indicação atualizada" });
    setEditingReferral(null);
    fetchData();
  };

  const fetchData = async () => {
    const { data } = await supabase
      .from("referrals")
      .select("*, affiliates(referral_code, profiles(full_name))")
      .order("created_at", { ascending: false });
    if (data) setReferrals(data as unknown as Referral[]);
  };

  const fetchAffiliates = async () => {
    const { data } = await supabase
      .from("affiliates")
      .select("id, referral_code, profiles(full_name)")
      .eq("is_active", true)
      .order("referral_code");
    if (data) setAffiliates(data as unknown as Affiliate[]);
  };

  useEffect(() => {
    fetchData();
    fetchAffiliates();

    const channel = supabase
      .channel("admin-referrals-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "referrals" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openCreate = () => {
    setCreateForm({ referred_name: "", referred_phone: "", referred_email: "", affiliate_id: "" });
    setShowCreate(true);
  };

  const saveCreate = async () => {
    if (!createForm.referred_name.trim() || !createForm.referred_phone.trim() || !createForm.affiliate_id) {
      toast({ title: "Nome, telefone e afiliado são obrigatórios", variant: "destructive" });
      return;
    }
    if (!createForm.referred_email.trim()) {
      toast({ title: "Email é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("referrals").insert({
      referred_name: createForm.referred_name.trim(),
      referred_phone: createForm.referred_phone.trim(),
      referred_email: createForm.referred_email.trim(),
      affiliate_id: createForm.affiliate_id,
      status: "pending",
    });
    if (error) {
      toast({ title: "Erro ao criar indicação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Indicação criada com sucesso" });
      setShowCreate(false);
      fetchData();
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "converted") {
      updates.confirmed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("referrals").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
      return;
    }
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
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nova Indicação</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(opt => (
          <Button key={opt.value} variant={filterStatus === opt.value ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(opt.value)}>
            {opt.label}{opt.value === "all" ? ` (${referrals.length})` : counts[opt.value] ? ` (${counts[opt.value]})` : ""}
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
              <TableHead>Valor</TableHead>
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
                <TableCell className="text-sm">{r.deal_value != null ? `R$ ${r.deal_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</TableCell>
                <TableCell className="text-sm">{format(new Date(r.created_at), "dd/MM/yyyy")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(formatWhatsAppUrl(r.referred_phone), "_blank")} title="WhatsApp">
                      <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma indicação registrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingReferral} onOpenChange={(open) => !open && setEditingReferral(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Indicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editForm.referred_name} onChange={e => setEditForm(f => ({ ...f, referred_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={editForm.referred_phone} onChange={e => setEditForm(f => ({ ...f, referred_phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" required value={editForm.referred_email} onChange={e => setEditForm(f => ({ ...f, referred_email: e.target.value }))} placeholder="Obrigatório para o CRM" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor do procedimento (R$)</Label>
              <Input type="number" step="0.01" min="0" placeholder="Ex: 1500.00" value={editForm.deal_value} onChange={e => setEditForm(f => ({ ...f, deal_value: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReferral(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Indicação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Afiliado *</Label>
              <Select value={createForm.affiliate_id} onValueChange={v => setCreateForm(f => ({ ...f, affiliate_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o afiliado" />
                </SelectTrigger>
                <SelectContent>
                  {affiliates.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.profiles?.full_name || a.referral_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={createForm.referred_name} onChange={e => setCreateForm(f => ({ ...f, referred_name: e.target.value }))} placeholder="Nome do indicado" />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input value={createForm.referred_phone} onChange={e => setCreateForm(f => ({ ...f, referred_phone: e.target.value }))} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={createForm.referred_email} onChange={e => setCreateForm(f => ({ ...f, referred_email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={saveCreate} disabled={saving}>{saving ? "Salvando..." : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
