/**
 * Demo property / valuation / location content gate (Prompt 20.6 / L-06).
 * Production fail-closed unless ALLOW_DEMO_PROPERTY_CONTENT=true (staging hatch).
 */

export function isDemoPropertyContentAllowed(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (
    env.ALLOW_DEMO_PROPERTY_CONTENT === "true" ||
    env.ALLOW_DEMO_PROPERTY_CONTENT === "1"
  ) {
    return true;
  }
  const productionLike =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  return !productionLike;
}
