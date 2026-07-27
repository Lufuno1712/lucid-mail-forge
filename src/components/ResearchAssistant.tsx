import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Download, ListPlus, Loader2, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { runResearch } from "@/lib/workspace.functions";
import { useWorkspace } from "@/lib/workspace-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { ResearchNote } from "@/lib/types";

function toMarkdown(n: ResearchNote) {
  return [
    `# ${n.question}`,
    "",
    n.summary,
    "",
    "## Key takeaways",
    ...n.takeaways.map((t) => `- ${t}`),
    "",
    "## Pros",
    ...n.pros.map((t) => `- ${t}`),
    "",
    "## Cons",
    ...n.cons.map((t) => `- ${t}`),
    "",
    "## Citations",
    ...n.citations.map((c) => `- [${c.confidence}] ${c.label} (${c.locator}): "${c.quote}"`),
    "",
    "## Next steps",
    ...n.nextSteps.map((t) => `- ${t}`),
    n.bibtex ? `\n## BibTeX\n\n\`\`\`\n${n.bibtex}\n\`\`\`` : "",
  ].join("\n");
}

export function ResearchAssistant() {
  const run = useServerFn(runResearch);
  const { notes, addNote, sendToPlanner } = useWorkspace();
  const [question, setQuestion] = useState("");
  const [material, setMaterial] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onUpload(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) return toast.error("Please use a text file under 2 MB");
    const text = await file.text();
    setMaterial(text.slice(0, 30000));
    setSourceName(file.name);
    toast.success(`Loaded ${file.name}`);
  }

  async function onAsk() {
    if (!question.trim()) return toast.error("Ask a question first");
    setLoading(true);
    try {
      const note = await run({ data: { question, material, sourceName } });
      addNote(note);
      toast.success("Note added to your knowledge base");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Research failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="surface-panel space-y-4 p-6">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Question</Label>
          <Textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Summarise this paper in 200 words and list 5 key takeaways"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Source name
          </Label>
          <Input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Smith et al., 2024"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Material (paste text or upload .txt/.md)
          </Label>
          <Textarea
            rows={9}
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Paste the article, abstract or notes here…"
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.csv,.json"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
            <Upload /> Upload
          </Button>
          <Button className="flex-1" onClick={onAsk} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
            Research
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Everything stays in this browser session — nothing is stored on a server.
        </p>
      </div>

      <div className="space-y-5">
        {notes.length === 0 && (
          <div className="surface-panel flex min-h-[320px] flex-col items-center justify-center gap-2 p-10 text-center">
            <BookOpen className="size-8 text-primary" />
            <h3 className="text-lg">Source-attributed answers</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Every claim is tied to a quote and locator, or flagged as uncertain so you know what
              still needs verifying.
            </p>
          </div>
        )}
        {notes.map((n) => (
          <article key={n.id} className="surface-panel space-y-4 p-6">
            <header className="space-y-1">
              <h3 className="font-display text-lg">{n.question}</h3>
              <p className="text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </header>
            <p className="text-sm leading-relaxed">{n.summary}</p>

            {n.takeaways.length > 0 && (
              <Section title="Key takeaways" items={n.takeaways} />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {n.pros.length > 0 && <Section title="Pros" items={n.pros} />}
              {n.cons.length > 0 && <Section title="Cons" items={n.cons} />}
            </div>

            {n.citations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-wide text-muted-foreground">Citations</h4>
                {n.citations.map((c) => (
                  <div key={c.id} className="rounded-xl border border-border bg-muted/40 p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant={c.confidence === "verified" ? "default" : "destructive"}>
                        {c.confidence}
                      </Badge>
                      <span className="text-xs font-medium">{c.label}</span>
                      <span className="text-xs text-muted-foreground">{c.locator}</span>
                    </div>
                    <p className="text-sm italic">“{c.quote}”</p>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent underline"
                      >
                        {c.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {n.nextSteps.length > 0 && <Section title="Next steps" items={n.nextSteps} />}

            {n.bibtex && (
              <pre className="overflow-x-auto rounded-xl bg-muted/50 p-3 font-mono text-xs">
                {n.bibtex}
              </pre>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  sendToPlanner(
                    `${n.question}\n\n${n.summary}\n\nNext steps:\n${n.nextSteps.join("\n")}`,
                    "Research note",
                  )
                }
              >
                <ListPlus /> Turn into tasks
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const blob = new Blob([toMarkdown(n)], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `note-${n.id}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download /> Export Markdown
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="list-inside list-disc space-y-1 text-sm">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
