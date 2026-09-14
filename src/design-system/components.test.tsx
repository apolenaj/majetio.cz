/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Field, TextInput } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/navigation/tabs";
import { PropertyCard } from "@/components/property/property-card";
import { MetricCard } from "@/components/data-display/metric-card";
import { EmptyState } from "@/components/feedback/states";

describe("Field", () => {
  it("associates label and shows error", () => {
    render(
      <Field id="price" label="Cena" error="Hodnotu upravte na číslo vyšší než nula.">
        <TextInput />
      </Field>,
    );
    expect(screen.getByLabelText(/Cena/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/vyšší než nula/);
  });
});

describe("Select", () => {
  it("renders options", () => {
    render(
      <Select aria-label="Město" defaultValue="praha">
        <option value="praha">Praha</option>
        <option value="brno">Brno</option>
      </Select>,
    );
    expect(screen.getByLabelText("Město")).toHaveValue("praha");
  });
});

describe("Tabs", () => {
  it("switches panels", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Panel A</TabsContent>
        <TabsContent value="b">Panel B</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("Panel A")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "B" }));
    expect(screen.getByText("Panel B")).toBeVisible();
  });
});

describe("PropertyCard", () => {
  it("marks demo and shows metrics", () => {
    render(
      <PropertyCard
        property={{
          href: "/nemovitosti/x",
          title: "Demo byt",
          location: "Demo město",
          priceCzk: 1_000_000,
          isDemo: true,
          dataQuality: "estimated",
        }}
      />,
    );
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.getByText("Demo byt")).toBeInTheDocument();
  });
});

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Výnos" value="5,4 %" tone="positive" />);
    expect(screen.getByText("Výnos")).toBeInTheDocument();
    expect(screen.getByText("5,4 %")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders call to action slot", () => {
    render(
      <EmptyState title="Prázdné" description="Popis" action={<button type="button">Akce</button>} />,
    );
    expect(screen.getByRole("button", { name: "Akce" })).toBeInTheDocument();
  });
});
