"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STAGES, type Stage } from "@/lib/pipeline";
import { formatCurrency, initials } from "@/lib/format";
import { LeadStageControl } from "../leads/[id]/lead-stage-control";
import { changeLeadStage, rejectLead } from "../leads/actions";
import { Building2, Ban } from "lucide-react";

const REJECTED = "rejected";

type PipelineLead = {
  id: string;
  title: string;
  stage: string;
  status: string;
  value: string;
  owner: string | null;
  companyName: string | null;
};

function groupByColumn(leads: PipelineLead[]) {
  const groups: Record<string, PipelineLead[]> = { [REJECTED]: [] };
  for (const stage of STAGES) groups[stage.value] = [];
  for (const lead of leads) {
    if (lead.status === "lost") groups[REJECTED].push(lead);
    else groups[lead.stage]?.push(lead);
  }
  return groups;
}

export function PipelineBoard({ leads }: { leads: PipelineLead[] }) {
  const [columns, setColumns] = useState(() => groupByColumn(leads));
  const [activeLead, setActiveLead] = useState<PipelineLead | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setColumns(groupByColumn(leads));
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const target = String(over.id);

    setColumns((prev) => {
      let moving: PipelineLead | undefined;
      const next: Record<string, PipelineLead[]> = {};
      for (const [col, items] of Object.entries(prev)) {
        next[col] = items.filter((l) => {
          if (l.id === leadId) {
            moving = l;
            return false;
          }
          return true;
        });
      }
      if (!moving) return prev;
      const updated =
        target === REJECTED
          ? { ...moving, status: "lost" }
          : { ...moving, stage: target, status: target === "won" ? "won" : "active" };
      next[target] = [updated, ...(next[target] ?? [])];
      return next;
    });

    const current = leads.find((l) => l.id === leadId);
    if (!current) return;
    const alreadyThere =
      target === REJECTED ? current.status === "lost" : current.stage === target;
    if (alreadyThere) return;

    startTransition(() => {
      if (target === REJECTED) {
        rejectLead(leadId);
      } else {
        changeLeadStage(leadId, target as Stage);
      }
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {STAGES.map((stage) => (
          <PipelineColumn
            key={stage.value}
            columnId={stage.value}
            label={stage.label}
            leads={columns[stage.value] ?? []}
          />
        ))}
        <PipelineColumn
          columnId={REJECTED}
          label="Rejected"
          leads={columns[REJECTED] ?? []}
          muted
        />
      </div>
      <DragOverlay>
        {activeLead ? <PipelineCardBody lead={activeLead} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function PipelineColumn({
  columnId,
  label,
  leads,
  muted,
}: {
  columnId: string;
  label: string;
  leads: PipelineLead[];
  muted?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const total = leads.reduce((sum, l) => sum + Number(l.value), 0);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between px-0.5">
        <h2 className={`flex items-center gap-1.5 text-sm font-semibold ${muted ? "text-muted-foreground" : ""}`}>
          {muted ? <Ban className="size-3.5" /> : null}
          {label}
        </h2>
        <Badge variant="outline" className="text-xs">
          {leads.length}
        </Badge>
      </div>
      <p className="-mt-2 px-0.5 text-xs text-muted-foreground">{formatCurrency(total)}</p>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-col gap-2.5 rounded-lg transition-colors ${
          isOver ? (muted ? "bg-red-500/10 ring-1 ring-red-500/30" : "bg-secondary/50 ring-1 ring-ring/40") : ""
        }`}
      >
        {leads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-xs text-muted-foreground">
              {muted ? "Drag a lead here to reject it" : "No leads"}
            </CardContent>
          </Card>
        ) : (
          leads.map((lead) => <PipelineCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

function PipelineCard({ lead }: { lead: PipelineLead }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`/leads/${lead.id}`)}
      className="cursor-pointer touch-none"
      style={{ visibility: isDragging ? "hidden" : "visible" }}
    >
      <PipelineCardBody lead={lead} />
    </div>
  );
}

function PipelineCardBody({
  lead,
  dragging,
}: {
  lead: PipelineLead;
  dragging?: boolean;
}) {
  const rejected = lead.status === "lost";

  return (
    <Card
      className={`gap-3 py-3 transition-shadow hover:shadow-md ${
        dragging ? "shadow-lg ring-1 ring-ring/50" : ""
      } ${rejected ? "opacity-70" : ""}`}
    >
      <CardHeader className="px-3">
        <p className="text-sm font-medium">{lead.title}</p>
        {lead.companyName ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3" />
            {lead.companyName}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex items-center justify-between px-3">
        <span className="text-sm font-medium">{formatCurrency(lead.value)}</span>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {lead.owner ? (
            <Avatar className="size-6">
              <AvatarFallback className="text-[10px]">{initials(lead.owner)}</AvatarFallback>
            </Avatar>
          ) : null}
          {!rejected ? <LeadStageControl leadId={lead.id} stage={lead.stage} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
