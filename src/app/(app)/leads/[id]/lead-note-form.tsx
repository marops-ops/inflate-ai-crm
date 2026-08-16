"use client";

import { useActionState, useRef } from "react";
import { addLeadNote } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LeadNoteForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await addLeadNote(_prev, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="leadId" value={leadId} />
      <Textarea name="body" placeholder="Add a note…" rows={2} required />
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}
