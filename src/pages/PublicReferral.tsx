import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

export default function PublicReferral() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("ref");
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!code) { setInvalid(true); return; }
    supabase
      .from("affiliates")
      .select("id")
      .eq("referral_code", code)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAffiliateId(data.id);
        else setInvalid(true);
      });
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliateId) return;
    setLoading(true);

    const { data: insertedData, error } = await supabase.from("referrals").insert({
      affiliate_id: affiliateId,
      referred_name: name.trim(),
      referred_phone: phone.trim(),
      referred_email: email.trim() || null,
    }).select("id").single();

    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar a indicação.", variant: "destructive" });
    } else {
      setSubmitted(true);
      // Sync with RD Station CRM (fire and forget)
      try {
        const { data: affData } = await supabase
          .from("affiliates")
          .select("referral_code, profiles(full_name)")
          .eq("id", affiliateId)
          .single();
        const affiliateName = (affData as any)?.profiles?.full_name || "";
        const referralCode = affData?.referral_code || "";
        supabase.functions.invoke("sync-referral-rdstation", {
          body: {
            referral_id: insertedData?.id,
            referred_name: name.trim(),
            referred_phone: phone.trim(),
            referred_email: email.trim() || null,
            affiliate_name: affiliateName,
            referral_code: referralCode,
          },
        });
      } catch (e) {
        console.error("RD Station sync error:", e);
      }
    }
    setLoading(false);
  };

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Este link de indicação não é válido ou está inativo.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-2">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Indicação enviada!</CardTitle>
            <CardDescription>Obrigado! Entraremos em contato em breve.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Indicação — Dr. Erick</CardTitle>
          <CardDescription>Preencha seus dados para agendar uma consulta</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
          </CardContent>
          <div className="px-6 pb-6">
            <Button type="submit" className="w-full" disabled={loading || !affiliateId}>
              {loading ? "Enviando..." : "Enviar indicação"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
