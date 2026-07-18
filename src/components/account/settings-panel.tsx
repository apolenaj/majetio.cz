"use client";

import * as React from "react";

import { InlineAlert } from "@/components/feedback/states";
import { Field, TextInput } from "@/components/forms/field";
import { PasswordInput } from "@/components/forms/inputs";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAccountExport, exportToCsv } from "@/lib/account/export";
import {
  changePassword,
  deleteAccount,
  requestEmailChange,
  updateDisplayName,
  updatePhone,
  type SettingsPageData,
} from "@/lib/account/settings-actions";

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SettingsPanel({ initial }: { initial: SettingsPageData }) {
  const [name, setName] = React.useState(initial.name);
  const [phone, setPhone] = React.useState(initial.phone ?? "");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [emailPassword, setEmailPassword] = React.useState("");

  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleteEmail, setDeleteEmail] = React.useState("");
  const [deleteUnderstood, setDeleteUnderstood] = React.useState(false);

  async function run(
    key: string,
    action: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>,
  ) {
    setLoading(key);
    setError(null);
    setMessage(null);
    const result = await action();
    setLoading(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message ?? "Uloženo.");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h2 text-[var(--text-primary)]">Nastavení účtu</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Profil, bezpečnost, export dat a smazání účtu. Citlivé změny vyžadují ověření heslem.
        </p>
      </div>

      {message ? (
        <InlineAlert tone="success" title="Hotovo">
          {message}
        </InlineAlert>
      ) : null}
      {error ? (
        <InlineAlert tone="error" title="Nelze dokončit">
          {error}
        </InlineAlert>
      ) : null}

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Jméno a telefon (volitelné). Nevyžadujeme rodné číslo ani adresu.</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Field id="settings-name" label="Jméno / označení" optional>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
          <Field id="settings-phone" label="Telefon" optional>
            <TextInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              inputMode="tel"
            />
          </Field>
          <p className="text-sm text-[var(--text-muted)]">
            Přihlašovací e-mail: <span className="font-medium text-[var(--text-primary)]">{initial.email}</span>
            {initial.pendingEmail ? (
              <>
                {" "}
                · čeká potvrzení: <span className="font-medium">{initial.pendingEmail}</span>
              </>
            ) : null}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              loading={loading === "name"}
              onClick={() => void run("name", () => updateDisplayName(name))}
            >
              Uložit jméno
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={loading === "phone"}
              onClick={() => void run("phone", () => updatePhone(phone))}
            >
              Uložit telefon
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Změna e-mailu</CardTitle>
          <CardDescription>
            Vyžaduje heslo a potvrzení odkazem. Nový e-mail se aktivuje až po ověření — žádný skrytý
            přesun.
          </CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Field id="settings-new-email" label="Nový e-mail">
            <TextInput
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field id="settings-email-password" label="Současné heslo">
            <PasswordInput
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Button
            type="button"
            loading={loading === "email"}
            onClick={() =>
              void run("email", () =>
                requestEmailChange({ newEmail, password: emailPassword }),
              )
            }
          >
            Požádat o změnu e-mailu
          </Button>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Změna hesla</CardTitle>
          <CardDescription>Vyžaduje současné heslo. Nové heslo musí mít písmeno i číslici.</CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <Field id="settings-current-password" label="Současné heslo">
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field id="settings-new-password" label="Nové heslo">
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Button
            type="button"
            loading={loading === "password"}
            onClick={() =>
              void run("password", () =>
                changePassword({ currentPassword, newPassword }),
              )
            }
          >
            Změnit heslo
          </Button>
        </div>
      </Card>

      <Card padding="lg">
        <CardHeader>
          <CardTitle>Export dat</CardTitle>
          <CardDescription>
            Stáhněte si kopii profilu (JSON nebo CSV). Export se zaznamená do auditu.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            loading={loading === "json"}
            onClick={() =>
              void run("json", async () => {
                const result = await buildAccountExport("json");
                if (!result.ok) return result;
                downloadBlob(
                  `majetio-export-${new Date().toISOString().slice(0, 10)}.json`,
                  JSON.stringify(result.data, null, 2),
                  "application/json",
                );
                return { ok: true, message: "JSON export stažen." };
              })
            }
          >
            Stáhnout JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={loading === "csv"}
            onClick={() =>
              void run("csv", async () => {
                const result = await buildAccountExport("csv");
                if (!result.ok) return result;
                downloadBlob(
                  `majetio-export-${new Date().toISOString().slice(0, 10)}.csv`,
                  exportToCsv(result.data),
                  "text/csv;charset=utf-8",
                );
                return { ok: true, message: "CSV export stažen." };
              })
            }
          >
            Stáhnout CSV
          </Button>
        </div>
      </Card>

      <Card padding="lg" variant="danger">
        <CardHeader>
          <CardTitle>Smazání účtu</CardTitle>
          <CardDescription>
            Nevratná akce. Žádné předzaškrtnuté souhlasy — musíte potvrdit důsledky, e-mail i heslo.
          </CardDescription>
        </CardHeader>
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
          {initial.consequences.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="space-y-4">
          <label className="flex gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={deleteUnderstood}
              onChange={(e) => setDeleteUnderstood(e.target.checked)}
            />
            <span>Rozumím důsledkům a chci účet trvale smazat.</span>
          </label>
          <Field id="delete-email" label="Napište svůj e-mail pro potvrzení">
            <TextInput
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              autoComplete="off"
              placeholder={initial.email}
            />
          </Field>
          <Field id="delete-password" label="Heslo">
            <PasswordInput
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Button
            type="button"
            variant="destructive"
            disabled={!deleteUnderstood}
            loading={loading === "delete"}
            onClick={() =>
              void run("delete", () =>
                deleteAccount({
                  password: deletePassword,
                  confirmEmail: deleteEmail,
                }),
              )
            }
          >
            Trvale smazat účet
          </Button>
        </div>
      </Card>
    </div>
  );
}
