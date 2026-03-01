import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface RewardRule {
  id: string;
  name: string;
  description: string | null;
  conversions_required: number;
  reward_type: string;
  reward_value: string;
  is_active: boolean;
}

export default function AdminRewardRules() {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conversions, setConversions] = useState("3");
  const [type, setType] = useState("procedure");
  const [value, setValue] = useState("");
  const { toast } = useToast();

  const fetchRules = async () => {
    const { data } = await supabase.from("reward_rules").select("*").order("created_at", { ascending: false });
    if (data) setRules(data);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !value.trim()) return;
    await supabase.from("reward_rules").insert({
      name: name.trim(),
      description: description.trim() || null,
      conversions_required: parseInt(conversions),
      reward_type: type,
      reward_value: value.trim(),
    });
    toast({ title: "Regra criada!" });
    setOpen(false);
    setName(""); setDescription(""); setConversions("3"); setValue("");
    fetchRules();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("reward_rules").update({ is_active: !current }).eq("id", id);
    fetchRules();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Regra de Recompensa</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Limpeza de pele" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da recompensa" />
              </div>
              <div className="space-y-2">
                <Label>Conversões necessárias</Label>
                <Input type="number" min="1" value={conversions} onChange={e => setConversions(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="procedure">Procedimento</SelectItem>
                    <SelectItem value="discount">Desconto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recompensa</Label>
                <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Ex: 1 limpeza de pele grátis" />
              </div>
              <Button className="w-full" onClick={handleCreate}>Criar Regra</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Conversões</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Recompensa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.conversions_required}</TableCell>
                <TableCell>{r.reward_type === "procedure" ? "Procedimento" : "Desconto"}</TableCell>
                <TableCell>{r.reward_value}</TableCell>
                <TableCell>
                  <Badge variant={r.is_active ? "default" : "secondary"}>
                    {r.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(r.id, r.is_active)}>
                    {r.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rules.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma regra criada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
