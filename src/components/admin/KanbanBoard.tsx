import { useState } from "react";
import { format } from "date-fns";
import { MessageCircle, Pencil, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

const STATUS_COLUMNS = [
  { key: "pending", label: "Pendente", color: "bg-muted", border: "border-muted-foreground/20", dot: "bg-gray-400" },
  { key: "contacted", label: "Contatado", color: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400" },
  { key: "scheduled", label: "Agendado", color: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-400" },
  { key: "attended", label: "Atendido", color: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400" },
  { key: "converted", label: "Convertido", color: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  { key: "rejected", label: "Rejeitado", color: "bg-red-50", border: "border-red-200", dot: "bg-red-400" },
] as const;

const FINAL_STATUSES = new Set(["converted", "rejected"]);

interface KanbanBoardProps {
  referrals: Referral[];
  updateStatus: (id: string, newStatus: string) => void;
  openEdit: (r: Referral) => void;
  formatWhatsAppUrl: (phone: string) => string;
}

export default function KanbanBoard({ referrals, updateStatus, openEdit, formatWhatsAppUrl }: KanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const grouped = STATUS_COLUMNS.reduce<Record<string, Referral[]>>((acc, col) => {
    acc[col.key] = referrals.filter(r => r.status === col.key);
    return acc;
  }, {});

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("referralId", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  };

  const onDragLeave = () => setDragOverColumn(null);

  const onDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const id = e.dataTransfer.getData("referralId");
    if (id) {
      const referral = referrals.find(r => r.id === id);
      if (referral && referral.status !== columnKey) {
        updateStatus(id, columnKey);
      }
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
      {STATUS_COLUMNS.map(col => {
        const items = grouped[col.key] || [];
        const isOver = dragOverColumn === col.key;
        return (
          <div
            key={col.key}
            className={`flex-shrink-0 w-[260px] rounded-lg border-2 transition-colors ${col.color} ${isOver ? "border-primary ring-2 ring-primary/20" : col.border}`}
            onDragOver={e => onDragOver(e, col.key)}
            onDragLeave={onDragLeave}
            onDrop={e => onDrop(e, col.key)}
          >
            <div className="p-3 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
              <span className="font-medium text-sm">{col.label}</span>
              <Badge variant="secondary" className="ml-auto text-xs">{items.length}</Badge>
            </div>
            <div className="px-2 pb-2 space-y-2 max-h-[60vh] overflow-y-auto">
              {items.map(r => {
                const isDraggable = !FINAL_STATUSES.has(r.status);
                return (
                  <div
                    key={r.id}
                    draggable={isDraggable}
                    onDragStart={e => isDraggable && onDragStart(e, r.id)}
                    className={`rounded-md border bg-background p-3 shadow-sm transition-shadow ${isDraggable ? "cursor-grab hover:shadow-md active:cursor-grabbing" : "opacity-90"}`}
                  >
                    <div className="flex items-start gap-1.5">
                      {isDraggable && <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.referred_name}</p>
                        <p className="text-xs text-muted-foreground">{r.referred_phone}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.affiliates?.profiles?.full_name ?? r.affiliates?.referral_code ?? "—"}
                        </p>
                        {r.deal_value != null && (
                          <p className="text-xs font-medium text-green-700 mt-1">
                            R$ {r.deal_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(r.created_at), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 border-t pt-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(formatWhatsAppUrl(r.referred_phone), "_blank")} title="WhatsApp">
                        <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">Nenhum lead</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
