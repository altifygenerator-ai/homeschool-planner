import type {
  CategoryDefinition,
  PlannerItem,
  WeekDay,
} from "@/types/planner";

export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const dayLabels: Record<WeekDay, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export const defaultCategoryDefinitions: CategoryDefinition[] = [
  { id: "reading", label: "Reading" },
  { id: "math", label: "Math" },
  { id: "nature", label: "Nature" },
  { id: "life-skills", label: "Life skills" },
  { id: "chores-routines", label: "Chores / routines" },
  { id: "outing", label: "Outing" },
  { id: "science", label: "Science" },
  { id: "history", label: "History" },
  { id: "language-arts", label: "Language arts" },
  { id: "creative", label: "Creative" },
  { id: "other", label: "Other" },
];

export const categories = defaultCategoryDefinitions.map((category) => category.id);

export const categoryLabels = defaultCategoryDefinitions.reduce(
  (labels, category) => {
    labels[category.id] = category.label;
    return labels;
  },
  {} as Record<string, string>
);

export function getCategoryLabel(
  categoryId: string,
  categoryDefinitions: CategoryDefinition[] = defaultCategoryDefinitions
) {
  return (
    categoryDefinitions.find((category) => category.id === categoryId)?.label ??
    categoryLabels[categoryId] ??
    categoryId
  );
}

export const statuses = ["planned", "done", "moved", "skipped"] as const;

export const timeBlocks = ["Morning", "Midday", "Afternoon", "Anytime"] as const;

export const demoPlans: PlannerItem[] = [
  {
    id: "plan-1",
    title: "Read chapter 4 together",
    day: "Monday",
    category: "reading",
    status: "planned",
    timeBlock: "Morning",
    assignedTo: "child-emma",
    notes: "Read together and let her narrate it back.",
  },
  {
    id: "plan-2",
    title: "Nature walk + leaf sketching",
    day: "Sunday",
    category: "nature",
    status: "done",
    timeBlock: "Afternoon",
    assignedTo: "everyone",
    notes: "Collect leaves and sketch one or two.",
    actualNotes: "Talked about oak leaves and weather.",
  },
  {
    id: "plan-3",
    title: "Kitchen fractions",
    day: "Tuesday",
    category: "life-skills",
    status: "done",
    timeBlock: "Midday",
    assignedTo: "child-jack",
    notes: "Use baking or lunch prep for halves and quarters.",
  },
  {
    id: "plan-4",
    title: "Math review page",
    day: "Wednesday",
    category: "math",
    status: "moved",
    timeBlock: "Morning",
    assignedTo: "child-emma",
    notes: "Move this if the morning gets too full.",
  },
];
