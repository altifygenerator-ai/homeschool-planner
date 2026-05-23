export type WeekDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export type PlanStatus = "planned" | "done" | "moved" | "skipped";

export type PlanCategory =
  | "reading"
  | "math"
  | "nature"
  | "life-skills"
  | "creative"
  | "outing"
  | "other";

export type TimeBlock =
  | "Morning"
  | "Midday"
  | "Afternoon"
  | "Anytime";

export type PlannerItem = {
  id: string;
  title: string;
  day: WeekDay;
  category: PlanCategory;
  status: PlanStatus;
  timeBlock: TimeBlock;
  notes?: string;
  actualNotes?: string;
};