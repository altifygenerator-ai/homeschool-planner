import type {
  ChildProfile,
  ChildWeeklySummary,
  PlannerItem,
} from "@/types/planner";

function planCounts(plans: PlannerItem[]) {
  return {
    completedCount: plans.filter((plan) => plan.status === "done").length,
    movedCount: plans.filter((plan) => plan.status === "moved").length,
    skippedCount: plans.filter((plan) => plan.status === "skipped").length,
    plannedCount: plans.filter((plan) => plan.status === "planned").length,
  };
}

function makeHighlight(plan: PlannerItem) {
  if (plan.actualNotes) {
    return `${plan.title}: ${plan.actualNotes}`;
  }

  if (plan.status === "done") {
    return `${plan.title} was completed.`;
  }

  if (plan.status === "moved") {
    return `${plan.title} was moved, but still stayed on the weekly record.`;
  }

  if (plan.status === "skipped") {
    return `${plan.title} was skipped this week.`;
  }

  return `${plan.title} was planned for the week.`;
}

function makeSummary(childName: string, plans: PlannerItem[]) {
  const counts = planCounts(plans);

  if (plans.length === 0) {
    return `${childName} does not have any saved plans in this week yet.`;
  }

  if (counts.completedCount > 0 && counts.movedCount === 0 && counts.skippedCount === 0) {
    return `${childName} had a steady week with ${counts.completedCount} completed learning activities recorded.`;
  }

  if (counts.movedCount > 0 || counts.skippedCount > 0) {
    return `${childName}'s week had some changes, but the record still shows what was planned, what moved, and what actually happened.`;
  }

  return `${childName}'s week has been saved with a simple record of planned learning activities.`;
}

export function generateChildWeeklySummaries(
  children: ChildProfile[],
  plans: PlannerItem[]
): ChildWeeklySummary[] {
  const realChildren = children.filter((child) => child.id !== "everyone");

  return realChildren.map((child) => {
    const childPlans = plans.filter(
      (plan) => plan.assignedTo === child.id || plan.assignedTo === "everyone"
    );

    const counts = planCounts(childPlans);

    return {
      childId: child.id,
      childName: child.name,
      ...counts,
      highlights: childPlans.slice(0, 4).map(makeHighlight),
      summary: makeSummary(child.name, childPlans),
    };
  });
}