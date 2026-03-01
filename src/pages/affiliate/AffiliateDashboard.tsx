import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Copy, Send, Gift } from "lucide-react";
import { format } from "date-fns";

interface Referral {
  id: string;
  referred_name: string;
  referred_phone: string;
  status: string;
  created_at: string;
}

interface Reward {
  id: string;
  status: string;
  awarded_at: string;
  reward_rules?: { name: string; reward_value: string } | null;
}

interface RewardRule {
  id: string;
  name: string;
  conversions_required: number;
  reward_value: string;
  reward_type: string;
}

export default function AffiliateDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [affiliate, setAffiliate] = useState<{ id: string; referral_code: string } | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [confirmedCount, setConfirmedCount] = useState(0);

  // New referral form
  const [refName, setRefName] = useState("");
  const [refPhone, setRefPhone] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: aff } = await supabase
        .from("affiliates")
        .select("id, referral_code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!aff) return;
      setAffiliate(aff);

      const [refs, rews, rls] = await Promise.all([
        supabase.from("referrals").select("*").eq("affiliate_id", aff.id).order("created_at", { ascending: false }),
        supabase.from("rewards").select("*, reward_rules(name, reward_value)").eq("affiliate_id", aff.id).order("awarded_at", { ascending: false }),
        supabase.from("reward_rules").select("*").eq("is_active", true),
      ]);
      if (refs.data) {
        setReferrals(refs.data);
        setConfirmedCount(refs.data.filter(r => r.status === "confirmed").length);
      }
      if (rews.data) setRewards(rews.data as unknown as Reward[]);
      if (rls.data) setRules(rls.data);
    };
    load();
  }, [user]);

  const referralLink = affiliate
    ? `${window.location.origin}/indicar?ref=${affiliate.referral_code}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link copiado!" });
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate) return;
    setSubmitting(true);
    const { error } = await supabase.from("referrals").insert({
      affiliate_id: affiliate.id,
      referred_name: refName.trim(),
      referred_phone: refPhone.trim(),
      referred_email: refEmail.trim() || null,
    });
    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar.", variant: "destructive" });
    } else {
      toast({ title: "Indicação enviada!" });
      setRefName(""); setRefPhone(""); setRefEmail("");
      // refresh
      const { data } = await supabase.from("referrals").select("*").eq("affiliate_id", affiliate.id).order("created_at", { ascending: false });
      if (data) {
        setReferrals(data);
        setConfirmedCount(data.filter(r => r.status === "confirmed").length);
      }
    }
    setSubmitting(false);
  };

  // Progress toward next reward
  const activeRule = rules[0];
  const progressToNext = activeRule ? (confirmedCount % activeRule.conversions_required) : 0;
  const remaining = activeRule ? activeRule.conversions_required - progressToNext : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Painel do Afiliado</h1>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </header>

      <main className="mx-auto max-w-4xl p-4 space-y-6">
        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seu link de indicação</CardTitle>
            <CardDescription>Compartilhe com amigos e familiares</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input readOnly value={referralLink} className="font-mono text-xs" />
            <Button variant="outline" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
          </CardContent>
        </Card>

        {/* Progress */}
        {activeRule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" /> Progresso para recompensa
              </CardTitle>
              <CardDescription>
                {remaining > 0
                  ? `Faltam ${remaining} paciente(s) para ganhar: ${activeRule.reward_value}`
                  : "Você atingiu uma recompensa! 🎉"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={(progressToNext / activeRule.conversions_required) * 100} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {progressToNext} de {activeRule.conversions_required} conversões
              </p>
            </CardContent>
          </Card>
        )}

        {/* New referral form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" /> Nova indicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReferral} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={refName} onChange={e => setRefName(e.target.value)} required placeholder="Nome do indicado" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={refPhone} onChange={e => setRefPhone(e.target.value)} required placeholder="(11) 99999-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Email (opcional)</Label>
                  <Input value={refEmail} onChange={e => setRefEmail(e.target.value)} placeholder="email@email.com" />
                </div>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar indicação"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Referral list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Minhas indicações ({referrals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.referred_name}</TableCell>
                    <TableCell>{r.referred_phone}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "confirmed" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                        {r.status === "confirmed" ? "Confirmada" : r.status === "rejected" ? "Rejeitada" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(r.created_at), "dd/MM/yyyy")}</TableCell>
                  </TableRow>
                ))}
                {referrals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhuma indicação ainda
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Rewards */}
        {rewards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Minhas recompensas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recompensa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{r.reward_rules?.reward_value ?? r.reward_rules?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "delivered" ? "default" : "secondary"}>
                          {r.status === "delivered" ? "Entregue" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(r.awarded_at), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
