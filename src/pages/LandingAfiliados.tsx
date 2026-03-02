import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gift, Users, TrendingUp, ChevronRight } from "lucide-react";

const benefits = [
  { icon: Gift, title: "Recompensas reais", desc: "Ganhe prêmios a cada indicação convertida." },
  { icon: Users, title: "Fácil de indicar", desc: "Compartilhe seu link exclusivo com amigos e familiares." },
  { icon: TrendingUp, title: "Acompanhe tudo", desc: "Painel completo para ver suas indicações e recompensas." },
];

const steps = [
  { step: "01", title: "Cadastre-se", desc: "Crie sua conta gratuitamente em poucos segundos." },
  { step: "02", title: "Indique", desc: "Compartilhe seu link personalizado com quem precisa." },
  { step: "03", title: "Ganhe", desc: "Receba recompensas por cada indicação que se tornar paciente." },
];

export default function LandingAfiliados() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(210_40%_20%)_0%,transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:py-32">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Indique e <span className="text-accent-foreground/80">Ganhe</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
            Participe do programa de indicações do Dr. Erick. Indique pacientes, acompanhe suas conversões e receba recompensas exclusivas.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="secondary" className="text-base font-semibold">
              <Link to="/signup">Quero ser afiliado <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Por que participar?</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-muted-foreground">Vantagens exclusivas para nossos afiliados</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {benefits.map(b => (
            <Card key={b.title} className="text-center">
              <CardContent className="pt-8 pb-6 flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Como funciona</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map(s => (
              <div key={s.step} className="text-center">
                <span className="inline-block text-4xl font-black text-primary/20">{s.step}</span>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="text-base font-semibold">
              <Link to="/signup">Começar agora <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer mínimo */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Dr. Erick — Programa de Indicações
      </footer>
    </div>
  );
}
