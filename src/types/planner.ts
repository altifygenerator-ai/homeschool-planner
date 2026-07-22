export type WeekDay =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type PlanStatus = "planned" | "done" | "moved" | "skipped";
export type PlanPlacement = "week" | "day";
export type PlanCategory = string;
export type SyncState = "saved" | "saving" | "queued" | "offline" | "error";

export type CategoryDefinition = {
  id: PlanCategory;
  label: string;
  isCustom?: boolean;
};

export type TimeBlock = "Morning" | "Midday" | "Afternoon" | "Anytime";

export type ChildPermissionLevel = "checklist" | "flexible" | "independent";

export type ChildProfile = {
  id: string;
  name: string;
  colorLabel?: "sage" | "gold" | "clay" | "blue";
  permissionLevel?: ChildPermissionLevel;
};

export type PlannerItem = {
  id: string;
  title: string;
  day: WeekDay | null;
  placement: PlanPlacement;
  category: PlanCategory;
  status: PlanStatus;
  timeBlock: TimeBlock;
  assignedTo: string;
  weekStart?: string;
  notes?: string;
  actualNotes?: string;
  resourceTitle?: string;
  resourceUrl?: string;
  completedAt?: string | null;
  actualDate?: string | null;
  timeSpentMinutes?: number | null;
  orderIndex?: number;
  sourceRhythmId?: string | null;
  sourceLessonStackItemId?: string | null;
  syncState?: SyncState;
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
  closedAt?: string;
  familyNote?: string;
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

export type WeeklyRhythm = {
  id: string;
  name: string;
  title: string;
  weekdays: WeekDay[];
  assignedTo: string;
  category: PlanCategory;
  timeBlock: TimeBlock;
  notes?: string;
  resourceTitle?: string;
  resourceUrl?: string;
  startWeek: string;
  endWeek?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type LessonStackItem = {
  id: string;
  title: string;
  position: number;
  status: "queued" | "planned" | "done" | "skipped";
  plannerItemId?: string | null;
  completedAt?: string | null;
};

export type LessonStack = {
  id: string;
  name: string;
  assignedTo: string;
  category: PlanCategory;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  items: LessonStackItem[];
};

export type NotificationPreferences = {
  timezone: string;
  emailEnabled: boolean;
  weeklySetupEnabled: boolean;
  weeklySetupDay: number;
  morningTodayEnabled: boolean;
  closeoutEnabled: boolean;
  inactivityEnabled: boolean;
};
