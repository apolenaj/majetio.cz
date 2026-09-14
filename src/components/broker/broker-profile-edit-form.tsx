"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { updateBrokerProfileAction } from "@/domains/organizations/server/actions";

export function BrokerProfileEditForm({
  organizationId,
  initialDisplayName,
  initialPhone,
  initialBio,
}: {
  organizationId: string;
  initialDisplayName: string;
  initialPhone: string;
  initialBio: string;
}) {
  const [displayName, setDisplayName] = React.useState(initialDisplayName);
  const [phonePublic, setPhonePublic] = React.useState(initialPhone);
  const [bio, setBio] = React.useState(initialBio);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);

  async function onSave() {
    setBusy(true);
    setError(null);
    setOk(false);
    const result = await updateBrokerProfileAction({
      organizationId,
      displayName,
      phonePublic: phonePublic || null,
      bio: bio || null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk(true);
  }

  return (
    <Card className="space-y-4 p-5" elevation="flat">
      <h3 className="font-display text-lg">Upravit profil</h3>
      {error ? (
        <InlineAlert tone="warning" title="Profil">
          {error}
        </InlineAlert>
      ) : null}
      {ok ? (
        <InlineAlert tone="info" title="Uloženo">
          Profil aktualizován.
        </InlineAlert>
      ) : null}
      <Field id="displayName" label="Zobrazované jméno">
        <TextInput
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Field>
      <Field id="phone" label="Telefon (veřejný)">
        <TextInput
          id="phone"
          value={phonePublic}
          onChange={(e) => setPhonePublic(e.target.value)}
        />
      </Field>
      <Field id="bio" label="Bio">
        <TextInput
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </Field>
      <Button type="button" loading={busy} onClick={() => void onSave()}>
        Uložit profil
      </Button>
    </Card>
  );
}
