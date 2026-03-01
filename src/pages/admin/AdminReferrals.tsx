import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    const { data } = await supabase
      .from("referrals")
      .select("*, affiliates(referral_code, profiles(full_name))")
      .order("created_at", { ascending: false });
    if (data) setReferrals(data as unknown as Referral[]);
  };

  useEffect(() => { fetchData(); }, []);

  const confirm = async (id: string) => {
    await supabase.from("referrals").update({ status: "confirmed", confirmed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Indicação confirmada!" });
    fetchData();
  };

  const reject = async (id: string) => {
    await supabase.from("referrals").update({ status: "rejected" }).eq("id", id);
    toast({ title: "Indicação rejeitada" });
    fetchData();
  };

  const statusBadge = (s: string) => {
    if (s === "confirmed") return <Badge>Confirmada</Badge>;
    if (s === "rejected") return <Badge variant="destructive">Rejeitada</Badge>;
    return <Badge variant="secondary">Pendente</Badge>;
  };

  return (
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
          {referrals.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.referred_name}</TableCell>
              <TableCell>{r.referred_phone}</TableCell>
              <TableCell>{r.affiliates?.profiles?.full_name ?? r.affiliates?.referral_code ?? "—"}</TableCell>
              <TableCell>{statusBadge(r.status)}</TableCell>
              <TableCell className="text-sm">{format(new Date(r.created_at), "dd/MM/yyyy")}</TableCell>
              <TableCell>
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => confirm(r.id)}>Confirmar</Button>
                    <Button size="sm" variant="outline" onClick={() => reject(r.id)}>Rejeitar</Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
          {referrals.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhuma indicação registrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
