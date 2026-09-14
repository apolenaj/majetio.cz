import { notFound } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { LineChart, BarChart } from "@/components/charts/charts";
import { MajetioScore, MetricCard } from "@/components/data-display/metric-card";
import { FinancialTable } from "@/components/data-display/table";
import { DialogDemo } from "@/components/dev/dialog-demo";
import { FormDemo } from "@/components/dev/form-demo";
import {
  EmptyState,
  ErrorState,
  InlineAlert,
  LoadingSkeleton,
  Spinner,
} from "@/components/feedback/states";
import { Field, TextInput } from "@/components/forms/field";
import {
  CalculatorShell,
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/navigation/tabs";
import { PropertyCard } from "@/components/property/property-card";
import { Badge, DataQualityBadge, RiskBadge, StrategyBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card } from "@/components/ui/card";
import { Divider, Grid, Section, Stack } from "@/components/ui/layout-primitives";
import { formatCzk, formatPercentPoints } from "@/lib/format";

export const metadata = {
  title: "Design System (dev)",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DEMO_CHART = [
  { label: "2022", value: 5_800_000 },
  { label: "2023", value: 6_100_000 },
  { label: "2024", value: 6_350_000 },
  { label: "2025", value: 6_500_000 },
];

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DESIGN_SYSTEM !== "true") {
    notFound();
  }

  return (
    <StandardPageLayout>
      <PageHeader
        title="Majetio Design System"
        description="Vývojová galerie komponent. Data jsou demonstrační — nejedná se o reálné nabídky ani výpočty."
        badge={<Badge tone="premium">Dev only</Badge>}
        breadcrumbs={[
          { href: "/", label: "Úvod" },
          { label: "Design system" },
        ]}
      />

      <InlineAlert tone="warning" title="Demonstrační obsah" className="mb-10">
        Všechna čísla a nemovitosti na této stránce jsou ilustrativní.
      </InlineAlert>

      <Stack gap="lg">
        <Section className="py-0" aria-labelledby="ds-brand">
          <h2 id="ds-brand" className="text-h2">
            Značka
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-8 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-6">
            <Logo variant="dark" size="lg" />
            <div className="rounded-md bg-[var(--surface-inverse)] p-4">
              <Logo variant="light" size="lg" />
            </div>
          </div>
        </Section>

        <Section className="py-0" aria-labelledby="ds-colors">
          <h2 id="ds-colors" className="text-h2">
            Barvy
          </h2>
          <Grid cols={4} className="mt-4">
            {[
              ["action-primary", "var(--action-primary)"],
              ["action-accent", "var(--action-accent)"],
              ["action-premium", "var(--action-premium)"],
              ["status-success", "var(--status-success)"],
              ["status-warning", "var(--status-warning)"],
              ["status-error", "var(--status-error)"],
              ["status-info", "var(--status-info)"],
              ["data-stale", "var(--data-stale)"],
            ].map(([name, color]) => (
              <div key={name} className="space-y-2">
                <div
                  className="h-16 rounded-[var(--radius-md)] border border-[var(--border-default)]"
                  style={{ background: color }}
                />
                <p className="text-xs text-[var(--text-muted)]">{name}</p>
              </div>
            ))}
          </Grid>
        </Section>

        <Section className="py-0" aria-labelledby="ds-type">
          <h2 id="ds-type" className="text-h2">
            Typografie
          </h2>
          <Stack className="mt-4" gap="sm">
            <p className="text-display-l">Display L — rozhodnutí o majetku</p>
            <p className="text-h1">H1 — Nadpis stránky</p>
            <p className="text-h2">H2 — Sekce</p>
            <p className="text-base">Body M — Běžný text s diakritikou: příliš žluťoučký kůň.</p>
            <p className="font-metric text-[var(--text-metric-l)] font-semibold">
              Metric L — {formatCzk(4_990_000)}
            </p>
          </Stack>
        </Section>

        <Section className="py-0" aria-labelledby="ds-buttons">
          <h2 id="ds-buttons" className="text-h2">
            Tlačítka
          </h2>
          <ButtonGroup className="mt-4" aria-label="Ukázka tlačítek">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="destructive">Destructive</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </ButtonGroup>
        </Section>

        <Section className="py-0" aria-labelledby="ds-badges">
          <h2 id="ds-badges" className="text-h2">
            Badge a stavy dat
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <DataQualityBadge quality="verified" />
            <DataQualityBadge quality="estimated" />
            <DataQualityBadge quality="stale" />
            <DataQualityBadge quality="incomplete" />
            <RiskBadge level="low" />
            <RiskBadge level="medium" />
            <RiskBadge level="high" />
            <StrategyBadge label="Dlouhodobý pronájem" />
          </div>
        </Section>

        <Section className="py-0" aria-labelledby="ds-metrics">
          <h2 id="ds-metrics" className="text-h2">
            Metriky a skóre
          </h2>
          <Grid cols={3} className="mt-4">
            <MetricCard
              title="Cash flow (demo)"
              value={formatCzk(2400, { signed: true })}
              tone="positive"
              quality="estimated"
              explanation="Měsíční nájem minus náklady a splátka — podle zadaných předpokladů."
              source="Demonstrační výpočet"
            />
            <MetricCard
              title="Cash flow (demo)"
              value={formatCzk(-3250, { signed: true })}
              tone="negative"
              quality="estimated"
              explanation="Záporný výsledek je zvýrazněn textem i znaménkem."
              source="Demonstrační výpočet"
            />
            <MajetioScore
              score={72}
              categories={[
                { label: "Hodnota", value: 70 },
                { label: "Výnos", value: 68 },
                { label: "Lokalita", value: 80 },
                { label: "Riziko", value: null },
              ]}
            />
          </Grid>
          <div className="mt-4">
            <MajetioScore score={null} />
          </div>
        </Section>

        <Section className="py-0" aria-labelledby="ds-property">
          <h2 id="ds-property" className="text-h2">
            Property card
          </h2>
          <Grid cols={2} className="mt-4">
            <PropertyCard
              property={{
                href: "/nemovitosti/demo-byt",
                title: "Ukázkový byt 3+kk (demo)",
                location: "Demonstrační lokalita — velmi dlouhý název ulice a města",
                disposition: "3+kk",
                areaSqm: 78,
                priceCzk: 6_500_000,
                pricePerSqmCzk: 83_333,
                grossYieldPct: 4.8,
                cashFlowMonthlyCzk: 2400,
                majetioScore: 72,
                dataQuality: "estimated",
                risk: "medium",
                isDemo: true,
              }}
            />
            <PropertyCard
              property={{
                href: "/nemovitosti/demo-dum",
                title: "Ukázkový dům k rekonstrukci (demo)",
                location: "Demonstrační lokalita",
                disposition: "5+1",
                areaSqm: 160,
                priceCzk: 12_400_000,
                pricePerSqmCzk: 77_500,
                grossYieldPct: -1.2,
                cashFlowMonthlyCzk: -4100,
                majetioScore: 48,
                dataQuality: "incomplete",
                risk: "high",
                isDemo: true,
              }}
            />
          </Grid>
        </Section>

        <Section className="py-0" aria-labelledby="ds-forms">
          <h2 id="ds-forms" className="text-h2">
            Formuláře
          </h2>
          <Card className="mt-4 max-w-xl">
            <FormDemo />
          </Card>
        </Section>

        <Section className="py-0" aria-labelledby="ds-table">
          <h2 id="ds-table" className="text-h2">
            Tabulka
          </h2>
          <div className="mt-4">
            <FinancialTable
              caption="Porovnání demo nemovitostí"
              headers={["Nemovitost", "Cena", "Výnos", "Cash flow"]}
              rows={[
                {
                  id: "1",
                  highlight: "best",
                  cells: [
                    "Demo A",
                    formatCzk(5_900_000),
                    formatPercentPoints(5.2, { signed: true }),
                    formatCzk(3100, { signed: true }),
                  ],
                },
                {
                  id: "2",
                  cells: [
                    "Demo B",
                    formatCzk(6_500_000),
                    formatPercentPoints(4.8, { signed: true }),
                    formatCzk(2400, { signed: true }),
                  ],
                },
                {
                  id: "3",
                  highlight: "worst",
                  cells: [
                    "Demo C",
                    formatCzk(7_200_000),
                    formatPercentPoints(2.1, { signed: true }),
                    formatCzk(-1800, { signed: true }),
                  ],
                },
              ]}
            />
          </div>
        </Section>

        <Section className="py-0" aria-labelledby="ds-charts">
          <h2 id="ds-charts" className="text-h2">
            Grafy
          </h2>
          <Grid cols={2} className="mt-4">
            <LineChart
              title="Historie ceny (demo)"
              summary="Ilustrativní linie cen od roku 2022 do 2025."
              unit="Kč"
              period="2022–2025"
              source="Demonstrační data"
              data={DEMO_CHART}
            />
            <BarChart
              title="Porovnání výnosů (demo)"
              summary="Ilustrativní sloupcový graf výnosů."
              source="Demonstrační data"
              data={[
                { label: "A", value: 5.2 },
                { label: "B", value: 4.8 },
                { label: "C", value: 2.1 },
              ]}
            />
          </Grid>
        </Section>

        <Section className="py-0" aria-labelledby="ds-feedback">
          <h2 id="ds-feedback" className="text-h2">
            Stavy
          </h2>
          <Stack className="mt-4" gap="md">
            <InlineAlert tone="success" title="Objednávka přijata">
              Kompletní analýza je ve zpracování. Výsledky najdete v účtu.
            </InlineAlert>
            <LoadingSkeleton />
            <Spinner label="Načítání analýzy" />
            <EmptyState
              title="Zatím nemáte uložené žádné nemovitosti"
              description="Uložte nabídku a vraťte se k ní později."
              action={<Button variant="secondary">Procházet nemovitosti</Button>}
            />
            <ErrorState />
          </Stack>
        </Section>

        <Section className="py-0" aria-labelledby="ds-overlays">
          <h2 id="ds-overlays" className="text-h2">
            Dialog a tabs
          </h2>
          <div className="mt-4 space-y-6">
            <DialogDemo />
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Přehled</TabsTrigger>
                <TabsTrigger value="risk">Rizika</TabsTrigger>
                <TabsTrigger value="method">Metodika</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">Základní přehled metriky (demo).</TabsContent>
              <TabsContent value="risk">Rizika nejsou skrytá konverzí (demo).</TabsContent>
              <TabsContent value="method">Metodika bude doplněna ve Fázi 3.</TabsContent>
            </Tabs>
          </div>
        </Section>

        <Section className="py-0" aria-labelledby="ds-calc">
          <h2 id="ds-calc" className="text-h2">
            Kalkulační layout
          </h2>
          <CalculatorShell
            className="mt-4"
            inputs={
              <Card>
                <h3 className="font-display text-lg">Předpoklady (demo)</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Vstupní panel — bez finální business logiky.
                </p>
                <Divider className="my-4" />
                <Field id="demo-price" label="Kupní cena">
                  <TextInput defaultValue="6 500 000" readOnly />
                </Field>
              </Card>
            }
            results={
              <Card>
                <h3 className="font-display text-lg">Výsledek (demo)</h3>
                <p className="mt-4 font-metric text-2xl font-semibold text-[var(--investment-positive)]">
                  {formatCzk(2400, { signed: true })} měsíčně
                </p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Ilustrativní výpočet — nejedná se o doporučení.
                </p>
              </Card>
            }
          />
        </Section>
      </Stack>
    </StandardPageLayout>
  );
}
