import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { EmailResult, PlannedTask, ResearchNote } from "./types";

export interface EmailRecord {
  id: string;
  title: string;
  result: EmailResult;
  createdAt: string;
}

interface WorkspaceState {
  emails: EmailRecord[];
  tasks: PlannedTask[];
  notes: ResearchNote[];
  handoff: { text: string; label: string } | null;
  addEmail: (e: EmailRecord) => void;
  addTasks: (t: PlannedTask[]) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addNote: (n: ResearchNote) => void;
  sendToPlanner: (text: string, label: string) => void;
  clearHandoff: () => void;
  tab: string;
  setTab: (t: string) => void;
}

const Ctx = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [tasks, setTasks] = useState<PlannedTask[]>([]);
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [handoff, setHandoff] = useState<{ text: string; label: string } | null>(null);
  const [tab, setTab] = useState("compose");

  const value = useMemo<WorkspaceState>(
    () => ({
      emails,
      tasks,
      notes,
      handoff,
      tab,
      setTab,
      addEmail: (e) => setEmails((prev) => [e, ...prev]),
      addTasks: (t) => setTasks((prev) => [...t, ...prev]),
      toggleTask: (id) =>
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
      removeTask: (id) => setTasks((prev) => prev.filter((t) => t.id !== id)),
      addNote: (n) => setNotes((prev) => [n, ...prev]),
      sendToPlanner: (text, label) => {
        setHandoff({ text, label });
        setTab("plan");
      },
      clearHandoff: () => setHandoff(null),
    }),
    [emails, tasks, notes, handoff, tab],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
