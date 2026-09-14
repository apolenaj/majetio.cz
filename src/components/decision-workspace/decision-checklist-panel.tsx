"use client";

import * as React from "react";
import { Check, Plus, Trash2 } from "lucide-react";

import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  createMyDecisionTaskAction,
  deleteMyDecisionTaskAction,
  listMyDecisionTasksAction,
  seedSuggestedTasksAction,
  toggleMyDecisionTaskAction,
} from "@/domains/decision-workspace/server/actions";
import {
  TASK_STATUS_LABELS_CS,
  TASK_TYPE_LABELS_CS,
} from "@/domains/decision-workspace/tasks/checklist-defaults";
import type { PropertyDecisionTaskDto } from "@/domains/decision-workspace/tasks/task-service";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { cn } from "@/lib/utils";

export function DecisionChecklistPanel({
  propertyId,
  slug,
  isAuthenticated,
  returnPath,
  context,
}: {
  propertyId: string;
  slug: string;
  isAuthenticated: boolean;
  returnPath: string;
  context: {
    propertyType: string | null;
    condition: string | null;
    risk: string | null;
    tags: string[];
    hasRenovationEstimate: boolean;
  };
}) {
  const [tasks, setTasks] = React.useState<PropertyDecisionTaskDto[]>([]);
  const [title, setTitle] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    const result = await listMyDecisionTasksAction({
      propertyIdOrSlug: propertyId,
    });
    if (result.ok) setTasks(result.tasks);
  }, [propertyId]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    void reload();
  }, [isAuthenticated, reload]);

  async function onSeed() {
    setPending(true);
    setError(null);
    const result = await seedSuggestedTasksAction({
      propertyIdOrSlug: propertyId,
      context,
      slug,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error === "unauthorized" ? "Přihlášení je povinné." : result.error);
      return;
    }
    setInfo(
      result.created > 0
        ? `Přidáno ${result.created} návrhů checklistu.`
        : "Navrhované úkoly už máte, nebo není co doplnit.",
    );
    await reload();
  }

  async function onAdd() {
    setPending(true);
    setError(null);
    const result = await createMyDecisionTaskAction({
      propertyIdOrSlug: propertyId,
      title,
      slug,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle("");
    setTasks((prev) => [...prev, result.task]);
  }

  async function onToggle(task: PropertyDecisionTaskDto) {
    const done = task.status !== "DONE";
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: done ? "DONE" : "PENDING",
              completedAt: done ? new Date().toISOString() : null,
            }
          : t,
      ),
    );
    const result = await toggleMyDecisionTaskAction({
      taskId: task.id,
      done,
      slug,
    });
    if (!result.ok) {
      setError(result.error);
      await reload();
    }
  }

  async function onDelete(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const result = await deleteMyDecisionTaskAction({ taskId, slug });
    if (!result.ok) {
      setError(result.error);
      await reload();
    }
  }

  if (!isAuthenticated) {
    return (
      <Card padding="lg" className="space-y-3">
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Checklist rozhodnutí
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Úkoly (prohlídka, SVJ, technická kontrola…) jsou soukromé a jen pro
          váš účet.
        </p>
        <ButtonLink href={buildLoginUrl(returnPath)} variant="secondary" size="sm">
          Přihlásit se
        </ButtonLink>
      </Card>
    );
  }

  const open = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Checklist rozhodnutí
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Návrhy podle typu a rizik — můžete přidat vlastní a odškrtávat.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() => void onSeed()}
        >
          Navrhnout úkoly
        </Button>
      </div>

      {error ? (
        <InlineAlert tone="error" title="Akce se nezdařila">
          {error}
        </InlineAlert>
      ) : null}
      {info ? (
        <InlineAlert tone="info" title="Checklist">
          {info}
        </InlineAlert>
      ) : null}

      <ul className="space-y-2">
        {open.map((task) => (
          <li
            key={task.id}
            className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2"
          >
            <button
              type="button"
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-[var(--border-default)]"
              aria-label={`Označit hotovo: ${task.title}`}
              onClick={() => void onToggle(task)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {task.title}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {TASK_TYPE_LABELS_CS[task.type] ?? task.type}
                {task.suggested ? " · návrh" : ""}
                {" · "}
                {TASK_STATUS_LABELS_CS[task.status]}
              </p>
            </div>
            <button
              type="button"
              className="text-[var(--text-muted)] hover:text-[var(--status-error)]"
              aria-label="Smazat úkol"
              onClick={() => void onDelete(task.id)}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        {done.map((task) => (
          <li
            key={task.id}
            className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--background-secondary)] px-3 py-2 opacity-80"
          >
            <button
              type="button"
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded",
                "bg-[var(--status-success)] text-white",
              )}
              aria-label={`Vrátit jako nehotové: ${task.title}`}
              onClick={() => void onToggle(task)}
            >
              <Check className="size-3.5" />
            </button>
            <p className="min-w-0 flex-1 text-sm line-through text-[var(--text-muted)]">
              {task.title}
            </p>
            <button
              type="button"
              className="text-[var(--text-muted)]"
              aria-label="Smazat úkol"
              onClick={() => void onDelete(task.id)}
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Zatím žádné úkoly. Klikněte na „Navrhnout úkoly“ nebo přidejte vlastní.
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-2 border-t border-[var(--border-default)] pt-4">
        <Field id="custom-task" label="Vlastní úkol" className="min-w-[12rem] flex-1">
          <TextInput
            id="custom-task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Např. Zavolat makléři"
            maxLength={200}
          />
        </Field>
        <Button
          type="button"
          size="sm"
          disabled={title.trim().length < 2}
          loading={pending}
          leftIcon={<Plus className="size-3.5" aria-hidden />}
          onClick={() => void onAdd()}
        >
          Přidat
        </Button>
      </div>
    </Card>
  );
}
