export type WeekDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type PlanStatus = "planned" | "done" | "moved" | "skipped";

export type PlanCategory = string;

export type CategoryDefinition = {
  id: PlanCategory;
  label: string;
  isCustom?: boolean;
};

export type TimeBlock = "Morning" | "Midday" | "Afternoon" | "Anytime";

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
  weekStart?: string;
  notes?: string;
  actualNotes?: string;
  resourceTitle?: string;
  resourceUrl?: string;
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

export type WeekTemplate = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  plans: PlannerItem[];
};
