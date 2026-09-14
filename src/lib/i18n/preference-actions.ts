"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { buildPreferenceCookies } from "@/domains/i18n/preference/store";
import {
  getMarketDefaultCurrency,
  toMarketCode,
  tryMarketCode,
} from "@/domains/markets/codes";
import { marketRegistry } from "@/domains/markets/registry/market-registry";
import { resolveLocaleForMarket } from "@/domains/i18n/locales";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type SetMarketLocaleResult =
  | { ok: true; marketCode: string; locale: string; currency: string }
  | { ok: false; error: string };

/**
 * Persist market + locale preference.
 * Guests → cookies; authenticated → UserProfile + UserMarketProfile upsert.
 * Never force-redirect — caller refreshes in place.
 */
export async function setMarketLocalePreference(input: {
  marketCode: string;
  locale?: string | null;
}): Promise<SetMarketLocaleResult> {
  let marketCode;
  try {
    marketCode = toMarketCode(input.marketCode);
  } catch {
    return { ok: false, error: "Unknown market." };
  }

  const market = marketRegistry.get(marketCode);
  if (!market) return { ok: false, error: "Market not registered." };

  const localeDef = resolveLocaleForMarket({
    marketDefaultLocale: market.defaultLocale,
    marketSupportedLocales: market.supportedLocales,
    userPreferredLocale: input.locale,
  });

  const currency =
    market.defaultCurrency || getMarketDefaultCurrency(marketCode) || "CZK";

  const cookieStore = await cookies();
  for (const c of buildPreferenceCookies({
    marketCode,
    locale: localeDef.locale,
    currency,
  })) {
    cookieStore.set(c.name, c.value, {
      path: c.path,
      maxAge: c.maxAge,
      sameSite: c.sameSite,
      secure: c.secure,
    });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (userId) {
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferredLocale: localeDef.language,
      },
      update: {
        preferredLocale: localeDef.language,
      },
    });

    await prisma.userMarketProfile.upsert({
      where: {
        userId_marketCode: { userId, marketCode },
      },
      create: {
        userId,
        marketCode,
        preferredLocale: localeDef.locale,
        preferredCurrency: currency,
      },
      update: {
        preferredLocale: localeDef.locale,
        preferredCurrency: currency,
      },
    });
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    marketCode,
    locale: localeDef.locale,
    currency,
  };
}

export async function setLocaleOnlyPreference(
  locale: string,
): Promise<SetMarketLocaleResult> {
  const cookieStore = await cookies();
  const marketRaw = cookieStore.get("majetio_market")?.value ?? "CZ";
  const code = tryMarketCode(marketRaw) ?? toMarketCode("CZ");
  return setMarketLocalePreference({ marketCode: code, locale });
}
