/**
 * Public property detail presentation — distinguishes known values,
 * explicit absence, and missing verification. Never invents facts.
 */

export type FactKind = "boolean" | "text" | "number" | "legal" | "technical" | "optional";

export type FactStatus = "known" | "absent" | "verify" | "hidden";

export type ResolvedFact = {
  status: FactStatus;
  display: string | null;
};

export const VERIFY_LABEL = "Nutno ověřit";
export const ABSENT_LABEL = "Není";
export const YES_LABEL = "Ano";

/** Important fields always surface when unknown. */
const IMPORTANT_KINDS: FactKind[] = ["legal", "technical"];

export function resolveBooleanFact(value: boolean | null | undefined): ResolvedFact {
  if (value === true) return { status: "known", display: YES_LABEL };
  if (value === false) return { status: "absent", display: ABSENT_LABEL };
  return { status: "verify", display: VERIFY_LABEL };
}

export function resolveTextFact(
  value: string | number | null | undefined,
  kind: FactKind = "text",
): ResolvedFact {
  if (value == null) {
    if (kind === "optional") return { status: "hidden", display: null };
    if (IMPORTANT_KINDS.includes(kind) || kind === "text" || kind === "number") {
      return { status: "verify", display: VERIFY_LABEL };
    }
    return { status: "verify", display: VERIFY_LABEL };
  }
  if (typeof value === "string" && value.trim() === "") {
    return IMPORTANT_KINDS.includes(kind) || kind !== "optional"
      ? { status: "verify", display: VERIFY_LABEL }
      : { status: "hidden", display: null };
  }
  return { status: "known", display: String(value) };
}

export function resolveFeaturePresence(
  presence: "yes" | "no" | "unset",
  options?: { hideUnset?: boolean },
): ResolvedFact {
  if (presence === "yes") return { status: "known", display: YES_LABEL };
  if (presence === "no") return { status: "absent", display: ABSENT_LABEL };
  if (options?.hideUnset) return { status: "hidden", display: null };
  return { status: "verify", display: VERIFY_LABEL };
}

/** Legacy helper replacements — never return „Neuvedeno“. */
export function formatMissingPublic(kind: FactKind = "text"): string {
  if (kind === "optional") return VERIFY_LABEL;
  return VERIFY_LABEL;
}

export type VerifyItemStatus = "verified" | "check_required" | "issue" | "not_applicable";

export type VerifyItem = {
  id: string;
  label: string;
  status: VerifyItemStatus;
  tooltip: string;
};

export type VerifyGroup = {
  id: string;
  title: string;
  items: VerifyItem[];
};

export const DEFAULT_PRE_PURCHASE_CHECKS: VerifyGroup[] = [
  {
    id: "legal",
    title: "Právní",
    items: [
      {
        id: "ownership",
        label: "List vlastnictví",
        status: "check_required",
        tooltip: "Ověřte vlastníka, podíly a aktuální zápis v katastru.",
      },
      {
        id: "liens",
        label: "Zástavy a břemena",
        status: "check_required",
        tooltip: "Prověřte zástavní práva, věcná břemena a další omezení.",
      },
      {
        id: "execution",
        label: "Exekuce",
        status: "check_required",
        tooltip: "Ověřte případná omezení nebo exekuční řízení.",
      },
      {
        id: "access",
        label: "Přístup k nemovitosti",
        status: "check_required",
        tooltip: "Prověřte právní přístup a případná věcná břemena cesty.",
      },
    ],
  },
  {
    id: "svj",
    title: "SVJ",
    items: [
      {
        id: "svj-debt",
        label: "Dluhy SVJ",
        status: "check_required",
        tooltip: "Zjistěte, zda s jednotkou nebo vlastníkem nejsou spojeny neuhrazené závazky.",
      },
      {
        id: "repair-fund",
        label: "Fond oprav",
        status: "check_required",
        tooltip: "Prověřte výši příspěvků a stav dlouhodobé zálohy domu.",
      },
      {
        id: "minutes",
        label: "Zápisy ze schůzí",
        status: "check_required",
        tooltip: "Projděte rozhodnutí o opravách, investicích a pravidlech domu.",
      },
    ],
  },
  {
    id: "technical",
    title: "Technické",
    items: [
      {
        id: "electro",
        label: "Elektro",
        status: "check_required",
        tooltip: "Ověřte stav rozvodů a případnou nutnost rekonstrukce.",
      },
      {
        id: "water",
        label: "Voda a odpady",
        status: "check_required",
        tooltip: "Prověřte instalace, tlak a stav stoupaček.",
      },
      {
        id: "heating",
        label: "Topení",
        status: "check_required",
        tooltip: "Ověřte zdroj tepla, rozvody a náklady na provoz.",
      },
      {
        id: "moisture",
        label: "Vlhkost",
        status: "check_required",
        tooltip: "Prověřte stopy vlhkosti, plísně a hydroizolaci.",
      },
    ],
  },
  {
    id: "docs",
    title: "Dokumentace",
    items: [
      {
        id: "floorplan",
        label: "Půdorys",
        status: "check_required",
        tooltip: "Porovnejte skutečný stav s dokumentací jednotky.",
      },
      {
        id: "penb",
        label: "PENB",
        status: "check_required",
        tooltip: "Ověřte energetickou náročnost budovy.",
      },
      {
        id: "declaration",
        label: "Prohlášení vlastníka",
        status: "check_required",
        tooltip: "Ověřte vymezení jednotky a podíly na společných částech.",
      },
    ],
  },
];

export function summarizeVerifyGroups(groups: VerifyGroup[]) {
  let verified = 0;
  let checkRequired = 0;
  let issues = 0;
  for (const group of groups) {
    for (const item of group.items) {
      if (item.status === "verified") verified += 1;
      else if (item.status === "check_required") checkRequired += 1;
      else if (item.status === "issue") issues += 1;
    }
  }
  return { verified, checkRequired, issues };
}
