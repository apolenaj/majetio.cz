/**
 * SEO quality gate — canonical URLs, response headers, JSON-LD validation.
 *
 * Usage:
 *   BASE_URL=https://www.majetio.cz npx tsx scripts/seo/check-seo-quality.ts
 *   npm run test:seo-check
 *
 * Exit 0 = pass; non-zero = failures printed to stderr.
 */

const BASE =
  (process.env.BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3010").replace(
    /\/$/,
    "",
  );

const PUBLIC_PATHS = ["/", "/nemovitosti", "/cenik", "/metodika", "/o-nas"] as const;
const PRIVATE_PATHS = ["/ucet", "/admin", "/prihlaseni"] as const;

const FORBIDDEN_JSON_LD_KEYS = new Set([
  "aggregaterating",
  "reviewrating",
  "ratingvalue",
  "ratingcount",
  "reviewcount",
]);

type Finding = { level: "error" | "warn"; path: string; message: string };

function walkJsonLd(value: unknown, path: string, findings: Finding[]): void {
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkJsonLd(v, `${path}[${i}]`, findings));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_JSON_LD_KEYS.has(k.toLowerCase())) {
        findings.push({
          level: "error",
          path,
          message: `Forbidden JSON-LD key "${k}" (no fake AggregateRating)`,
        });
      }
      walkJsonLd(v, `${path}.${k}`, findings);
    }
  }
}

function extractCanonical(html: string): string | null {
  const m = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
  ) ?? html.match(
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
  );
  return m?.[1] ?? null;
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      blocks.push({ __parseError: true, raw: raw.slice(0, 120) });
    }
  }
  return blocks;
}

function hasNoIndex(html: string, headers: Headers): boolean {
  const robotsMeta = /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i.exec(
    html,
  );
  const metaContent = robotsMeta?.[1]?.toLowerCase() ?? "";
  const headerRobots = (headers.get("x-robots-tag") ?? "").toLowerCase();
  return (
    metaContent.includes("noindex") ||
    headerRobots.includes("noindex")
  );
}

async function checkPublicPath(path: string, findings: Finding[]): Promise<void> {
  const url = `${BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow" });
  } catch (err) {
    findings.push({
      level: "error",
      path,
      message: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    });
    return;
  }

  if (!res.ok && res.status !== 304) {
    findings.push({
      level: "error",
      path,
      message: `HTTP ${res.status}`,
    });
    return;
  }

  const html = await res.text();
  const canonical = extractCanonical(html);
  if (!canonical) {
    findings.push({
      level: "error",
      path,
      message: "Missing <link rel=\"canonical\">",
    });
  } else {
    try {
      const cUrl = new URL(canonical);
      if (cUrl.search) {
        findings.push({
          level: "error",
          path,
          message: `Canonical must not include query string: ${canonical}`,
        });
      }
      if (!cUrl.pathname.includes(path === "/" ? "" : path.replace(/\/$/, ""))) {
        findings.push({
          level: "warn",
          path,
          message: `Canonical pathname may not match page path: ${canonical}`,
        });
      }
    } catch {
      findings.push({
        level: "error",
        path,
        message: `Invalid canonical URL: ${canonical}`,
      });
    }
  }

  const jsonLd = extractJsonLdBlocks(html);
  for (const block of jsonLd) {
    if (
      block &&
      typeof block === "object" &&
      "__parseError" in (block as object)
    ) {
      findings.push({
        level: "error",
        path,
        message: "Invalid JSON-LD script (parse error)",
      });
      continue;
    }
    walkJsonLd(block, path, findings);
  }
}

async function checkPrivatePath(path: string, findings: Finding[]): Promise<void> {
  const url = `${BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { redirect: "manual" });
  } catch (err) {
    findings.push({
      level: "warn",
      path,
      message: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    });
    return;
  }

  const cache = (res.headers.get("cache-control") ?? "").toLowerCase();
  // After redirect, final response may vary; check intermediate or login page.
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") ?? "";
    if (!/prihlaseni|login|forbidden/i.test(location) && path.startsWith("/ucet")) {
      findings.push({
        level: "warn",
        path,
        message: `Unexpected redirect target: ${location}`,
      });
    }
    return;
  }

  const html = await res.text();
  if (!hasNoIndex(html, res.headers) && path !== "/prihlaseni") {
    // Auth pages should be noindex; account may redirect before HTML.
    findings.push({
      level: "warn",
      path,
      message: "Expected noindex on private/auth surface",
    });
  }

  if (cache && !/no-store|private|no-cache/.test(cache) && path.startsWith("/ucet")) {
    findings.push({
      level: "error",
      path,
      message: `Private path Cache-Control too permissive: ${cache}`,
    });
  }
}

async function main(): Promise<void> {
  const findings: Finding[] = [];
  console.log(`SEO quality check against ${BASE}`);

  for (const path of PUBLIC_PATHS) {
    await checkPublicPath(path, findings);
  }
  for (const path of PRIVATE_PATHS) {
    await checkPrivatePath(path, findings);
  }

  const errors = findings.filter((f) => f.level === "error");
  const warns = findings.filter((f) => f.level === "warn");

  for (const f of findings) {
    const line = `[${f.level.toUpperCase()}] ${f.path}: ${f.message}`;
    if (f.level === "error") console.error(line);
    else console.warn(line);
  }

  console.log(
    `Done. ${errors.length} error(s), ${warns.length} warning(s).`,
  );
  if (errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
