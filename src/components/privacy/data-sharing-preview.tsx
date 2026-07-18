"use client";

import * as React from "react";

import { Checkbox } from "@/components/forms/controls";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/overlays/dialog";
import {
  confirmHypotekaJasneHandoff,
  type HandoffPreviewData,
} from "@/lib/financing/handoff-actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: HandoffPreviewData;
  source?: string;
  onSuccess?: (result: { externalLeadId: string; isMock: boolean }) => void;
};

/**
 * Explicit consent gate before any HypotekaJasne data handoff.
 * Opening this dialog must NOT send data — only confirmHypotekaJasneHandoff does.
 */
export function DataSharingPreview({
  open,
  onOpenChange,
  preview,
  source = "ucet/financni-profil",
  onSuccess,
}: Props) {
  const selectable = preview.fields.filter((f) => f.value || f.always);
  const [selected, setSelected] = React.useState<string[]>(() =>
    selectable.filter((f) => f.included || f.always).map((f) => f.key),
  );
  const [explicit, setExplicit] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSelected(selectable.filter((f) => f.included || f.always).map((f) => f.key));
      setExplicit(false);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when dialog opens
  }, [open]);

  function toggleField(key: string, always: boolean) {
    if (always) return;
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function onConfirm() {
    if (!explicit) {
      setError("Potvrďte souhlas zaškrtnutím pole níže.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await confirmHypotekaJasneHandoff({
      explicitConsent: true,
      selectedFields: selected,
      source,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSuccess?.(result);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Náhled předání dat"
        description="Data se neodešlou automaticky. Až po výslovném potvrzení níže."
        className="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4 text-sm">
          <InlineAlert tone="warning" title="Bez automatického odeslání">
            Kliknutím na „Chci zjistit možnosti financování“ se data partnerovi neposílají.
            Odeslání proběhne jen po „Souhlasím a pokračovat“.
          </InlineAlert>

          <dl className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Komu</dt>
              <dd className="text-right font-medium">
                <a
                  href={preview.recipient.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {preview.recipient.name}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Účel</dt>
              <dd className="mt-1 text-[var(--text-secondary)]">{preview.recipient.purpose}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)]">Verze souhlasu</dt>
              <dd className="font-metric">{preview.consentVersion}</dd>
            </div>
          </dl>

          <div>
            <p className="mb-2 font-medium text-[var(--text-primary)]">
              Konkrétní data k předání
            </p>
            <ul className="space-y-2">
              {selectable.map((field) => (
                <li key={field.key}>
                  <label className="flex cursor-pointer gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-4"
                      checked={selected.includes(field.key)}
                      disabled={field.always}
                      onChange={() => toggleField(field.key, field.always)}
                    />
                    <span>
                      <span className="block font-medium">{field.label}</span>
                      <span className="text-[var(--text-muted)]">
                        {field.value ?? "— (není vyplněno)"}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <Checkbox
            label="Souhlasím s předáním vybraných údajů HypotekaJasne.cz za účelem nabídky financování."
            description="Souhlas můžete později dohledat v historii na stránce Souhlasy. Marketingový souhlas se tímto neuděluje."
            checked={explicit}
            onChange={(e) => setExplicit(e.target.checked)}
          />

          {error ? (
            <InlineAlert tone="error" title="Nelze pokračovat">
              {error}
            </InlineAlert>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button
              type="button"
              loading={loading}
              disabled={!explicit}
              onClick={() => void onConfirm()}
            >
              Souhlasím a pokračovat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function HypotekaJasneHandoffCard({
  preview,
  source,
}: {
  preview: HandoffPreviewData;
  source?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [done, setDone] = React.useState<{ externalLeadId: string; isMock: boolean } | null>(
    null,
  );

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
        <InlineAlert tone="success" title="Požadavek byl zaznamenán">
          Reference: {done.externalLeadId}
          {done.isMock ? " (demo / mock prostředí)." : "."} Historii najdete v Souhlasech.
        </InlineAlert>
      ) : (
        <Button type="button" size="lg" onClick={() => setOpen(true)}>
          Chci zjistit možnosti financování
        </Button>
      )}

      <DataSharingPreview
        open={open}
        onOpenChange={setOpen}
        preview={preview}
        source={source}
        onSuccess={setDone}
      />
    </Card>
  );
}
