/**
 * Tax plugin architecture (stub) — calculations remain pre-tax for now.
 */

export type TaxPluginContext = {
  baseCurrency: string;
  annualNoi: number | null;
  annualCashFlow: number | null;
  jurisdiction?: "CZ";
};

export type TaxPluginResult = {
  status: "not_applied" | "estimated" | "error";
  message: string;
  afterTaxCashFlow: number | null;
};

export interface TaxPlugin {
  readonly id: string;
  readonly version: string;
  apply(ctx: TaxPluginContext): TaxPluginResult;
}

/** Default: no tax computation — UI must show pre-tax disclaimer. */
export const nullTaxPlugin: TaxPlugin = {
  id: "null_tax",
  version: "1.0.0",
  apply() {
    return {
      status: "not_applied",
      message: "Výpočty jsou před zdaněním.",
      afterTaxCashFlow: null,
    };
  },
};

let activeTaxPlugin: TaxPlugin = nullTaxPlugin;

export function registerTaxPlugin(plugin: TaxPlugin): void {
  activeTaxPlugin = plugin;
}

export function getTaxPlugin(): TaxPlugin {
  return activeTaxPlugin;
}

export function applyTaxPlugin(ctx: TaxPluginContext): TaxPluginResult {
  return getTaxPlugin().apply(ctx);
}
