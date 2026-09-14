"use client";

/**
 * MortgageReadinessCard — readiness checklist + CTA.
 *
 * Rules (Prompt 13/3):
 *   - CTA click opens DataSharingPreview dialog — NEVER creates a lead directly
 *   - Status labels: "Připraveno k odbornému posouzení" / "Základní údaje připraveny" / "Chybí údaje"
 *   - NEVER use "schváleno", "pre-approved", "mortgage approved"
 *   - Login required for handoff — show login CTA when not authenticated
 */

import * as React from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  MinusCircle,
} from "lucide-react";

import type {
  MortgageReadiness,
  ChecklistItem,
  OrientationalMortgageReadiness,
} from "@/domains/financing";
import {
  loadHypotekaHandoffPreview,
  loadGuestMortgageHandoffPreview,
  type HandoffConfirmSuccess,
  type HandoffPreviewData,
  type HandoffContext,
  type GuestHandoffContact,
} from "@/lib/financing/handoff-actions";
import { TextInput } from "@/components/forms/field";
import { Field } from "@/components/forms/field";
import type { MortgageLeadDuplicateInfo } from "@/domains/leads/schemas/mortgage-lead";
import { mortgageLeadFinancingPageHref } from "@/domains/leads/service/user-messaging";
import { MortgageLeadSubmitSuccess } from "@/components/financing/mortgage-lead-submit-success";
import { ButtonLink } from "@/components/ui/button-link";
import { DataSharingPreview } from "@/components/privacy/data-sharing-preview";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/feedback/states";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Readiness level config
// ---------------------------------------------------------------------------

