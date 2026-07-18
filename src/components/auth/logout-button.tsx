"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
    >
      Odhlásit se
    </Button>
  );
}
