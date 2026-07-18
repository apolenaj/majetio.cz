"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Checkbox } from "@/components/forms/controls";
import { Field, TextInput } from "@/components/forms/field";
import { InlineAlert } from "@/components/feedback/states";
import { Button } from "@/components/ui/button";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/lib/auth/actions";

function isRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <form
      className="space-y-4"
      aria-label="Přihlášení"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const result = await loginAction(fd);
            if (result && !result.ok) setError(result.error);
            else router.refresh();
          } catch (err) {
            if (isRedirectError(err)) return;
            setError("Přihlášení se nepodařilo.");
          }
        });
      }}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {error ? (
        <InlineAlert tone="error" title="Nelze přihlásit">
          {error}
        </InlineAlert>
      ) : null}
      <Field id="login-email" label="E-mail" required>
        <TextInput name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="login-password" label="Heslo" required>
        <TextInput name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" fullWidth loading={pending}>
        Přihlásit se
      </Button>
      <p className="text-sm text-[var(--text-secondary)]">
        <Link href="/zapomenute-heslo" className="underline underline-offset-2">
          Zapomenuté heslo
        </Link>
        {" · "}
        <Link href="/registrace" className="underline underline-offset-2">
          Registrace
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <form
      className="space-y-4"
      aria-label="Registrace"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const result = await registerAction(fd);
            if (result && !result.ok) setError(result.error);
            else router.refresh();
          } catch (err) {
            if (isRedirectError(err)) return;
            setError("Registraci se nepodařilo dokončit.");
          }
        });
      }}
    >
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {error ? (
        <InlineAlert tone="error" title="Registrace se nezdařila">
          {error}
        </InlineAlert>
      ) : null}
      <Field id="register-email" label="E-mail" required>
        <TextInput name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        id="register-password"
        label="Heslo"
        required
        helperText="Nejméně 8 znaků, alespoň jedno písmeno a jedna číslice."
      >
        <TextInput name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Checkbox
        name="acceptTerms"
        required
        label="Souhlasím s obchodními podmínkami a ochranou osobních údajů"
        description="Bez tohoto souhlasu účet nelze založit. Marketingový souhlas nepožadujeme."
      />
      <Button type="submit" fullWidth loading={pending}>
        Vytvořit účet
      </Button>
      <p className="text-sm text-[var(--text-secondary)]">
        Už máte účet?{" "}
        <Link href="/prihlaseni" className="underline underline-offset-2">
          Přihlášení
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await requestPasswordResetAction(fd);
          if (!result.ok) setError(result.error);
          else setMessage(result.message ?? "Odesláno.");
        });
      }}
    >
      {error ? (
        <InlineAlert tone="error" title="Chyba">
          {error}
        </InlineAlert>
      ) : null}
      {message ? (
        <InlineAlert tone="success" title="Hotovo">
          {message}
        </InlineAlert>
      ) : null}
      <Field id="forgot-email" label="E-mail" required>
        <TextInput name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" fullWidth loading={pending}>
        Poslat odkaz pro obnovení
      </Button>
    </form>
  );
}

export function ResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await resetPasswordAction(fd);
          if (!result.ok) setError(result.error);
          else setMessage(result.message ?? "Heslo změněno.");
        });
      }}
    >
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      {error ? (
        <InlineAlert tone="error" title="Nelze obnovit heslo">
          {error}
        </InlineAlert>
      ) : null}
      {message ? (
        <InlineAlert tone="success" title="Hotovo">
          {message}{" "}
          <Link href="/prihlaseni" className="underline underline-offset-2">
            Přihlásit se
          </Link>
        </InlineAlert>
      ) : null}
      <Field
        id="reset-password"
        label="Nové heslo"
        required
        helperText="Nejméně 8 znaků, alespoň jedno písmeno a jedna číslice."
      >
        <TextInput name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" fullWidth loading={pending} disabled={Boolean(message)}>
        Nastavit nové heslo
      </Button>
    </form>
  );
}
