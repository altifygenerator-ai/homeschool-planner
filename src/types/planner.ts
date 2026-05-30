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

export type ChildProfile = {
  id: string;
  name: string;
  colorLabel?: "sage" | "gold" | "clay" | "blue";
};

export type PlannerItem = {
  id: string;
  title: string;
  day: WeekDay;
  category: PlanCategory;
  status: PlanStatus;
  timeBlock: TimeBlock;
  assignedTo: string;
  notes?: string;
  actualNotes?: string;
};

export type ChildWeeklySummary = {
  childId: string;
  childName: string;
  completedCount: number;
  movedCount: number;
  skippedCount: number;
  plannedCount: number;
  highlights: string[];
  summary: string;
};

export type SavedWeekLog = {
  id: string;
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  savedAt: string;
  children: ChildProfile[];
  childSummaries: ChildWeeklySummary[];
  plans: PlannerItem[];
};