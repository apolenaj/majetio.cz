"use client";

import * as React from "react";

import { Checkbox, RadioGroup, Select, Switch } from "@/components/forms/controls";
import { Field, TextArea, TextInput } from "@/components/forms/field";
import { CurrencyInput, PercentageInput } from "@/components/forms/inputs";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/layout-primitives";

export function FormDemo() {
  const [price, setPrice] = React.useState<number | null>(6_500_000);
  const [yieldPct, setYieldPct] = React.useState<number | null>(4.8);
  const [strategy, setStrategy] = React.useState("rent");
  const [notify, setNotify] = React.useState(true);

  return (
    <Stack gap="md">
      <Field
        id="demo-email"
        label="E-mail"
        required
        helperText="Použijeme jen pro účet — bez spamu."
      >
        <TextInput type="email" placeholder="jan.novak@email.cz" />
      </Field>

      <Field
        id="demo-currency"
        label="Kupní cena"
        required
        helperText="Zadejte celé koruny. Desetinná čárka je povolená."
      >
        <CurrencyInput value={price} onValueChange={setPrice} />
      </Field>

      <Field id="demo-yield" label="Očekávaný hrubý výnos" optional>
        <PercentageInput value={yieldPct} onValueChange={setYieldPct} />
      </Field>

      <Field id="demo-city" label="Město">
        <Select defaultValue="praha">
          <option value="praha">Praha</option>
          <option value="brno">Brno</option>
          <option value="ostrava">Ostrava</option>
        </Select>
      </Field>

      <Field id="demo-notes" label="Poznámka" optional>
        <TextArea placeholder="Např. plánovaná rekonstrukce koupelny" />
      </Field>

      <RadioGroup
        name="strategy"
        legend="Strategie"
        value={strategy}
        onChange={setStrategy}
        options={[
          { value: "live", label: "Vlastní bydlení" },
          { value: "rent", label: "Dlouhodobý pronájem" },
          { value: "flip", label: "Flip" },
        ]}
      />

      <Checkbox
        label="Souhlasím se zpracováním údajů pro analýzu"
        description="Bez souhlasu nelze analýzu uložit k účtu."
      />

      <Switch label="E-mailové upozornění na změnu ceny" checked={notify} onCheckedChange={setNotify} />

      <Field
        id="demo-error"
        label="Plocha"
        error="Hodnotu upravte na číslo vyšší než nula."
      >
        <TextInput defaultValue="0" invalid />
      </Field>

      <Button type="button" variant="secondary">
        Uložit předpoklady (demo)
      </Button>
    </Stack>
  );
}
