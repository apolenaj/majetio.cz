import { describe, expect, it } from "vitest";

import { validateListingUrl } from "@/lib/listing-url";

describe("validateListingUrl", () => {
  it("accepts https listing URLs from allowed portals", () => {
    const result = validateListingUrl(
      "https://www.sreality.cz/detail/prodej/byt/3+kk/praha/123",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url).toContain("sreality.cz");
    }
  });

  it("rejects non-https", () => {
    expect(validateListingUrl("http://www.sreality.cz/detail/1").ok).toBe(false);
  });

  it("blocks localhost and private IPs", () => {
    expect(validateListingUrl("https://localhost/listing").ok).toBe(false);
    expect(validateListingUrl("https://127.0.0.1/listing").ok).toBe(false);
    expect(validateListingUrl("https://192.168.1.10/listing").ok).toBe(false);
    expect(validateListingUrl("https://169.254.169.254/latest").ok).toBe(false);
  });

  it("blocks credentials in URL", () => {
    expect(
      validateListingUrl("https://user:pass@www.sreality.cz/detail/1").ok,
    ).toBe(false);
  });

  it("rejects unknown hosts as unsupported", () => {
    const result = validateListingUrl("https://evil.example/phish");
    expect(result).toEqual({ ok: false, reason: "unsupported" });
  });
});
