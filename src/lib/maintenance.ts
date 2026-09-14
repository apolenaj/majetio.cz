/**
 * Maintenance / chaos mode — env-driven for Edge + Node fail-closed.
 * Set MAINTENANCE_MODE=true to serve graceful 503 to public traffic.
 */

export function isMaintenanceMode(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const raw = (env.MAINTENANCE_MODE ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

/** Paths that must stay reachable during maintenance (health + admin login). */
export function isMaintenanceBypassPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/ready") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/prihlaseni") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/auth")
  );
}

export function maintenanceHtmlResponse(): string {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex"/>
  <title>Údržba · Majetio</title>
  <style>
    body{margin:0;font-family:system-ui,sans-serif;background:#0f1419;color:#e8eef4;
      display:flex;min-height:100vh;align-items:center;justify-content:center;padding:2rem}
    main{max-width:28rem;text-align:center}
    h1{font-size:1.75rem;font-weight:600;margin:0 0 .75rem}
    p{margin:0;line-height:1.5;color:#9aabbc;font-size:.95rem}
  </style>
</head>
<body>
  <main>
    <h1>Probíhá údržba</h1>
    <p>Majetio je dočasně nedostupné. Zkuste to prosím za chvíli. Platby a změny dat jsou pozastaveny.</p>
  </main>
</body>
</html>`;
}
