import test from "node:test";
import assert from "node:assert/strict";
import {
  applyRecoveryChanges,
  buildRecoveryChanges,
  dateKeyForDay,
  generateRhythmItems,
  nextLessonItems,
} from "../src/lib/plannerLogic.ts";
import { getWeekRangeFromStart, getWeekStartIso, shiftWeekStart } from "../src/lib/week.ts";
import type { PlannerItem, WeeklyRhythm } from "../src/types/planner.ts";

function plan(id: string, day: PlannerItem["day"], status: PlannerItem["status"] = "planned"): PlannerItem {
  return {
    id,
    title: id,
    day,
    placement: day ? "day" : "week",
    category: "other",
    status,
    timeBlock: "Anytime",
    assignedTo: "everyone",
    weekStart: "2026-07-20",
  };
}

test("week date calculations remain local-date safe", () => {
  assert.equal(dateKeyForDay("2026-07-20", "Monday"), "2026-07-20");
  assert.equal(dateKeyForDay("2026-07-20", "Sunday"), "2026-07-26");
});

test("Life Happened moves only unfinished selected-day work", () => {
  const plans = [plan("a", "Tuesday"), plan("b", "Tuesday", "done"), plan("c", "Wednesday")];
  const changes = buildRecoveryChanges({ plans, weekStart: "2026-07-20", selectedDay: "Tuesday", mode: "tomorrow" });
  assert.deepEqual(changes.map((change) => [change.id, change.toDay]), [["a", "Wednesday"]]);
  const result = applyRecoveryChanges(plans, changes);
  assert.equal(result.find((item) => item.id === "a")?.day, "Wednesday");
  assert.equal(result.find((item) => item.id === "b")?.status, "done");
});

test("spread recovery distributes work over remaining days", () => {
  const plans = [plan("a", "Monday"), plan("b", "Monday"), plan("c", "Monday")];
  const changes = buildRecoveryChanges({ plans, weekStart: "2026-07-20", selectedDay: "Monday", mode: "spread" });
  assert.deepEqual(changes.map((change) => change.toDay), ["Tuesday", "Wednesday", "Thursday"]);
});

test("carry-forward sends unfinished work to next week holding area", () => {
  const changes = buildRecoveryChanges({ plans: [plan("a", "Friday")], weekStart: "2026-07-20", mode: "next-week" });
  assert.equal(changes[0].toWeekStart, "2026-07-27");
  assert.equal(changes[0].placement, "week");
  assert.equal(changes[0].toDay, null);
});

test("rhythm generation is idempotent", () => {
  const rhythm: WeeklyRhythm = {
    id: "reading",
    name: "Reading",
    title: "Reading",
    weekdays: ["Monday", "Wednesday"],
    assignedTo: "everyone",
    category: "reading",
    timeBlock: "Morning",
    startWeek: "2026-07-20",
    active: true,
    createdAt: "2026-07-20T00:00:00Z",
  };
  let counter = 0;
  const first = generateRhythmItems([rhythm], "2026-07-20", [], () => `p${++counter}`);
  const second = generateRhythmItems([rhythm], "2026-07-20", first, () => `p${++counter}`);
  assert.equal(first.length, 2);
  assert.equal(second.length, 0);
});

test("lesson stack returns the next ordered queued items", () => {
  const items = [
    { position: 2, status: "queued", title: "Lesson 3" },
    { position: 0, status: "done", title: "Lesson 1" },
    { position: 1, status: "queued", title: "Lesson 2" },
  ];
  assert.deepEqual(nextLessonItems(items, 2).map((item) => item.title), ["Lesson 2", "Lesson 3"]);
});


test("week ranges cross month and year boundaries without UTC drift", () => {
  assert.deepEqual(getWeekRangeFromStart("2026-12-28"), {
    weekStart: "2026-12-28",
    weekEnd: "2027-01-03",
    weekLabel: "Dec 28 – Jan 3",
  });
  assert.equal(shiftWeekStart("2026-12-28", 1), "2027-01-04");
  assert.equal(getWeekStartIso(new Date(2026, 6, 26, 23, 45)), "2026-07-20");
});

test("rhythm item identifiers stay deterministic across repeated generation", () => {
  const rhythm: WeeklyRhythm = {
    id: "math-rhythm",
    name: "Math",
    title: "Math practice",
    weekdays: ["Tuesday", "Thursday"],
    assignedTo: "everyone",
    category: "math",
    timeBlock: "Morning",
    startWeek: "2026-07-20",
    active: true,
    createdAt: "2026-07-20T00:00:00Z",
  };
  const first = generateRhythmItems([rhythm], "2026-07-20", [], () => "unused");
  const repeated = generateRhythmItems([rhythm], "2026-07-20", [], () => "different-unused");
  assert.deepEqual(first.map((item) => item.id), [
    "rhythm:math-rhythm:2026-07-20:Tuesday",
    "rhythm:math-rhythm:2026-07-20:Thursday",
  ]);
  assert.deepEqual(repeated.map((item) => item.id), first.map((item) => item.id));
});

test("lesson stack ignores completed, planned, and skipped lessons", () => {
  const items = [
    { position: 0, status: "done", title: "Lesson 1" },
    { position: 1, status: "skipped", title: "Lesson 2" },
    { position: 2, status: "planned", title: "Lesson 3" },
    { position: 4, status: "queued", title: "Lesson 5" },
    { position: 3, status: "queued", title: "Lesson 4" },
  ];
  assert.deepEqual(nextLessonItems(items, 5).map((item) => item.title), ["Lesson 4", "Lesson 5"]);
});

test("recovery leaves completed and skipped work unchanged", () => {
  const plans = [plan("done", "Monday", "done"), plan("skipped", "Monday", "skipped"), plan("open", "Monday")];
  const changes = buildRecoveryChanges({ plans, weekStart: "2026-07-20", mode: "this-week" });
  assert.deepEqual(changes.map((change) => change.id), ["open"]);
  const result = applyRecoveryChanges(plans, changes);
  assert.equal(result.find((item) => item.id === "done")?.status, "done");
  assert.equal(result.find((item) => item.id === "skipped")?.status, "skipped");
  assert.equal(result.find((item) => item.id === "open")?.placement, "week");
});
