import { createFileRoute } from "@tanstack/react-router";
import { Mail, CalendarClock, BookOpen, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspaceProvider, useWorkspace } from "@/lib/workspace-store";
import { EmailComposer } from "@/components/EmailComposer";
import { TaskPlanner } from "@/components/TaskPlanner";
import { ResearchAssistant } from "@/components/ResearchAssistant";

const TITLE = "Relay — AI Email, Planner & Research Workspace";
const DESCRIPTION =
  "Draft high-quality emails, turn any text into a scheduled plan, and research with source-attributed answers — all in one AI workspace.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <WorkspaceProvider>
      <Workspace />
      <Toaster />
    </WorkspaceProvider>
  );
}

function Workspace() {
  const { tab, setTab, emails, tasks, notes } = useWorkspace();

  return (
    <main className="min-h-screen">
      <header className="hero-gradient border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Single-session workspace · nothing stored on a server
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
            Write, plan and <span className="accent-gradient-text">research</span> in one flow.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {DESCRIPTION}
          </p>
          <dl className="mt-8 flex flex-wrap gap-8 text-sm">
            <Stat label="Drafts" value={emails.length} />
            <Stat label="Tasks" value={tasks.length} />
            <Stat label="Research notes" value={notes.length} />
          </dl>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <Tabs value={tab} onValueChange={setTab} className="space-y-8">
          <TabsList className="h-auto w-full max-w-2xl flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="compose" className="gap-2 px-4 py-2">
              <Mail className="size-4" /> Email
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-2 px-4 py-2">
              <CalendarClock className="size-4" /> Planner
            </TabsTrigger>
            <TabsTrigger value="research" className="gap-2 px-4 py-2">
              <BookOpen className="size-4" /> Research
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose">
            <EmailComposer />
          </TabsContent>
          <TabsContent value="plan">
            <TaskPlanner />
          </TabsContent>
          <TabsContent value="research">
            <ResearchAssistant />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl">{value}</dd>
    </div>
  );
}
