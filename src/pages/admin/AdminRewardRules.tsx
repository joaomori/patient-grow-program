import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, X } from "lucide-react";

interface RewardRule {
  id: string;
  name: string;
  description: string | null;
  conversions_required: number;
  reward_type: string;
  reward_value: string;
  is_active: boolean;
  image_url: string | null;
}

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export default function AdminRewardRules() {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conversions, setConversions] = useState("3");
  const [type, setType] = useState("procedure");
  const [value, setValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchRules = async () => {
    const { data } = await supabase.from("reward_rules").select("*").order("created_at", { ascending: false });
    if (data) setRules(data as RewardRule[]);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Use JPG, PNG ou WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "Imagem muito grande", description: "O limite é 5 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("metas").upload(path, file, { contentType: file.type });
    if (error) {
      setUploading(false);
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
      return;
    }
    const { data, error: urlErr } = await supabase.storage.from("metas").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setUploading(false);
    if (urlErr || !data) {
      toast({ title: "Erro ao gerar link da imagem", variant: "destructive" });
      return;
    }
    setImageUrl(data.signedUrl);
  };

  const handleCreate = async () => {
    if (!name.trim() || !value.trim()) return;
    const { error } = await supabase.from("reward_rules").insert({
      name: name.trim(),
      description: description.trim() || null,
      conversions_required: parseInt(conversions),
      reward_type: type,
      reward_value: value.trim(),
      image_url: imageUrl.trim() || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Regra criada!" });
    setOpen(false);
    setName(""); setDescription(""); setConversions("3"); setValue(""); setImageUrl("");
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
          <DialogContent className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-lg flex-col gap-0 p-0">
            <DialogHeader className="border-b p-6 pb-4"><DialogTitle>Nova Regra de Recompensa</DialogTitle></DialogHeader>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Limpeza de pele" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da recompensa" />
              </div>
              <div className="space-y-2">
                <Label>Imagem da meta</Label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
                {imageUrl ? (
                  <div className="space-y-2">
                    <img src={imageUrl} alt="Prévia da meta" className="h-32 w-full rounded-md border object-cover" />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> {uploading ? "Enviando..." : "Trocar imagem"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl("")}>
                        <X className="mr-2 h-4 w-4" /> Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> {uploading ? "Enviando..." : "Anexar imagem"}
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP, até 5 MB.</p>
                <Input className="h-8 text-xs" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="ou cole o link de uma imagem" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>
              <div className="space-y-2">
                <Label>Recompensa</Label>
                <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Ex: 1 limpeza de pele grátis" />
              </div>
            </div>
            <div className="flex gap-2 border-t p-4">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={uploading}>Salvar</Button>
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
