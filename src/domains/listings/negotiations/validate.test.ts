import { describe, expect, it } from "vitest";

import {
  canAcceptNegotiation,
  isRecentDuplicate,
  listingRecipient,
  outcomeMessage,
  proportionalAskingShare,
  reduceNegotiation,
  resolveShortDescription,
  validateAdvertiserShortDescription,
  validateCoPurchase,
  validatePriceOffer,
} from "./validate";

const contact = {
  buyerName: "Jana Nováková",
  buyerEmail: "jana@example.com",
  buyerPhone: "",
  honeypot: "",
};

describe("resolveShortDescription", () => {
  it("vezme konkrétní odstavec a přeskočí nadpis i název", () => {
    const text = resolveShortDescription({
      title: "Světlý byt 2+kk blízko metra",
      description: [
        "O nemovitosti",
        "Byt 2+kk v cihlovém domě, samostatná ložnice, koupelna a výtah ve vnitrobloku.",
        "Potenciál a investice",
        "Text sám výnos nepočítá.",
      ].join("\n\n"),
    });
    expect(text).toContain("samostatná ložnice");
    expect(text?.toLowerCase()).not.toContain("výhodná investice");
  });

  it("odstraní HTML a nezopakuje jen název", () => {
    expect(
      resolveShortDescription({
        title: "Byt ve Vysočanech",
        description: "<p>Byt ve Vysočanech</p><p>Po dílčí úpravě povrchů, plastová okna a funkční stoupačky.</p>",
      }),
    ).toContain("plastová okna");
  });

  it("odmítne nepodložený reklamní krátký popis", () => {
    expect(
      validateAdvertiserShortDescription(
        "Garantovaný výnos a výhodná investice v centru s dispozicí 2+kk.",
      ).ok,
    ).toBe(false);
  });
});

describe("validatePriceOffer", () => {
  it("nepřijme nulovou částku ani neznámou měnu", () => {
    expect(
      validatePriceOffer({ ...contact, amount: 0, currency: "CZK", financing: "OWN_FUNDS" }).ok,
    ).toBe(false);
    expect(
      validatePriceOffer({ ...contact, amount: 1000, currency: "USD", financing: "LOAN" }).ok,
    ).toBe(false);
  });

  it("přijme nabídkovou cenu bez slevy", () => {
    const parsed = validatePriceOffer({
      ...contact,
      amount: 6_500_000,
      currency: "czk",
      financing: "MIXED",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.amountCzk).toBe(6_500_000);
  });
});

describe("validateCoPurchase", () => {
  it("bez rozlišení podílu návrh neodešle", () => {
    const parsed = validateCoPurchase({
      ...contact,
      situation: "SEEK_PARTNER",
      allowSeekPartner: true,
      allowSellerRetains: false,
      sharePercent: 50,
      shareReference: "",
      offeredOwnershipPercent: 40,
      cashContributionCzk: 1_000_000,
      purpose: "OWN_LIVING",
      hasCoInvestor: "no",
      financing: "UNKNOWN",
    });
    expect(parsed.ok).toBe(false);
  });

  it("nerozlišuje podíl a vklad a nepovolí nepovolenou situaci", () => {
    const ok = validateCoPurchase({
      ...contact,
      situation: "SELLER_RETAINS",
      allowSeekPartner: false,
      allowSellerRetains: true,
      sharePercent: 25,
      offeredOwnershipPercent: null,
      cashContributionCzk: 800_000,
      purpose: "LONG_TERM_RENT",
      hasCoInvestor: "yes",
      financing: "OWN_FUNDS",
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.sharePercent).toBe(25);
      expect(ok.value.cashContributionCzk).toBe(800_000);
      expect(ok.value.shareReference).toBe("WHOLE_PROPERTY");
    }
    expect(
      validateCoPurchase({
        ...contact,
        situation: "SEEK_PARTNER",
        allowSeekPartner: false,
        allowSellerRetains: true,
        sharePercent: 50,
        cashContributionCzk: 1,
        purpose: "OTHER",
        hasCoInvestor: "no",
        financing: "LOAN",
      }).ok,
    ).toBe(false);
  });
});

describe("proportionalAskingShare", () => {
  it("spočítá polovinu nabídkové ceny a u podílu celé nemovitosti mlčí", () => {
    expect(
      proportionalAskingShare({
        askingPrice: 6_500_000,
        sharePercent: 50,
        shareReference: "WHOLE_PROPERTY",
        offeredOwnershipPercent: null,
      }),
    ).toEqual({
      amount: 3_250_000,
      label: "Poměrná část nabídkové ceny, bez dalších nákladů",
    });
    const hidden = proportionalAskingShare({
      askingPrice: 3_250_000,
      sharePercent: 25,
      shareReference: "WHOLE_PROPERTY",
      offeredOwnershipPercent: 50,
    });
    expect("amount" in hidden && hidden.amount).toBeNull();
  });
});

describe("oprávnění a doručení", () => {
  it("ignoruje příjemce z formuláře a blokuje prodané i archivované", () => {
    expect(
      listingRecipient(
        { listedByUserId: "seller", ownerUserId: "owner" },
        "attacker",
      ),
    ).toBe("seller");
    expect(canAcceptNegotiation("SOLD")).toBe(false);
    expect(canAcceptNegotiation("ARCHIVED")).toBe(false);
    expect(canAcceptNegotiation("ACTIVE")).toBe(true);
  });

  it("neoznačí uložení bez e-mailu jako odeslané", () => {
    expect(outcomeMessage("STORED_ONLY").emailed).toBe(false);
    expect(outcomeMessage("STORED_ONLY").text).not.toMatch(/odešlo|odeslán/i);
    expect(outcomeMessage("FAILED").text).toMatch(/nepodařilo/);
  });

  it("pozná duplicitu a protinávrh nepřepíše původní částku", () => {
    expect(
      isRecentDuplicate({
        now: 1_000_000,
        previousCreatedAt: 1_000_000 - 60_000,
        samePayload: true,
      }),
    ).toBe(true);
    const next = reduceNegotiation(
      {
        status: "NEW",
        amountCzk: 5_000_000,
        versions: [{ actor: "BUYER", amountCzk: 5_000_000, status: "NEW" }],
      },
      { type: "counter", amountCzk: 5_800_000, message: "Protinávrh" },
    );
    expect("error" in next).toBe(false);
    if (!("error" in next)) {
      expect(next.amountCzk).toBe(5_000_000);
      expect(next.status).toBe("COUNTERED");
      expect(next.versions[0]?.amountCzk).toBe(5_000_000);
      expect(next.versions[1]?.amountCzk).toBe(5_800_000);
    }
    const withdrawn = reduceNegotiation(
      { status: "NEW", amountCzk: 1, versions: [] },
      { type: "withdraw" },
    );
    expect("error" in withdrawn ? null : withdrawn.status).toBe("WITHDRAWN");
    if (!("error" in withdrawn)) {
      expect(
        reduceNegotiation(withdrawn, { type: "revise", amountCzk: 2 }),
      ).toEqual({ error: "Uzavřený, odmítnutý nebo stažený návrh už nelze měnit." });
    }
  });
});
