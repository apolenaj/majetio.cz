"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { adminTransitionDqIssueAction } from "@/domains/data-engine/server/admin-actions";
import type { DqListItem } from "@/domains/data-quality/admin/issues";
import type { DqWorkflowStatus } from "@/domains/data-quality/admin/taxonomy";

export function DataQualityIssuePanel({
  items,
  canResolve,
}: {
  items: DqListItem[];
  canResolve: boolean;
}) {
  const [reasonById, setReasonById] = React.useState<Record<string, string>>(
    {},
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);

  async function transition(issueId: string, nextStatus: DqWorkflowStatus) {
    setBusyId(issueId);
    setError(null);
    setOk(null);
    const result = await adminTransitionDqIssueAction({
      issueId,
      nextStatus,
      reason: reasonById[issueId] ?? "",
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk(`Issue ${issueId} → ${nextStatus}`);
  }

  return (
    <div className="space-y-4">
      {error ? (
        <InlineAlert tone="warning" title="DQ">
          {error}
        </InlineAlert>
      ) : null}
      {ok ? (
        <InlineAlert tone="info" title="Hotovo">
          {ok}
        </InlineAlert>
      ) : null}

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="space-y-2 rounded-lg border border-[var(--border-default)] p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {item.category} · {item.severity} · {item.workflowStatus}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {item.ruleCode} v{item.ruleVersion}
              </p>
            </div>
            <p className="text-sm text-[var(--text-primary)]">
              {item.explanation}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {item.message}
              {item.field ? ` · field ${item.field}` : ""}
              {item.propertyId ? (
                <>
                  {" "}
                  ·{" "}
                  <Link
                    href={`/admin/nemovitosti/${item.propertyId}`}
                    className="text-[var(--text-link)] hover:underline"
                  >
                    property
                  </Link>
                </>
              ) : null}
            </p>
            {canResolve ? (
              <div className="space-y-2">
                <Field id={`dq-r-${item.id}`} label="Reason (RESOLVED / FALSE_POSITIVE)">
                  <TextInput
                    id={`dq-r-${item.id}`}
                    value={reasonById[item.id] ?? ""}
                    onChange={(e) =>
                      setReasonById((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busyId === item.id}
                    onClick={() => void transition(item.id, "IN_REVIEW")}
                  >
                    IN_REVIEW
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => void transition(item.id, "RESOLVED")}
                  >
                    RESOLVED
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busyId === item.id}
                    onClick={() => void transition(item.id, "FALSE_POSITIVE")}
                  >
                    FALSE_POSITIVE
                  </Button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
