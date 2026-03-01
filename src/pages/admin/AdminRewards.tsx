import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Reward {
  id: string;
  status: string;
  awarded_at: string;
  delivered_at: string | null;
  affiliates?: { referral_code: string; profiles?: { full_name: string | null } | null } | null;
  reward_rules?: { name: string; reward_value: string } | null;
}

export default function AdminRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    const { data } = await supabase
      .from("rewards")
      .select("*, affiliates(referral_code, profiles(full_name)), reward_rules(name, reward_value)")
      .order("awarded_at", { ascending: false });
    if (data) setRewards(data as unknown as Reward[]);
  };

  useEffect(() => { fetchData(); }, []);

  const markDelivered = async (id: string) => {
    await supabase.from("rewards").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", id);
    toast({ title: "Recompensa entregue!" });
    fetchData();
  };

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Afiliado</TableHead>
            <TableHead>Recompensa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rewards.map(r => (
            <TableRow key={r.id}>
              <TableCell>{r.affiliates?.profiles?.full_name ?? r.affiliates?.referral_code ?? "—"}</TableCell>
              <TableCell>{r.reward_rules?.reward_value ?? r.reward_rules?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={r.status === "delivered" ? "default" : "secondary"}>
                  {r.status === "delivered" ? "Entregue" : "Pendente"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{format(new Date(r.awarded_at), "dd/MM/yyyy")}</TableCell>
              <TableCell>
                {r.status === "pending" && (
                  <Button size="sm" onClick={() => markDelivered(r.id)}>Marcar entregue</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {rewards.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhuma recompensa registrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
