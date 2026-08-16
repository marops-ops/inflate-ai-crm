"use client";

import { useTransition } from "react";
import { changeLeadStage } from "../actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STAGES, type Stage } from "@/lib/pipeline";
import { ChevronDown } from "lucide-react";

export function LeadStageControl({ leadId, stage }: { leadId: string; stage: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={pending} />
        }
      >
        Move to…
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STAGES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            disabled={s.value === stage}
            onClick={() => startTransition(() => changeLeadStage(leadId, s.value as Stage))}
          >
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
