import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CalendarDays } from "lucide-react";
import { format, differenceInDays, differenceInHours, addMonths, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PeriodTimerProps {
  periodStart: string | null;
  confirmedInPeriod: number;
  goal: number;
}

export default function PeriodTimer({ periodStart, confirmedInPeriod, goal }: PeriodTimerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!periodStart) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" /> Período de metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Seu período de 6 meses será iniciado automaticamente ao enviar sua primeira indicação.
          </p>
        </CardContent>
      </Card>
    );
  }

  const start = new Date(periodStart);
  const end = addMonths(start, 6);
  const expired = isPast(end);

  if (expired) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-destructive" /> Período encerrado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            O período de {format(start, "dd/MM/yyyy")} a {format(end, "dd/MM/yyyy")} expirou.
          </p>
          <p className="text-sm text-muted-foreground">
            Você alcançou <strong>{confirmedInPeriod}</strong> de <strong>{goal}</strong> conversões.
            Um novo período será iniciado na sua próxima indicação.
          </p>
        </CardContent>
      </Card>
    );
  }

  const daysLeft = differenceInDays(end, now);
  const hoursLeft = differenceInHours(end, now) % 24;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Período de metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {format(start, "dd MMM yyyy", { locale: ptBR })} — {format(end, "dd MMM yyyy", { locale: ptBR })}
          </div>
        </div>

        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            {daysLeft} dias e {hoursLeft} horas
          </p>
          <p className="text-sm text-muted-foreground">restantes neste período</p>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          <strong>{confirmedInPeriod}</strong> de <strong>{goal}</strong> conversões no período atual
        </p>
      </CardContent>
    </Card>
  );
}
