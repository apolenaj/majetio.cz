import { expect, test } from "@playwright/test";

/**
 * Professional Review E2E (checklist 194).
 * Expert Review / Investment Audit are human-in-the-loop — not auto analysis.
 * Purchase Concierge / transaction success fee stays OFF (215/225).
 */

test.describe("Professional Review (194)", () => {
  test("cenik shows Expert Review and Investment Audit as services", async ({
    page,
  }) => {
    await page.goto("/cenik");
    await expect(
      page.getByRole("heading", { name: /Profesionální služby|služby/i }).first(),
    ).toBeVisible();

    const services = page.locator("#segment-professional_services");
    await expect(services.getByText(/Expert Review/i).first()).toBeVisible();
    await expect(services.getByText(/Investment Audit/i).first()).toBeVisible();
    await expect(
      services.getByText(/human-in-the-loop|specialist|ne automatick/i).first(),
    ).toBeVisible();
  });

  test("Purchase Concierge stays unavailable while success-fee flag OFF", async ({
    page,
  }) => {
    await page.goto("/cenik");
    const services = page.locator("#segment-professional_services");
    await expect(services.getByText(/Purchase Concierge/i).first()).toBeVisible();
    await expect(
      services.getByText(/právním rámci|Nedostupné|feature flag/i).first(),
    ).toBeVisible();
    // No agency / success-fee sales promises while gated
    const body = await page.locator("#segment-professional_services").innerText();
    expect(body).not.toMatch(/zastoupíme vás při koupi|provize z úspěšné transakce/i);
  });

  test("checkout for expert_review requires auth (no silent grant)", async ({
    page,
  }) => {
    await page.goto("/checkout?product=expert_review");
    await expect(page).toHaveURL(/prihlaseni|checkout|registrace/i);
    await expect(
      page.getByText(/automatická analýza hotová|review delivered/i),
    ).toHaveCount(0);
  });
});
