# Development Plan

## Tech Stack
- Backend: Spring Boot 2.7 (Java 8), PostgreSQL, Redis, Flyway, Quartz, OpenAPI (springdoc)
- Web: Vue 3 + TypeScript + Vite, Vue Router, Pinia, Tailwind CSS, FullCalendar, SortableJS (or vue-dnd variants)
- Mobile: Flutter (Riverpod/Bloc), HTTP via generated SDK (OpenAPI), local cache via Hive/Isar

## Repository Structure
- docs/
- web/
- mobile/

## Milestones (8–10 weeks)
1. Foundation (Week 1)
   - Backend skeleton, Auth, DB/Redis, Flyway, OpenAPI.
   - Web shell, design system baseline.
2. Tasks & Kanban (Weeks 2–3)
   - Task/Board/Column APIs; kanban drag & filter on Web.
3. Calendar & Planning (Weeks 4–5)
   - Calendar API; month/week/day views; drag write-back; countdown colors.
4. Reminders & Notifications (Weeks 6–7)
   - Quartz scheduling, reminder rules, in-app notification center.
5. Mobile Core Mirror (Week 8)
   - Flutter login, list, simplified kanban move, calendar (month/week), task detail.
6. Polish & Release (Weeks 9–10)
   - Performance, error monitoring, E2E tests, packaging & acceptance.

## Initial Task Breakdown
- Backend: schema + services for Auth/RBAC, Boards/Columns, Tasks/Subtasks/Labels/Resources, Calendar, Reminders; Quartz wiring; OpenAPI docs.
- Web: auth flow; task detail drawer; kanban board (drag); calendar (FullCalendar); reminder settings; notification center; search & filters.
- Mobile: login; task list & detail edit; column move; calendar month/week; local cache; polling sync.
- Testing/DevOps: Docker-based local env; CI (build/test); E2E via Playwright.

## Risks & Mitigations
- Java 8 constraints -> lock Spring Boot 2.7; avoid 3.x APIs.
- Scheduler reliability -> Quartz JDBC store + retries; idempotent handlers.
- Calendar performance -> virtualization, range queries, batch updates.
- Contract drift -> generate TS/Dart SDKs from OpenAPI.
