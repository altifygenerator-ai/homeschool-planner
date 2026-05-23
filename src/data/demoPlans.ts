import type { PlannerItem, WeekDay } from "@/types/planner";

export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export const dayLabels: Record<WeekDay, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
};

export const categories = [
  "reading",
  "math",
  "nature",
  "life-skills",
  "creative",
  "outing",
  "other",
] as const;

export const categoryLabels = {
  reading: "Reading",
  math: "Math",
  nature: "Nature",
  "life-skills": "Life skills",
  creative: "Creative",
  outing: "Outing",
  other: "Other",
} as const;

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
    notes: "Read together and let them narrate it back.",
  },
  {
    id: "plan-2",
    title: "Nature walk + leaf sketching",
    day: "Monday",
    category: "nature",
    status: "done",
    timeBlock: "Afternoon",
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
    notes: "Use baking or lunch prep for halves and quarters.",
  },
  {
    id: "plan-4",
    title: "Math review page",
    day: "Wednesday",
    category: "math",
    status: "moved",
    timeBlock: "Morning",
    notes: "Move this if the morning gets too full.",
  },
];