"use client";

import { useState, useTransition } from "react";
import { markLeadWon, markLeadLost, reopenLead } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircleCheck, CircleX, RotateCcw } from "lucide-react";

export function LeadStatusActions({
  leadId,
  status,
}: {
  leadId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [lostOpen, setLostOpen] = useState(false);

  if (status !== "active") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => reopenLead(leadId))}
      >
        <RotateCcw className="size-4" />
        Reopen
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
        onClick={() => startTransition(() => markLeadWon(leadId))}
      >
        <CircleCheck className="size-4" />
        Mark won
      </Button>
      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
            />
          }
        >
          <CircleX className="size-4" />
          Mark lost
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark this lead as lost</DialogTitle>
            <DialogDescription>
              Optionally record why, so it shows up in analytics later.
            </DialogDescription>
          </DialogHeader>
          <form
            action={async (formData: FormData) => {
              await markLeadLost(leadId, formData);
              setLostOpen(false);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea id="reason" name="reason" rows={3} />
            </div>
            <DialogFooter>
              <Button type="submit" variant="destructive">
                Mark as lost
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
