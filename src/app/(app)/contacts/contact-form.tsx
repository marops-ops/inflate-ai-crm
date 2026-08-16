"use client";

import { useActionState, useState } from "react";
import { createContact, updateContact } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Contact = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  companyId: string | null;
  notes: string | null;
};

export function ContactFormSheet({
  contact,
  companies,
  defaultCompanyId,
  defaultOpen,
  leadId,
  triggerLabel,
  triggerSize,
}: {
  contact?: Contact;
  companies: { id: string; name: string }[];
  defaultCompanyId?: string;
  defaultOpen?: boolean;
  leadId?: string;
  triggerLabel?: string;
  triggerSize?: "default" | "sm";
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const action = contact ? updateContact : createContact;
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(contact);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant={isEdit ? "outline" : "default"} size={triggerSize ?? "default"} />}
      >
        {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {isEdit ? "Edit" : (triggerLabel ?? "New contact")}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit contact" : "New contact"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update this contact's details." : "Add a person to Inflate AI CRM."}
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 px-4">
          {isEdit ? <input type="hidden" name="id" value={contact!.id} /> : null}
          {!isEdit && leadId ? <input type="hidden" name="leadId" value={leadId} /> : null}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                defaultValue={contact?.firstName}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" defaultValue={contact?.lastName ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input id="jobTitle" name="jobTitle" defaultValue={contact?.jobTitle ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="company">Company</Label>
            <Select
              name="companyId"
              defaultValue={contact?.companyId ?? defaultCompanyId ?? "none"}
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
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={4} defaultValue={contact?.notes ?? ""} />
          </div>
          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create contact"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
