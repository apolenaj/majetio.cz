"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  startBrokerOnboardingAction,
  completeBrokerOnboardingAction,
} from "@/domains/organizations/server/actions";
import { Button } from "@/components/ui/button";
import { Label, TextInput } from "@/components/forms/field";

type Props = {
  existingOrganizationId: string | null;
  displayName: string;
};

export function BrokerOnboardingForm({
  existingOrganizationId,
  displayName,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(displayName);
  const [orgName, setOrgName] = useState("");
  const [ico, setIco] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      if (existingOrganizationId) {
        const done = await completeBrokerOnboardingAction({
          organizationId: existingOrganizationId,
        });
        if (!done.ok) {
          setError(done.error);
          return;
        }
        router.push("/profi");
        router.refresh();
        return;
      }

      const created = await startBrokerOnboardingAction({
        organizationName: orgName || `${name} — kancelář`,
        organizationType: "REAL_ESTATE_AGENT",
        displayName: name,
        ico: ico || undefined,
      });
      if (!created.ok) {
        setError(created.error);
        return;
      }
      const done = await completeBrokerOnboardingAction({
        organizationId: created.organizationId,
      });
      if (!done.ok) {
        setError(done.error);
        return;
      }
      router.push("/profi");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="displayName" required>
          Zobrazované jméno
        </Label>
        <TextInput
          id="displayName"
          name="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      {!existingOrganizationId ? (
        <>
          <div>
            <Label htmlFor="orgName" required>
              Název organizace
            </Label>
            <TextInput
              id="orgName"
              name="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ico" optional>
              IČO
            </Label>
            <TextInput
              id="ico"
              name="ico"
              value={ico}
              onChange={(e) => setIco(e.target.value)}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">
          Organizace už existuje — dokončete onboarding.
        </p>
      )}
      {error ? (
        <p className="text-sm text-[var(--status-error)]" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Ukládám…" : "Dokončit onboarding"}
      </Button>
    </form>
  );
}
