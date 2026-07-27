import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { callAiJson } from "./ai.server";
import type { EmailResult, PlannedTask, ResearchNote } from "./types";

const emailInput = z.object({
  recipientName: z.string().max(120).default(""),
  recipientRole: z.string().max(120).default(""),
  company: z.string().max(120).default(""),
  template: z.string().max(60),
  tone: z.string().max(40),
  length: z.string().max(20),
  language: z.string().max(40),
  cta: z.string().max(300).default(""),
  context: z.string().max(6000).default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailInput.parse(d))
  .handler(async ({ data }) => {
    const result = await callAiJson<EmailResult>(
      `You are an expert business email writer. Always produce at least TWO distinct draft variants.
Return JSON shaped exactly as:
{"drafts":[{"label":string,"subjectOptions":[string,string],"preview":string,"body":string,"html":string,"responseLikelihood":number,"suggestions":[string]}],
"followUp":{"delayDays":number,"subject":string,"body":string}}
responseLikelihood is an integer 0-100. body is plain text, html is simple semantic HTML of the same content. Keep the preview under 120 characters.`,
      `Write a ${data.template} email in ${data.language}.
Recipient: ${data.recipientName || "unknown"}, ${data.recipientRole || "unknown role"} at ${data.company || "unknown company"}.
Tone: ${data.tone}. Length: ${data.length}.
Call to action / goal: ${data.cta || "start a conversation"}.
Context: ${data.context || "none provided"}.
Give two clearly different variants (e.g. direct vs. story-led) and one follow-up email.`,
    );
    return result;
  });

const taskInput = z.object({
  text: z.string().min(1).max(12000),
  sourceLabel: z.string().max(120).default("Pasted text"),
  workdayStart: z.string().max(10).default("09:00"),
  workdayEnd: z.string().max(10).default("17:30"),
  busy: z.array(z.string().max(80)).max(50).default([]),
});

export const extractTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => taskInput.parse(d))
  .handler(async ({ data }) => {
    const today = new Date().toISOString().slice(0, 10);
    const result = await callAiJson<{ tasks: Omit<PlannedTask, "id" | "done">[] }>(
      `You turn messy text into an actionable plan.
Return JSON: {"tasks":[{"title":string,"description":string,"durationMinutes":number,"priority":"low"|"medium"|"high","dueDate":string|null,"tags":[string],"slots":[string],"dependsOn":[string]}]}
dueDate is ISO date (YYYY-MM-DD) or null. "slots" must contain at least THREE conflict-free proposed time slots as ISO datetime strings, avoiding the listed busy blocks and staying inside working hours. dependsOn references other task titles.`,
      `Today is ${today}. Working hours ${data.workdayStart}-${data.workdayEnd}.
Busy blocks: ${data.busy.length ? data.busy.join("; ") : "none"}.
Extract tasks from this text:\n\n${data.text}`,
    );
    return (result.tasks ?? []).map((t, i) => ({
      ...t,
      id: `${Date.now()}-${i}`,
      done: false,
      sourceLabel: data.sourceLabel,
      slots: t.slots ?? [],
      tags: t.tags ?? [],
      dependsOn: t.dependsOn ?? [],
    })) as PlannedTask[];
  });

const researchInput = z.object({
  question: z.string().min(1).max(2000),
  material: z.string().max(30000).default(""),
  sourceName: z.string().max(200).default(""),
});

export const runResearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => researchInput.parse(d))
  .handler(async ({ data }) => {
    const result = await callAiJson<Omit<ResearchNote, "id" | "createdAt" | "question">>(
      `You are a rigorous research assistant. Every claim must carry a source attribution drawn from the provided material, or be marked confidence:"uncertain".
Return JSON: {"summary":string,"takeaways":[string],"pros":[string],"cons":[string],"citations":[{"label":string,"quote":string,"locator":string,"url":string|null,"confidence":"verified"|"uncertain"}],"nextSteps":[string],"bibtex":string|null}
Quotes must be verbatim from the material when material is supplied. If no material is supplied, mark every citation as uncertain. Summary ~200 words.`,
      `Question: ${data.question}
Source name: ${data.sourceName || "none"}
Material:\n${data.material || "(no material supplied — answer from general knowledge and flag uncertainty)"}`,
    );
    const note: ResearchNote = {
      id: `${Date.now()}`,
      question: data.question,
      createdAt: new Date().toISOString(),
      summary: result.summary ?? "",
      takeaways: result.takeaways ?? [],
      pros: result.pros ?? [],
      cons: result.cons ?? [],
      nextSteps: result.nextSteps ?? [],
      bibtex: result.bibtex ?? null,
      citations: (result.citations ?? []).map((c, i) => ({ ...c, id: `${Date.now()}-${i}` })),
    };
    return note;
  });
