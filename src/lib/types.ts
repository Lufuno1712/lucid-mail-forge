export type Tone = "friendly" | "professional" | "concise" | "warm" | "persuasive" | "apologetic";
export type Length = "short" | "medium" | "long";
export type Priority = "low" | "medium" | "high";

export interface EmailDraft {
  id: string;
  label: string;
  subjectOptions: string[];
  preview: string;
  body: string;
  html: string;
  responseLikelihood: number;
  suggestions: string[];
}

export interface EmailResult {
  drafts: EmailDraft[];
  followUp: { delayDays: number; subject: string; body: string };
}

export interface PlannedTask {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
  slots: string[];
  dependsOn: string[];
  done: boolean;
  sourceLabel?: string;
}

export interface Citation {
  id: string;
  label: string;
  quote: string;
  locator: string;
  url: string | null;
  confidence: "verified" | "uncertain";
}

export interface ResearchNote {
  id: string;
  question: string;
  summary: string;
  takeaways: string[];
  pros: string[];
  cons: string[];
  citations: Citation[];
  nextSteps: string[];
  bibtex: string | null;
  createdAt: string;
}
