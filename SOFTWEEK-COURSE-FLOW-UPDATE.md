# SoftWeek Course Flow Update

This build pivots SoftWeek from a week-first planner toward a simpler curriculum-flow loop without adding routes, database tables, storage systems, or package dependencies.

## Core product changes

- **Courses replaces Lesson Stacks in the main experience.** Existing lesson stack data appears as Courses automatically.
- A Course stores an ordered lesson queue and a simple normal-day rhythm.
- On a normal course day, SoftWeek surfaces **one next unfinished lesson** into Today rather than dating the entire curriculum.
- Completing, restoring, skipping, or deleting a course-sourced planner item updates the existing lesson queue state.
- **Today** now shows course progress, the next lesson, and a quick **Log it as done** path for reverse planning.
- **Week** is intentionally secondary and positioned for one-offs, loose ends, routines, and recovery.
- Primary navigation is now **Today / Courses / Week / Records**.

## Retention / activation fixes

- Guest mode starts with a sample day instead of an empty planner.
- Real guest-created plans, children, courses, rhythms, categories, and records migrate into a parent account created or logged into on the same device.
- Sample guest items are explicitly filtered out of account migration and saved records.
- The existing PWA install prompt is mounted after meaningful planner activation on mobile.
- Course creation is tracked as onboarding completion.
- Planner opens are now tracked, and weekly returns are inferred from the existing profile `last_seen_at` value and written to the existing `app_events` table.

## Public positioning

Homepage, metadata, PWA description, footer, navigation, and beta feedback copy now center on:

> **Load the curriculum once. Keep the next lesson moving.**

The homepage uses an HTML product demonstration instead of relying on the older planner screenshot for the main pitch.

## Infrastructure impact

- New routes: **none**
- New database tables / migrations: **none**
- New storage system: **none**
- New dependencies: **none**
- Existing Supabase schema remains compatible.

## Verification in this package

- Planner logic tests: **12/12 passing**
- Added tests for the new Course rhythm / next-lesson behavior.
- All TypeScript/TSX source files pass syntax transpilation.
- A semantic TypeScript pass using local dependency stubs completed with no source-level errors.

A full `next build` could not be executed inside the packaging environment because external npm registry DNS is unavailable there, so dependencies could not be installed. The package lock and dependency list are unchanged from the supplied master.
