"use client";

import * as React from "react";

import { CheckCircle2, ShieldAlert } from "lucide-react";

import { Checkbox } from "@/components/forms/controls";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/overlays/dialog";
import {
  confirmHypotekaJasneHandoff,
  confirmGuestMortgageHandoff,
  getMortgageLeadStatus,
  type HandoffPreviewData,
  type HandoffContext,
  type HandoffConfirmSuccess,
  type GuestHandoffContact,
} from "@/lib/financing/handoff-actions";
import { mortgageLeadFinancingPageHref } from "@/domains/leads/service/user-messaging";
import { MortgageLeadSubmitSuccess } from "@/components/financing/mortgage-lead-submit-success";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Wizard steps — explicit consent flow (Prompt 13/4):
//   explain → preview → consent → confirm
// ---------------------------------------------------------------------------

type WizardStep = "explain" | "preview" | "consent" | "confirm";

const STEP_LABELS: Record<WizardStep, string> = {
  explain: "Vysvětlení",
  preview: "Náhled dat",
  consent: "Souhlas",
  confirm: "Potvrzení",
};

const STEP_ORDER: WizardStep[] = ["explain", "preview", "consent", "confirm"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: HandoffPreviewData;
  source?: string;
  handoffContext?: HandoffContext;
  onSuccess?: (result: HandoffConfirmSuccess) => void;
  /** Guest funnel — contact collected before opening wizard (Prompt 13/10). */
  guestContact?: GuestHandoffContact;
};

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEP_ORDER.indexOf(current);
  return (
    <ol className="flex flex-wrap gap-2 text-xs" aria-label="Kroky souhlasu">
      {STEP_ORDER.map((step, idx) => (
        <li
          key={step}
          className={cn(
            "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-0.5",
            idx === currentIdx
              ? "bg-[var(--action-primary)] text-[var(--text-inverse)] font-medium"
              : idx < currentIdx
                ? "bg-[color-mix(in_srgb,var(--status-success)_12%,white)] text-[var(--status-success)]"
                : "bg-[var(--background-secondary)] text-[var(--text-muted)]",
          )}
          aria-current={idx === currentIdx ? "step" : undefined}
        >
          {idx < currentIdx && <CheckCircle2 className="size-3" aria-hidden />}
          {STEP_LABELS[step]}
        </li>
      ))}
    </ol>
  );
}

/**
 * Explicit consent gate before any HypotekaJasne data handoff.
 * 4-step flow: vysvětlení → preview dat → consent → potvrzení.
 * Opening this dialog must NOT send data — only confirmHypotekaJasneHandoff does.
 */
