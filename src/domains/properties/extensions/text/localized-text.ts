/**
 * Localized property text with translation provenance (Rule 190–192).
 * Keep original language text; translations are additive.
 * AI translations MUST set machineGenerated = true.
 */

export const PROPERTY_TEXT_FIELDS = [
  "title",
  "description",
  "address_label",
  "project_name",
  "developer_name",
  "community_name",
] as const;

export type PropertyTextField = (typeof PROPERTY_TEXT_FIELDS)[number];

export const TRANSLATION_SOURCES = [
  /** Source language text as published by provider / seller. */
  "ORIGINAL",
  /** Human translator / editor. */
  "HUMAN",
  /** LLM / MT — must set machineGenerated. */
  "MACHINE_GENERATED",
] as const;

export type TranslationSource = (typeof TRANSLATION_SOURCES)[number];

export type LocalizedPropertyText = {
  field: PropertyTextField;
  /** BCP 47 of the original string. */
  originalLocale: string;
  originalText: string;
  /** Optional translation locale (may equal originalLocale). */
  translatedLocale?: string | null;
  translatedText?: string | null;
  translationSource: TranslationSource;
  /**
   * True when translatedText (or any non-original rewrite) came from AI/MT.
   * Required when translationSource === MACHINE_GENERATED.
   */
  machineGenerated: boolean;
};

export type LocalizedPropertyTextInput = Omit<
  LocalizedPropertyText,
  "machineGenerated"
> & {
  machineGenerated?: boolean;
};

export class LocalizedTextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalizedTextError";
  }
}

/**
 * Normalize a localized text record.
 * Rejects MACHINE_GENERATED without machineGenerated flag.
 */
export function createLocalizedPropertyText(
  input: LocalizedPropertyTextInput,
): LocalizedPropertyText {
  if (!input.originalText?.trim()) {
    throw new LocalizedTextError("originalText is required.");
  }
  if (!(PROPERTY_TEXT_FIELDS as readonly string[]).includes(input.field)) {
    throw new LocalizedTextError(`Unknown text field: ${input.field}`);
  }
  if (!(TRANSLATION_SOURCES as readonly string[]).includes(input.translationSource)) {
    throw new LocalizedTextError(
      `Unknown translationSource: ${input.translationSource}`,
    );
  }

  const machineGenerated =
    input.translationSource === "MACHINE_GENERATED"
      ? true
      : Boolean(input.machineGenerated);

  if (
    input.translationSource === "MACHINE_GENERATED" &&
    input.machineGenerated === false
  ) {
    throw new LocalizedTextError(
      "MACHINE_GENERATED translations must set machineGenerated=true.",
    );
  }

  if (
    input.translatedText?.trim() &&
    input.translationSource === "MACHINE_GENERATED" &&
    !machineGenerated
  ) {
    throw new LocalizedTextError(
      "AI/MT translations require machineGenerated=true.",
    );
  }

  return {
    field: input.field,
    originalLocale: input.originalLocale.trim(),
    originalText: input.originalText.trim(),
    translatedLocale: input.translatedLocale?.trim() || null,
    translatedText: input.translatedText?.trim() || null,
    translationSource: input.translationSource,
    machineGenerated,
  };
}

/** Prefer human/original display; never silently promote machine text as authoritative. */
export function pickDisplayText(
  texts: readonly LocalizedPropertyText[],
  field: PropertyTextField,
  preferredLocale: string,
): { text: string; machineGenerated: boolean; locale: string } | null {
  const candidates = texts.filter((t) => t.field === field);
  if (candidates.length === 0) return null;

  const exactTranslated = candidates.find(
    (t) =>
      t.translatedLocale === preferredLocale &&
      t.translatedText &&
      t.translationSource === "HUMAN",
  );
  if (exactTranslated?.translatedText) {
    return {
      text: exactTranslated.translatedText,
      machineGenerated: false,
      locale: preferredLocale,
    };
  }

  const machine = candidates.find(
    (t) =>
      t.translatedLocale === preferredLocale &&
      t.translatedText &&
      t.machineGenerated,
  );
  if (machine?.translatedText) {
    return {
      text: machine.translatedText,
      machineGenerated: true,
      locale: preferredLocale,
    };
  }

  const original = candidates.find((t) => t.translationSource === "ORIGINAL")
    ?? candidates[0]!;
  return {
    text: original.originalText,
    machineGenerated: false,
    locale: original.originalLocale,
  };
}
