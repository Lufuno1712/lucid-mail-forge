import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, ListPlus, Copy } from "lucide-react";
import { toast } from "sonner";
import { generateEmail } from "@/lib/workspace.functions";
import { useWorkspace } from "@/lib/workspace-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmailResult } from "@/lib/types";

const TEMPLATES = [
  "cold outreach",
  "follow-up",
  "internal update",
  "negotiation",
  "apology",
  "customer support",
  "meeting request",
];
const TONES = ["friendly", "professional", "concise", "warm", "persuasive", "apologetic"];

export function EmailComposer() {
  const run = useServerFn(generateEmail);
  const { addEmail, sendToPlanner, tasks, notes } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [form, setForm] = useState({
    recipientName: "",
    recipientRole: "",
    company: "",
    template: "cold outreach",
    tone: "friendly",
    length: "medium",
    language: "English",
    cta: "",
    context: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onGenerate() {
    setLoading(true);
    try {
      const res = await run({ data: form });
      setResult(res);
      addEmail({
        id: `${Date.now()}`,
        title: `${form.template} → ${form.recipientName || form.company || "recipient"}`,
        result: res,
        createdAt: new Date().toISOString(),
      });
      toast.success(`${res.drafts.length} drafts ready`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate drafts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="surface-panel space-y-4 p-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Recipient">
            <Input
              value={form.recipientName}
              onChange={(e) => set("recipientName", e.target.value)}
              placeholder="Dana Ito"
            />
          </Field>
          <Field label="Role">
            <Input
              value={form.recipientRole}
              onChange={(e) => set("recipientRole", e.target.value)}
              placeholder="Head of Ops"
            />
          </Field>
        </div>
        <Field label="Company">
          <Input
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            placeholder="Northwind"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Template">
            <Picker value={form.template} onChange={(v) => set("template", v)} options={TEMPLATES} />
          </Field>
          <Field label="Tone">
            <Picker value={form.tone} onChange={(v) => set("tone", v)} options={TONES} />
          </Field>
          <Field label="Length">
            <Picker
              value={form.length}
              onChange={(v) => set("length", v)}
              options={["short", "medium", "long"]}
            />
          </Field>
          <Field label="Language">
            <Input value={form.language} onChange={(e) => set("language", e.target.value)} />
          </Field>
        </div>
        <Field label="Goal / call to action">
          <Input
            value={form.cta}
            onChange={(e) => set("cta", e.target.value)}
            placeholder="Secure a 30-min intro call"
          />
        </Field>
        <Field label="Context">
          <Textarea
            rows={5}
            value={form.context}
            onChange={(e) => set("context", e.target.value)}
            placeholder="Previous messages, attachments summary, anything relevant…"
          />
        </Field>
        <Button className="w-full" onClick={onGenerate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Mail />}
          Generate drafts
        </Button>

        {(tasks.length > 0 || notes.length > 0) && (
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">Context in this session</p>
            <p>
              {tasks.length} linked task{tasks.length === 1 ? "" : "s"} · {notes.length} research
              note{notes.length === 1 ? "" : "s"} available to reference.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {!result && (
          <div className="surface-panel flex min-h-[320px] flex-col items-center justify-center gap-2 p-10 text-center">
            <Mail className="size-8 text-primary" />
            <h3 className="text-lg">Two or more variants, every time</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Fill in the brief and generate subject options, plain-text and HTML bodies, a response
              likelihood estimate and a scheduled follow-up.
            </p>
          </div>
        )}

        {result?.drafts.map((d) => (
          <article key={d.label} className="surface-panel space-y-3 p-6">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg">{d.label}</h3>
              <Badge variant="secondary">{d.responseLikelihood}% est. reply</Badge>
            </header>
            <div className="flex flex-wrap gap-2">
              {d.subjectOptions?.map((s) => (
                <Badge key={s} variant="outline" className="font-normal">
                  {s}
                </Badge>
              ))}
            </div>
            <p className="text-xs italic text-muted-foreground">{d.preview}</p>
            <pre className="whitespace-pre-wrap rounded-xl bg-muted/50 p-4 font-sans text-sm leading-relaxed">
              {d.body}
            </pre>
            {d.suggestions?.length > 0 && (
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {d.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(d.body);
                  toast.success("Draft copied");
                }}
              >
                <Copy /> Copy text
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(d.html);
                  toast.success("HTML copied");
                }}
              >
                <Copy /> Copy HTML
              </Button>
              <Button size="sm" onClick={() => sendToPlanner(d.body, `Email: ${d.label}`)}>
                <ListPlus /> Convert to tasks
              </Button>
            </div>
          </article>
        ))}

        {result?.followUp && (
          <article className="surface-panel space-y-2 p-6">
            <header className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg">Follow-up</h3>
              <Badge>in {result.followUp.delayDays} days</Badge>
            </header>
            <p className="text-sm font-medium">{result.followUp.subject}</p>
            <pre className="whitespace-pre-wrap rounded-xl bg-muted/50 p-4 font-sans text-sm leading-relaxed">
              {result.followUp.body}
            </pre>
            <Button
              size="sm"
              onClick={() =>
                sendToPlanner(
                  `Send follow-up in ${result.followUp.delayDays} days: ${result.followUp.subject}`,
                  "Follow-up",
                )
              }
            >
              <ListPlus /> Schedule follow-up
            </Button>
          </article>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="capitalize">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