export function DataSharingPreview({
  open,
  onOpenChange,
  preview,
  source = "kalkulacky/financovani",
  handoffContext,
  onSuccess,
  guestContact,
}: Props) {
  const selectable = preview.fields.filter((f) => f.always || f.value);
  const defaultSelected = selectable
    .filter((f) => f.included || f.always)
    .map((f) => f.key);

  const [step, setStep] = React.useState<WizardStep>("explain");
  const [selected, setSelected] = React.useState<string[]>(defaultSelected);
  const [explicit, setExplicit] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [wasOpen, setWasOpen] = React.useState(open);
  const [duplicateLead, setDuplicateLead] = React.useState(
    preview.existingActiveLead,
  );
  const [statusDetail, setStatusDetail] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDuplicateLead(preview.existingActiveLead);
  }, [preview.existingActiveLead]);
  if (open && !wasOpen) {
    setWasOpen(true);
    setStep("explain");
    setSelected(defaultSelected);
    setExplicit(false);
    setError(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  React.useEffect(() => {
    if (open) {
      track({
        name: "partner_handoff_preview_opened",
        props: { partner: "hypotekajasne", step: "explain" },
      });
    }
  }, [open]);

  function toggleField(key: string, always: boolean) {
    if (always) return;
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function onViewDuplicateStatus() {
    if (!duplicateLead) return;
    setLoading(true);
    setError(null);
    const result = await getMortgageLeadStatus(duplicateLead.correlationId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatusDetail(
      `${result.data.statusLabel} · reference ${result.data.correlationId}`,
    );
  }

  async function onFinalConfirm() {
    if (!explicit) {
      setError("Potvrďte souhlas zaškrtnutím pole v předchozím kroku.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = guestContact
      ? await confirmGuestMortgageHandoff({
          explicitConsent: true,
          selectedFields: selected,
          source,
          handoffContext,
          guestContact,
        })
      : await confirmHypotekaJasneHandoff({
          explicitConsent: true,
          selectedFields: selected,
          source,
          handoffContext,
        });
    setLoading(false);
    if (!result.ok) {
      if (result.code === "DUPLICATE" && result.existingLead) {
        setDuplicateLead(result.existingLead);
      }
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSuccess?.(result);
  }

  const selectedFields = preview.fields.filter((f) => selected.includes(f.key));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Předání dat partnerovi"
        description="Data se neodešlou automaticky. Odeslání proběhne až po posledním kroku."
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-5 text-sm">
          <StepIndicator current={step} />

          {duplicateLead ? (
            <InlineAlert tone="warning" title="Aktivní požadavek na financování">
              Financování této nemovitosti už řešíte. Stav:{" "}
              <strong>{duplicateLead.statusLabel}</strong>.
              {statusDetail ? (
                <p className="mt-2 text-sm">{statusDetail}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={loading}
                  onClick={() => void onViewDuplicateStatus()}
                >
                  Obnovit stav
                </Button>
                <ButtonLink
                  href={mortgageLeadFinancingPageHref(duplicateLead.correlationId)}
                  variant="secondary"
                  size="sm"
                >
                  Zobrazit stav financování
                </ButtonLink>
              </div>
            </InlineAlert>
          ) : null}

          {/* ── Step 1: Explain ── */}
          {step === "explain" && (
            <div className="space-y-4">
              <InlineAlert tone="warning" title="Bez automatického odeslání">
                Kliknutím na tlačítko financování se data partnerovi neposílají.
                Tento průvodce vás provede před odesláním — můžete kdykoli zrušit.
              </InlineAlert>

              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Příjemce
                  </p>
                  <p className="mt-1 font-medium">
                    <a
                      href={preview.recipient.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 hover:underline"
                    >
                      {preview.recipient.name}
                    </a>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Účel
                  </p>
                  <p className="mt-1 text-[var(--text-secondary)]">
                    {preview.recipient.purpose}
                  </p>
                </div>
                {preview.contextSummary && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                      Kontext tohoto požadavku
                    </p>
                    <p className="mt-1 text-[var(--text-secondary)]">
                      {preview.contextSummary}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[var(--radius-md)] bg-[var(--background-secondary)] p-4">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="size-4 text-[var(--status-info)] shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      Minimalizace dat
                    </p>
                    <p className="mt-1 text-[var(--text-secondary)]">
                      Majetio nepředává kompletní Finanční pas ani historii
                      hledání. V dalším kroku si sami vyberete, která konkrétní
                      pole chcete sdílet.
                    </p>
                    <ul className="mt-2 space-y-0.5 text-xs text-[var(--text-muted)]">
                      {preview.excludedCategories.map((cat) => (
                        <li key={cat}>✕ {cat}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep("preview")}>
                  Pokračovat k náhledu dat
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === "preview" && (
            <div className="space-y-4">
              <p className="text-[var(--text-secondary)]">
                Vyberte pole, která chcete předat. E-mail je povinný. Ostatní
                pole jsou volitelná — předvyplněna nejsou.
              </p>

              <ul className="space-y-2">
                {selectable.map((field) => (
                  <li key={field.key}>
                    <label
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-3",
                        selected.includes(field.key)
                          ? "border-[var(--action-primary)] bg-[color-mix(in_srgb,var(--action-primary)_4%,white)]"
                          : "border-[var(--border-default)]",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={selected.includes(field.key)}
                        disabled={field.always}
                        onChange={() => toggleField(field.key, field.always)}
                      />
                      <span className="flex-1">
                        <span className="block font-medium">
                          {field.label}
                          {field.always && (
                            <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">
                              (povinné)
                            </span>
                          )}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {field.value ?? "— (není vyplněno)"}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              {selectable.length === 0 && (
                <InlineAlert tone="warning">
                  Nemáte vyplněná data k předání. Doplňte profil nebo kalkulačku.
                </InlineAlert>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("explain")}
                >
                  Zpět
                </Button>
                <Button
                  type="button"
                  disabled={!selected.includes("email")}
                  onClick={() => setStep("consent")}
                >
                  Pokračovat k souhlasu
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Consent ── */}
          {step === "consent" && (
            <div className="space-y-4">
              <dl className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--text-muted)]">Typ souhlasu</dt>
                  <dd className="text-right text-xs font-metric">
                    {preview.consentType}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--text-muted)]">Verze textu</dt>
                  <dd className="font-metric">{preview.consentTextVersion}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--text-muted)]">Verze souhlasu</dt>
                  <dd className="font-metric">{preview.consentVersion}</dd>
                </div>
              </dl>

              <Checkbox
                label="Souhlasím s jednorázovým předáním vybraných údajů HypotekaJasne.cz za účelem posouzení možností financování."
                description="Souhlas je konkrétní, verzovaný a dohledatelný v sekci Souhlasy. Marketingový souhlas se tímto neuděluje."
                checked={explicit}
                onChange={(e) => setExplicit(e.target.checked)}
              />

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("preview")}
                >
                  Zpět
                </Button>
                <Button
                  type="button"
                  disabled={!explicit}
                  onClick={() => setStep("confirm")}
                >
                  Pokračovat k potvrzení
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirm ── */}
          {step === "confirm" && (
            <div className="space-y-4">
              <InlineAlert tone="info" title="Poslední kontrola před odesláním">
                Po kliknutí na „Souhlasím a odeslat“ budou data předána
                partnerovi. Tento krok nelze vrátit — souhlas bude uložen v
                historii.
              </InlineAlert>

              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-4 space-y-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Příjemce</p>
                  <p className="font-medium">{preview.recipient.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Účel</p>
                  <p className="text-[var(--text-secondary)]">
                    {preview.recipient.purpose}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    Předávaná pole ({selectedFields.length})
                  </p>
                  <ul className="space-y-1">
                    {selectedFields.map((f) => (
                      <li
                        key={f.key}
                        className="flex justify-between gap-2 text-sm"
                      >
                        <span>{f.label}</span>
                        <span className="text-[var(--text-muted)] shrink-0">
                          {f.value ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between gap-3 text-xs text-[var(--text-muted)]">
                  <span>Verze souhlasu</span>
                  <span className="font-metric">{preview.consentTextVersion}</span>
                </div>
              </div>

              {error ? (
                <InlineAlert tone="error" title="Nelze pokračovat">
                  {error}
                </InlineAlert>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep("consent")}
                  disabled={loading}
                >
                  Zpět
                </Button>
                <Button
                  type="button"
                  loading={loading}
                  disabled={!explicit || Boolean(duplicateLead)}
                  onClick={() => void onFinalConfirm()}
                >
                  Souhlasím a odeslat
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HypotekaJasneHandoffCard({
  preview,
  source,
  handoffContext,
  onOpenTrack,
}: {
  preview: HandoffPreviewData;
  source?: string;
  handoffContext?: HandoffContext;
  onOpenTrack?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [done, setDone] = React.useState<HandoffConfirmSuccess | null>(null);

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Možnosti financování</CardTitle>
        <CardDescription>
          Majetio neposkytuje úvěr. Partner HypotekaJasne může po vašem výslovném souhlasu
          připravit orientační nabídku.
        </CardDescription>
      </CardHeader>

      {done ? (
        <MortgageLeadSubmitSuccess result={done} />
      ) : (
        <Button
          type="button"
          size="lg"
          onClick={() => {
            onOpenTrack?.();
            setOpen(true);
          }}
        >
          Chci zjistit možnosti financování
        </Button>
      )}

      <DataSharingPreview
        open={open}
        onOpenChange={setOpen}
        preview={preview}
        source={source}
        handoffContext={handoffContext}
        onSuccess={setDone}
      />
    </Card>
  );
}
