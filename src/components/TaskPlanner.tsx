import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Loader2, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { extractTasks } from "@/lib/workspace.functions";
import { useWorkspace } from "@/lib/workspace-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

function fmt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

export function TaskPlanner() {
  const run = useServerFn(extractTasks);
  const { tasks, addTasks, toggleTask, removeTask, handoff, clearHandoff } = useWorkspace();
  const [text, setText] = useState("");
  const [label, setLabel] = useState("Pasted text");
  const [busy, setBusy] = useState("Mon 10:00-11:00 standup; Wed 14:00-15:30 review");
  const [hours, setHours] = useState({ start: "09:00", end: "17:30" });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    if (handoff) {
      setText(handoff.text);
      setLabel(handoff.label);
      clearHandoff();
      toast.info(`Loaded from ${handoff.label}`);
    }
  }, [handoff, clearHandoff]);

  async function onExtract() {
    if (!text.trim()) return toast.error("Add some text first");
    setLoading(true);
    try {
      const res = await run({
        data: {
          text,
          sourceLabel: label,
          workdayStart: hours.start,
          workdayEnd: hours.end,
          busy: busy
            .split(";")
            .map((b) => b.trim())
            .filter(Boolean),
        },
      });
      addTasks(res);
      toast.success(`${res.length} tasks extracted`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not extract tasks");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="surface-panel space-y-4 p-6">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Source label
          </Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Email, notes or transcript
          </Label>
          <Textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste anything — the planner pulls out tasks, durations, priorities and time slots."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Day from
            </Label>
            <Input
              value={hours.start}
              onChange={(e) => setHours({ ...hours, start: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Day until
            </Label>
            <Input
              value={hours.end}
              onChange={(e) => setHours({ ...hours, end: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Busy blocks (semicolon separated)
          </Label>
          <Textarea rows={3} value={busy} onChange={(e) => setBusy(e.target.value)} />
        </div>
        <Button className="w-full" onClick={onExtract} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
          Extract & schedule
        </Button>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 && (
          <div className="surface-panel flex min-h-[320px] flex-col items-center justify-center gap-2 p-10 text-center">
            <CalendarClock className="size-8 text-accent" />
            <h3 className="text-lg">No tasks yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Each extracted task comes with a priority, an estimated duration and at least three
              conflict-free slots to pick from.
            </p>
          </div>
        )}
        {tasks.map((t) => (
          <article key={t.id} className="surface-panel space-y-3 p-5">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={t.done}
                onCheckedChange={() => toggleTask(t.id)}
                className="mt-1"
                aria-label={`Mark ${t.title} done`}
              />
              <div className="flex-1 space-y-1">
                <h3
                  className={`font-display text-base ${t.done ? "text-muted-foreground line-through" : ""}`}
                >
                  {t.title}
                </h3>
                <p className="text-sm text-muted-foreground">{t.description}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeTask(t.id)}>
                <Trash2 />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge
                variant={t.priority === "high" ? "default" : "secondary"}
                className="capitalize"
              >
                {t.priority} priority
              </Badge>
              <Badge variant="outline">{t.durationMinutes} min</Badge>
              {t.dueDate && <Badge variant="outline">due {t.dueDate}</Badge>}
              {t.sourceLabel && <Badge variant="outline">from {t.sourceLabel}</Badge>}
              {t.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
            {t.dependsOn?.length > 0 && (
              <p className="text-xs text-muted-foreground">Depends on: {t.dependsOn.join(", ")}</p>
            )}
            {t.slots?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {t.slots.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={selected[t.id] === s ? "default" : "secondary"}
                    onClick={() => {
                      setSelected((p) => ({ ...p, [t.id]: s }));
                      toast.success(`Blocked ${fmt(s)}`);
                    }}
                  >
                    {fmt(s)}
                  </Button>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
