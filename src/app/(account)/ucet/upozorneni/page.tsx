import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationsPanel } from "@/components/account/notifications-panel";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { loadNotificationsPage } from "@/lib/account/notifications-actions";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Upozornění",
  robots: { index: false, follow: false },
};

export default async function UpozorneniPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(buildLoginUrl("/ucet/upozorneni"));
  if (await isOnboardingPending(session.user.id)) redirect("/onboarding");

  const result = await loadNotificationsPage();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst upozornění">
        {result.error}
      </InlineAlert>
    );
  }

  return <NotificationsPanel initial={result.data} />;
}
