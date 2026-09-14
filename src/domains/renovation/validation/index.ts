/**
 * Domain validation stubs for renovation inputs (Prompt 1/5).
 */

export type RenovationValidationIssue = {
  code: string;
  message: string;
  /** Which concept boundary failed, when applicable. */
  concept?: "condition" | "scope" | "costs" | "arv" | "timeline" | "offer";
};

export type ValidationService = {
  /**
   * Validate that callers do not smuggle cost into ARV fields, etc.
   * Stub always returns ok.
   */
  validateScaffold(input: unknown): {
    ok: boolean;
    issues: RenovationValidationIssue[];
  };
};

export function createValidationService(): ValidationService {
  return {
    validateScaffold() {
      return { ok: true, issues: [] };
    },
  };
}
