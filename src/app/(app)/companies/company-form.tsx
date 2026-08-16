"use client";

import { useActionState, useState } from "react";
import { createCompany, updateCompany } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export function CompanyFormSheet({ company }: { company?: Company }) {
  const [open, setOpen] = useState(false);
  const action = company ? updateCompany : createCompany;
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(company);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant={isEdit ? "outline" : "default"} />}>
        {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {isEdit ? "Edit" : "New company"}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit company" : "New company"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this company's details."
              : "Add a company profile to Inflate AI CRM."}
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 px-4">
          {isEdit ? <input type="hidden" name="id" value={company!.id} /> : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Company name</Label>
            <Input id="name" name="name" required defaultValue={company?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              placeholder="https://example.com"
              defaultValue={company?.website ?? ""}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" defaultValue={company?.industry ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={company?.phone ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={company?.address ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={4} defaultValue={company?.notes ?? ""} />
          </div>
          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create company"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
