# Relay — AI Email, Planner & Research Workspace

Relay is a single-session AI workspace that combines three linked modules: a smart
email generator, a task planner/scheduler, and a research assistant with source
attribution. Everything runs in the browser session — nothing is stored on a server.

## Modules

### ✉️ Email Composer
- Templates from cold outreach to apology notes
- Tone, length and language controls
- Two or more distinct draft variants, each with subject options
- Plain-text and HTML copy, improvement suggestions, reply-likelihood score
- Auto-generated follow-up email with a suggested delay

### 🗓 Task Planner
- Turns any email, note or transcript into structured tasks
- Priority, estimated duration, due date, tags and dependencies
- At least three conflict-free time slots per task, respecting working hours and busy blocks
- Check off, remove and book slots inline

### 🔎 Research Assistant
- Answers a question from pasted material or general knowledge
- Summary, takeaways, pros/cons and next steps
- Citations flagged `verified` or `uncertain`, plus optional BibTeX
- Markdown export

### 🔗 Cross-module handoff
Any draft, follow-up or research note can be sent straight to the planner with
**Convert to tasks**, carrying its source label along.

## Tech stack

- **TanStack Start** (React 19, file-based routing, server functions)
- **Vite** + **TypeScript**
- **Tailwind CSS v4** with an OKLCH "warm ink" theme
- **shadcn/ui** components
- **Lovable AI Gateway** (`google/gemini-3.6-flash`) for all generation

## Project structure

```
src/
  routes/
    __root.tsx        app shell, fonts, global meta
    index.tsx         tabbed workspace (compose / plan / research)
    sitemap[.]xml.ts  generated sitemap
  components/
    EmailComposer.tsx
    TaskPlanner.tsx
    ResearchAssistant.tsx
    ui/               shadcn primitives
  lib/
    ai.server.ts          AI gateway client (server-only)
    workspace.functions.ts server functions: generateEmail, extractTasks, runResearch
    workspace-store.tsx    session state + cross-module handoff
    types.ts               shared domain types
```

## Local development

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

The app starts on `http://localhost:8080`.

### Environment

`LOVABLE_API_KEY` is injected automatically inside Lovable and is read server-side
only, in `src/lib/ai.server.ts`. No key is ever exposed to the browser.

## Privacy

Drafts, tasks and research notes live in React state for the duration of the
session. Refreshing the page clears them. Text is sent to the AI gateway only when
you trigger a generation.

## Roadmap

- Gmail / Google Calendar OAuth for real sending and scheduling
- Vector store for persistent research libraries
- Accounts, saved workspaces and automation rules
- Drag-and-drop calendar rescheduling

## Built with Lovable

Open the project in the [Lovable editor](https://lovable.dev) to keep building.
Changes made in Lovable commit straight to the connected GitHub repository, and
pushes to GitHub sync back into Lovable.
