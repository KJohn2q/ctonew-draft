# Requirements (MVP)

## Goals
- Single task source that unifies todo, kanban flow, and calendar scheduling.
- Show what to do each day and time-to-deadline with color cues.
- Web first; mobile mirrors core features; desktop later.

## In/Out of Scope (MVP)
- In: Tasks/subtasks CRUD, priority, labels, deadlines; URL resources; kanban columns + drag; calendar (month/week/day) + drag to date/time; in-app reminders; search/filter; email login; workspaces/boards.
- Out: External calendar sync, team collaboration/commenting/realtime multi-user.

## Users
- Individual and small teams; workspace owner, members.

## Key Features
- Task & Subtask: title, description, priority, labels, dueAt, progress.
- Resources: URL (attachments later).
- Kanban: configurable columns, drag-and-drop, optional WIP limit.
- Calendar: month/week/day, drag to set plannedStart/End, deadline countdown colors.
- Reminders: in-app notifications (relative offsets like 1 day/2 hours before).
- Search/Filter: keyword, column/status, label, due range.

## Non-functional
- Performance: API P95 < 150ms; UI interactions P95 < 100ms.
- Availability: basic offline tolerance for mobile; PWA later.
- Security: JWT + refresh, workspace-level RBAC, Redis rate limiting.
- I18n/Timezones: store UTC; render in user timezone.

## Data Model (summary)
- User, Workspace, Board, Column, Task(id, boardId, title, description, priority, columnId, dueAt, plannedStart, plannedEnd, labels[], progress, createdAt, updatedAt), Subtask(id, taskId, title, done, dueAt, order), Label, Resource(id, taskId, type=url, value, meta), Reminder, Notification.

## Business Rules
- Deadline colors: >72h green; 24–72h yellow; <24h red; overdue red + badge.
- Kanban WIP: warn/block when exceeding column limit (MVP: warn or block).
- Calendar drag: write back plannedStart/End; support all-day.
- Sorting default: nearer due > priority > manual order.

## API (REST outline)
- Auth: POST /auth/signup, /auth/login, /auth/refresh
- Workspaces/Boards: GET/POST /workspaces, GET/POST /boards, PATCH /boards/:id
- Columns: POST /boards/:id/columns, PATCH/DELETE /columns/:id
- Tasks: GET /boards/:id/tasks?status&label&dueRange&assignee; POST /boards/:id/tasks; GET/PATCH/DELETE /tasks/:id; POST /tasks/:id/subtasks; PATCH /subtasks/:id; POST /tasks/:id/resources; DELETE /resources/:id
- Calendar: GET /calendar?workspaceId&from&to; PATCH /tasks/:id/planTime
- Reminders/Notifications: POST /reminders; GET /notifications

## Acceptance Criteria (MVP)
- Create tasks and subtasks; move across kanban; drag to calendar; countdown colors correct.
- In-app reminders fire on schedule.
- Web and mobile (same account) changes visible within reasonable time (Web near-instant; mobile polling < 30s).
