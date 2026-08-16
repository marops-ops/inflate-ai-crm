"use client";

import { useActionState, useState } from "react";
import { createLead, updateLead } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { STAGES } from "@/lib/pipeline";

type Lead = {
  id: string;
  title: string;
  contactId: string | null;
  companyId: string | null;
  stage: string;
  value: string;
  source: string | null;
  owner: string | null;
};

export function LeadFormSheet({
  lead,
  companies,
  contacts,
  defaultCompanyId,
  defaultContactId,
  defaultOpen,
}: {
  lead?: Lead;
  companies: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
  defaultCompanyId?: string;
  defaultContactId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const action = lead ? updateLead : createLead;
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(lead);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant={isEdit ? "outline" : "default"} />}>
        {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {isEdit ? "Edit" : "New lead"}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit lead" : "New lead"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update this lead's details." : "Add a new lead to the pipeline."}
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 px-4">
          {isEdit ? <input type="hidden" name="id" value={lead!.id} /> : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Lead title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g. Website redesign for Acme"
              defaultValue={lead?.title}
            />
          </div>
          {!isEdit ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="stage">Starting stage</Label>
              <Select name="stage" defaultValue={lead?.stage ?? "new"}>
                <SelectTrigger id="stage" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="company">Company</Label>
            <Select
              name="companyId"
              defaultValue={lead?.companyId ?? defaultCompanyId ?? "none"}
            >
              <SelectTrigger id="company" className="w-full">
                <SelectValue placeholder="No company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact">Contact</Label>
            <Select
              name="contactId"
              defaultValue={lead?.contactId ?? defaultContactId ?? "none"}
            >
              <SelectTrigger id="contact" className="w-full">
                <SelectValue placeholder="No contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contact</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="value">Deal value (USD)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              min="0"
              step="1"
              defaultValue={lead?.value ?? "0"}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              name="source"
              placeholder="e.g. Referral, Website, Outbound"
              defaultValue={lead?.source ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="owner">Owner</Label>
            <Input id="owner" name="owner" defaultValue={lead?.owner ?? ""} />
          </div>
          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
