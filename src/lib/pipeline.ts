export const STAGES = [
  { value: "new", label: "New Lead", color: "#3987e5" },
  { value: "contacted", label: "Contacted", color: "#d95926" },
  { value: "qualified", label: "Qualified", color: "#199e70" },
  { value: "proposal", label: "Proposal Sent", color: "#c98500" },
  { value: "won", label: "Won", color: "#d55181" },
] as const;

export function stageColor(stage: string) {
  return STAGES.find((s) => s.value === stage)?.color ?? "#898781";
}

export type Stage = (typeof STAGES)[number]["value"];

export function stageLabel(stage: string) {
  return STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  won: "Won",
  lost: "Lost",
};
