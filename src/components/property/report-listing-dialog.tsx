"use client";

import * as React from "react";
import { Flag } from "lucide-react";

import {
  LISTING_REPORT_ISSUE_LABELS_CS,
  LISTING_REPORT_ISSUE_TYPES,
  type ListingReportIssueTypeCode,
} from "@/domains/listings/reports/constants";
import { reportIncorrectListing } from "@/domains/listings/reports/actions";
import { Dialog, DialogContent, DialogTrigger } from "@/components/overlays/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";

export function ReportListingDialog({
  propertyId,
  propertyTitle,
  triggerClassName,
  triggerVariant = "outline",
  triggerSize = "sm",
}: {
  propertyId: string;
  propertyTitle?: string;
  triggerClassName?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
}) {
  const [open, setOpen] = React.useState(false);
  const [issueType, setIssueType] =
    React.useState<ListingReportIssueTypeCode>("INCORRECT_DATA");
  const [details, setDetails] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await reportIncorrectListing({
        propertyId,
        issueType,
        details: details.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch {
      setError("Hlášení se nepodařilo odeslat.");
    } finally {
      setPending(false);
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setDone(false);
      setDetails("");
      setIssueType("INCORRECT_DATA");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size={triggerSize}
          variant={triggerVariant}
          className={triggerClassName}
          leftIcon={<Flag aria-hidden />}
        >
          Nahlásit chybu
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Nahlásit chybný inzerát / data"
        description={
          propertyTitle
            ? `Pomozte nám opravit údaje u „${propertyTitle}“.`
            : "Pomozte nám opravit údaje u této nemovitosti."
        }
      >
        {done ? (
          <div className="space-y-4" role="status">
            <p className="text-sm text-[var(--text-secondary)]">
              Děkujeme. Hlášení jsme uložili jako úkol pro kontrolu kvality dat.
              Tým ho posoudí — bez tiché změny historických analýz.
            </p>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Zavřít
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <Field id="listing-report-type" label="Typ problému">
              <select
                id="listing-report-type"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm"
                value={issueType}
                onChange={(e) =>
                  setIssueType(e.target.value as ListingReportIssueTypeCode)
                }
              >
                {LISTING_REPORT_ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LISTING_REPORT_ISSUE_LABELS_CS[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="listing-report-details"
              label="Detail"
              optional
              helperText="Max. 2000 znaků. Neposílejte osobní údaje třetích stran."
            >
              <textarea
                id="listing-report-details"
                rows={4}
                maxLength={2000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-sm"
                placeholder="Co přesně nesedí?"
              />
            </Field>
            {error ? (
              <p className="text-sm text-[var(--status-error)]" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" loading={pending}>
                Odeslat hlášení
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