const LEVEL_CONFIG = {
  data_incomplete: {
    tone: "neutral" as const,
    icon: AlertTriangle,
    iconClass: "text-[var(--status-warning)]",
    cardVariant: "warning" as const,
  },
  basic_data_ready: {
    tone: "info" as const,
    icon: Clock,
    iconClass: "text-[var(--status-info)]",
    cardVariant: "static" as const,
  },
  ready_for_review: {
    tone: "success" as const,
    icon: CheckCircle2,
    iconClass: "text-[var(--status-success)]",
    cardVariant: "static" as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Checklist item row
// ---------------------------------------------------------------------------

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const isDone = item.status === "done";
  const isOptionalMissing = item.status === "optional_missing";
  const isMissing = item.status === "missing";

  return (
    <li className="flex items-start gap-3 py-2">
      {/* Icon */}
      <span className="mt-0.5 shrink-0">
        {isDone ? (
          <CheckCircle2 className="size-4 text-[var(--status-success)]" aria-hidden />
        ) : isMissing ? (
          <Circle className="size-4 text-[var(--status-warning)]" aria-hidden />
        ) : (
          <MinusCircle className="size-4 text-[var(--text-muted)]" aria-hidden />
        )}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              isDone
                ? "text-[var(--text-primary)]"
                : isMissing
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]",
            )}
          >
            {item.label}
            {isOptionalMissing && (
              <span className="ml-1.5 text-xs font-normal text-[var(--text-muted)]">
                (doporučeno)
              </span>
            )}
          </span>
          {item.previewLabel && (
            <span className="text-xs text-[var(--text-muted)] shrink-0">
              {item.previewLabel}
            </span>
          )}
        </div>
        {!isDone && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
            {item.hint}
          </p>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Readiness status badge
// ---------------------------------------------------------------------------

function ReadinessBadge({
  level,
  label,
}: {
  level: MortgageReadiness["level"];
  label: string;
}) {
  const config = LEVEL_CONFIG[level];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1 text-sm font-medium",
        level === "ready_for_review"
          ? "border-[color-mix(in_srgb,var(--status-success)_30%,white)] bg-[color-mix(in_srgb,var(--status-success)_8%,white)] text-[var(--status-success)]"
          : level === "basic_data_ready"
            ? "border-[color-mix(in_srgb,var(--status-info)_30%,white)] bg-[color-mix(in_srgb,var(--status-info)_8%,white)] text-[var(--status-info)]"
            : "border-[color-mix(in_srgb,var(--status-warning)_30%,white)] bg-[color-mix(in_srgb,var(--status-warning)_8%,white)] text-[var(--status-warning)]",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Guest handoff CTA — contact + consent without account (Prompt 13/10)
// ---------------------------------------------------------------------------

function GuestHandoffCta({
  readiness,
  callbackUrl,
  source,
  handoffContext,
}: {
  readiness: MortgageReadiness;
  callbackUrl?: string;
  source?: string;
  handoffContext?: HandoffContext;
}) {
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] =
    React.useState<HandoffPreviewData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<HandoffConfirmSuccess | null>(null);

  const guestContact: GuestHandoffContact = {
    email: email.trim(),
    phone: phone.trim() || null,
  };

  async function handleGuestCta() {
    if (!email.trim()) {
      setError("Pro odeslání zadejte e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await loadGuestMortgageHandoffPreview({
      guestContact,
      rawContext: handoffContext,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPreviewData(result.data);
    setPreviewOpen(true);
  }

  if (done) {
    return (
      <div className="space-y-3">
        <MortgageLeadSubmitSuccess result={done} />
        <InlineAlert tone="info">
          Po vytvoření účtu se stejným e-mailem požadavek automaticky připojíme k
          vašemu profilu — až po ověření identity heslem, ne podle odkazu v e-mailu.
        </InlineAlert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <InlineAlert tone="info">
        Kalkulačku můžete používat bez účtu. Pro odeslání specialistovi zadejte kontakt
        a potvrďte souhlas — nebo se{" "}
        <a
          href={buildLoginUrl(callbackUrl)}
          className="font-medium text-[var(--action-primary)] underline-offset-2 hover:underline"
        >
          přihlaste
        </a>
        .
      </InlineAlert>

      <Field id="guest-email" label="E-mail" helperText="Povinný pro kontakt specialistou">
        <TextInput
          id="guest-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vas@email.cz"
        />
      </Field>
      <Field id="guest-phone" label="Telefon" helperText="Doporučeno">
        <TextInput
          id="guest-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+420 …"
        />
      </Field>

      {error ? (
        <InlineAlert tone="error" title="Nelze pokračovat">
          {error}
        </InlineAlert>
      ) : null}

      <Button
        type="button"
        variant="primary"
        className="w-full"
        loading={loading}
        onClick={() => void handleGuestCta()}
      >
        <ExternalLink className="size-4" aria-hidden />
        {readiness.ctaLabel}
      </Button>

      {previewData ? (
        <DataSharingPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          preview={previewData}
          source={source ?? "kalkulacky/financovani"}
          handoffContext={handoffContext}
          guestContact={guestContact}
          onSuccess={setDone}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Handoff CTA section
// ---------------------------------------------------------------------------

function HandoffCta({
  readiness,
  isAuthenticated,
  callbackUrl,
  source,
  handoffContext,
  activeFinancingLead,
}: {
  readiness: MortgageReadiness;
  isAuthenticated: boolean;
  callbackUrl?: string;
  source?: string;
  handoffContext?: HandoffContext;
  activeFinancingLead?: MortgageLeadDuplicateInfo | null;
}) {
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewData, setPreviewData] =
    React.useState<HandoffPreviewData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<HandoffConfirmSuccess | null>(null);

  if (activeFinancingLead && !done) {
    return (
      <div className="space-y-3">
        <InlineAlert tone="info" title="Financování už probíhá">
          Stav: <strong>{activeFinancingLead.statusLabel}</strong>. Nový požadavek
          pro tuto nemovitost není potřeba.
        </InlineAlert>
        <ButtonLink
          href={mortgageLeadFinancingPageHref(activeFinancingLead.correlationId)}
          variant="primary"
          className="w-full"
        >
          Zobrazit stav financování
        </ButtonLink>
      </div>
    );
  }

  async function handleCtaClick() {
    if (!isAuthenticated) return;
    if (!readiness.allRequiredDone) return;

    setLoading(true);
    setError(null);
    const result = await loadHypotekaHandoffPreview(handoffContext);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPreviewData(result.data);
    setPreviewOpen(true);
  }

  // Not authenticated — guest contact path or login
  if (!isAuthenticated) {
    return (
      <GuestHandoffCta
        readiness={readiness}
        callbackUrl={callbackUrl}
        source={source}
        handoffContext={handoffContext}
      />
    );
  }

  // Data incomplete — don't show primary CTA, show gap message
  if (!readiness.allRequiredDone) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled
        >
          {readiness.ctaLabel}
        </Button>
        <p className="text-xs text-center text-[var(--text-muted)]">
          Doplňte označené položky nahoře pro aktivaci.
        </p>
      </div>
    );
  }

  // Done state
  if (done) {
    return <MortgageLeadSubmitSuccess result={done} />;
  }

  return (
    <div className="space-y-3">
      {error && (
        <InlineAlert tone="error" title="Nelze pokračovat">
          {error}
        </InlineAlert>
      )}

      <Button
        type="button"
        variant="primary"
        className="w-full"
        loading={loading}
        onClick={() => void handleCtaClick()}
      >
        <ExternalLink className="size-4" aria-hidden />
        {readiness.ctaLabel}
      </Button>

      <p className="text-xs text-center text-[var(--text-muted)] leading-relaxed">
        Kliknutím se nic neodešle. Zobrazí se přehled dat, která by mohla být
        předána — odeslání závisí na vašem výslovném potvrzení.
      </p>

      {previewData && (
        <DataSharingPreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          preview={previewData}
          source={source ?? "kalkulacky/financovani"}
          handoffContext={handoffContext}
          onSuccess={setDone}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MortgageReadinessCard({
  readiness,
  isAuthenticated,
  callbackUrl,
  source,
  handoffContext,
  activeFinancingLead,
  className,
}: {
  readiness: MortgageReadiness | OrientationalMortgageReadiness;
  isAuthenticated: boolean;
  callbackUrl?: string;
  source?: string;
  handoffContext?: HandoffContext;
  activeFinancingLead?: MortgageLeadDuplicateInfo | null;
  className?: string;
}) {
  const orientational =
    "regulatoryDisclaimer" in readiness ? readiness : null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status */}
      <Card variant="static" padding="md">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">
              Připravenost k financování
            </h4>
            <ReadinessBadge
              level={readiness.level}
              label={readiness.label}
            />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {readiness.description}
          </p>

          {orientational?.ltvScenarioAssessment ? (
            <InlineAlert
              tone={
                orientational.ltvScenarioAssessment.matches ? "info" : "warning"
              }
            >
              {orientational.ltvScenarioAssessment.userMessage}
            </InlineAlert>
          ) : null}

          {/* Checklist */}
          <ul className="space-y-0 divide-y divide-[var(--border-default)]">
            {readiness.checklist.map((item) => (
              <ChecklistRow key={item.id} item={item} />
            ))}
          </ul>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {orientational?.regulatoryDisclaimer ??
              "Toto je orientační hodnocení připravenosti podkladů. Nejedná se o posouzení bonity ani předschválení úvěru."}
          </p>
        </div>
      </Card>

      {/* CTA */}
      <HandoffCta
        readiness={readiness}
        isAuthenticated={isAuthenticated}
        callbackUrl={callbackUrl}
        source={source}
        handoffContext={handoffContext}
        activeFinancingLead={activeFinancingLead}
      />
    </div>
  );
}
