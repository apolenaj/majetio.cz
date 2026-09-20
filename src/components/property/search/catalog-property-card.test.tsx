import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PropertyCard } from "@/components/property/search/catalog-property-card";
import { findCatalogPropertyBySlug } from "@/lib/mock-properties";

describe("catalog PropertyCard detail links", () => {
  it("fotografie, název a Detail vedou na stejný href", () => {
    const property = findCatalogPropertyBySlug("ukazka-1");
    expect(property).toBeDefined();
    if (!property) return;

    render(<PropertyCard property={property} />);

    const photo = screen.getByRole("link", { name: `Zobrazit detail: ${property.nazev}` });
    const title = screen.getByRole("link", { name: property.nazev });
    const detail = screen.getByRole("link", { name: "Zobrazit detail" });

    expect(photo).toHaveAttribute("href", "/nemovitosti/ukazka-1");
    expect(title).toHaveAttribute("href", "/nemovitosti/ukazka-1");
    expect(detail).toHaveAttribute("href", "/nemovitosti/ukazka-1");
  });
});
