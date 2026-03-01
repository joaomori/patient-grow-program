import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Affiliate {
  id: string;
  referral_code: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null; email: string | null } | null;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const { toast } = useToast();

  const fetch = async () => {
    const { data } = await supabase
      .from("affiliates")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    if (data) setAffiliates(data as unknown as Affiliate[]);
  };

  useEffect(() => { fetch(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("affiliates").update({ is_active: !current }).eq("id", id);
    toast({ title: current ? "Afiliado desativado" : "Afiliado ativado" });
    fetch();
  };

  return (
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {affiliates.map(a => (
            <TableRow key={a.id}>
              <TableCell>{a.profiles?.full_name ?? "—"}</TableCell>
              <TableCell>{a.profiles?.email ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{a.referral_code}</TableCell>
              <TableCell>
                <Badge variant={a.is_active ? "default" : "secondary"}>
                  {a.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => toggleActive(a.id, a.is_active)}>
                  {a.is_active ? "Desativar" : "Ativar"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {affiliates.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Nenhum afiliado cadastrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
