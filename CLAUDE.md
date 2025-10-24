# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a unified productivity tool combining todolist, kanban board, and calendar functionality. The project follows a web-first approach with mobile mirroring core features.

**Architecture:**
- **Web**: Vue 3 + TypeScript + Vite, with Pinia for state management, Vue Router, Tailwind CSS, FullCalendar, and SortableJS for drag-and-drop
- **Mobile**: Flutter (Dart) using Riverpod/Bloc pattern, with Hive/Isar for local caching and Dio/Chopper for HTTP
- **Backend**: Spring Boot 2.7 (Java 8) with PostgreSQL, Redis, Flyway for migrations, Quartz for scheduling, and OpenAPI documentation

## Repository Structure

```
├── docs/                    # Requirements and development documentation
│   ├── requirements.md      # MVP requirements, data model, and API outline
│   └── development-plan.md  # Tech stack details and 8-10 week milestone plan
├── web/                     # Vue 3 web application (scaffold to be added)
├── mobile/                  # Flutter mobile application (scaffold to be added)
└── backend/                 # Spring Boot backend (to be added)
```

## Development Commands

**Note**: Currently this repository contains only documentation and scaffolding. Application code has not been implemented yet.

When the web application is scaffolded (Vue 3 + Vite):
```bash
# Web development
cd web/
npm install
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run linting
```

When the mobile application is scaffolded (Flutter):
```bash
# Mobile development
cd mobile/
flutter pub get       # Install dependencies
flutter run           # Run in development mode
flutter build apk     # Build Android APK
flutter build ios     # Build iOS app
flutter test          # Run tests
```

When the backend is scaffolded (Spring Boot):
```bash
# Backend development
cd backend/
./mvnw spring-boot:run        # Start development server
./mvnw clean install          # Build and install dependencies
./mvnw test                   # Run tests
./mvnw flyway:migrate         # Run database migrations
```

## Key Architecture Concepts

### Data Model Core
- **Task**: Central entity with boardId, title, description, priority, columnId, dueAt, plannedStart, plannedEnd, labels, progress
- **Subtask**: Belongs to Task with title, done status, dueAt, order
- **Board/Column**: Kanban organization with configurable columns and optional WIP limits
- **Resources**: URL attachments for tasks (file attachments planned for later)
- **Reminders**: In-app notifications with relative offsets (e.g., "1 day before", "2 hours before")

### Business Rules
- **Deadline Color Coding**:
  - >72 hours: green
  - 24-72 hours: yellow
  - <24 hours: red
  - Overdue: red + badge
- **Kanban WIP**: Warn or block when exceeding column limits
- **Calendar Integration**: Drag tasks to calendar to set plannedStart/End times
- **Default Sorting**: Nearer due date > priority > manual order

### API Design (REST)
- Authentication: JWT with refresh tokens
- Workspace-level RBAC for permissions
- Redis rate limiting
- OpenAPI documentation generation
- UTC timestamp storage with timezone conversion on display

### Technology Constraints
- **Java 8**: Must use Spring Boot 2.7, avoid Spring Boot 3.x APIs
- **Scheduler Reliability**: Quartz with JDBC job store and idempotent handlers
- **Performance**: API P95 < 150ms, UI interactions P95 < 100ms
- **Mobile Sync**: Polling synchronization < 30 seconds

## Development Priorities

Based on the 8-10 week development plan:

1. **Week 1**: Backend skeleton, authentication, database setup, basic web shell
2. **Weeks 2-3**: Task/Board/Column APIs with kanban drag-and-drop on web
3. **Weeks 4-5**: Calendar integration with drag-to-schedule functionality
4. **Weeks 6-7**: Quartz scheduling for reminders and notification center
5. **Week 8**: Mobile core features (login, task list, simplified kanban, calendar)
6. **Weeks 9-10**: Performance optimization, testing, and release preparation

## Code Generation Strategy

- Generate TypeScript and Dart SDKs from OpenAPI specifications to maintain contract consistency
- Use Flyway for database migrations
- Consider code generation for repetitive CRUD operations

## Testing Strategy

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests via Playwright for web workflows
- Mobile testing with Flutter's built-in testing framework

## 输出格式

全程使用中文进行回复和输出