<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version Change: N/A → 1.0.0 (Initial creation)

Modified Principles: None (initial creation)

Added Sections:
- Core Principles (5 principles)
  - I. Offline-First Architecture
  - II. Performance & Responsiveness
  - III. User Experience Excellence
  - IV. Type Safety & Code Quality
  - V. Simplicity & Maintainability
- Technology Standards
- Development Workflow
- Governance

Removed Sections: None (initial creation)

Templates Requiring Updates:
- .specify/templates/plan-template.md ✅ (Constitution Check section compatible)
- .specify/templates/spec-template.md ✅ (Requirements section compatible)
- .specify/templates/tasks-template.md ✅ (Phase structure compatible)

Follow-up TODOs: None
================================================================================
-->

# Bread Note Constitution

## Core Principles

### I. Offline-First Architecture

Bread Note MUST operate fully offline with seamless online sync. This principle ensures
users never lose work due to connectivity issues.

**Non-negotiable rules:**
- All data MUST be written to IndexedDB first, then synced to Turso
- Application MUST remain fully functional without network connectivity
- Sync conflicts MUST be resolved using last-write-wins with user notification
- Failed sync operations MUST be queued and retried automatically
- Users MUST be informed of sync status at all times

**Rationale:** Note-taking happens anywhere, often without reliable internet. Users
trust us with their thoughts and ideas; losing data destroys that trust.

### II. Performance & Responsiveness

Every interaction MUST feel instant. Performance is a feature, not an afterthought.

**Non-negotiable rules:**
- Initial page load (LCP) MUST be under 2.5 seconds
- User interactions MUST respond within 100ms (FID < 100ms)
- Note editor MUST handle documents up to 50,000 characters without lag
- Search results MUST appear within 200ms for local queries
- API responses MUST complete within 200ms at p95
- Bundle size MUST stay under 200KB (gzipped)

**Rationale:** Slow apps frustrate users and break creative flow. A note app that
makes you wait is a note app you stop using.

### III. User Experience Excellence

Every feature MUST be intuitive and accessible. Design for the user, not the developer.

**Non-negotiable rules:**
- All interactive elements MUST be keyboard accessible
- UI MUST be responsive across mobile, tablet, and desktop
- Error messages MUST be human-readable and actionable
- Loading states MUST be visible for operations exceeding 300ms
- Critical actions (delete, logout) MUST require confirmation
- Dark theme MUST maintain WCAG AA contrast ratios

**Rationale:** Great UX reduces cognitive load and lets users focus on what matters:
their notes and ideas.

### IV. Type Safety & Code Quality

TypeScript and static analysis MUST catch errors before users do.

**Non-negotiable rules:**
- All code MUST be written in TypeScript with strict mode enabled
- No `any` types except with explicit justification comment
- All API responses MUST be validated with Zod schemas
- ESLint errors MUST be resolved before merge
- Database queries MUST use Drizzle ORM (no raw SQL strings)
- All user inputs MUST be sanitized to prevent XSS/injection

**Rationale:** Runtime errors in production hurt users and erode trust. Static
typing catches entire categories of bugs at compile time.

### V. Simplicity & Maintainability

Prefer simple solutions over clever ones. Code is read more than it is written.

**Non-negotiable rules:**
- New abstractions MUST solve at least 3 concrete use cases (Rule of Three)
- Dependencies MUST be justified; prefer built-in solutions when adequate
- Functions MUST do one thing well
- Nesting depth MUST not exceed 3 levels without extraction
- Dead code MUST be removed, not commented out
- Comments explain "why", not "what" (code should be self-documenting)

**Rationale:** Complexity compounds. Every shortcut today becomes technical debt
tomorrow. Simple code is debuggable, testable, and changeable.

## Technology Standards

This section defines the technology decisions that support our principles.

**Core Stack:**
- Framework: Next.js 15 (App Router) - Server components for performance
- Language: TypeScript 5 (strict mode) - Type safety
- Server Database: Turso (LibSQL) - Edge-ready SQLite
- Local Database: IndexedDB via Dexie.js - Offline-first storage
- ORM: Drizzle - Type-safe database access
- UI: Shadcn/UI + Tailwind CSS - Consistent, accessible components
- Editor: Tiptap - Extensible rich text editing
- State: Zustand + TanStack Query - Predictable state management

**Quality Gates:**
- All PRs MUST pass TypeScript compilation
- All PRs MUST pass ESLint without errors
- All PRs MUST maintain or improve Lighthouse performance scores
- Database schema changes MUST include migration files

## Development Workflow

This section defines how code moves from idea to production.

**Branch Strategy:**
- `main` branch is always deployable
- Feature branches use format: `feature/descriptive-name`
- Bug fixes use format: `fix/descriptive-name`
- All changes require PR review before merge

**Commit Standards:**
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Commits should be atomic and focused
- Commit messages explain the "why" when not obvious

**Code Review Checklist:**
- Does it follow the 5 core principles?
- Are there any `any` types without justification?
- Is the change tested appropriately?
- Does it introduce unnecessary complexity?
- Are error states handled gracefully?

## Governance

This constitution supersedes all other development practices. When in doubt, refer
to these principles.

**Amendment Process:**
1. Propose change with rationale in a PR
2. Changes to Core Principles require explicit team discussion
3. Document the change in constitution version history
4. Update all dependent templates and documentation

**Versioning Policy:**
- MAJOR: Principle removed or fundamentally redefined
- MINOR: New principle added or existing principle expanded
- PATCH: Clarifications, wording improvements, typo fixes

**Compliance Review:**
- All PRs MUST be checked against Core Principles
- Violations MUST be justified in the Complexity Tracking section of plan.md
- Quarterly reviews to ensure principles remain relevant

**Version**: 1.0.0 | **Ratified**: 2025-01-13 | **Last Amended**: 2025-01-13
