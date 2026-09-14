/**
 * Central XSS / rich-text sanitizer.
 * Default: strip to plain text. Rich HTML uses a strict tag/attr allowlist
 * (no scripts, no event handlers, no javascript: URLs).
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "ul",
  "ol",
  "li",
  "a",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "code",
  "pre",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "rel", "target"]),
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeHtmlForDisplay(value: string): string {
  return escapeHtml(value);
}

/**
 * Plain-text sanitize for notes, bios, titles — safe in React text nodes.
 */
export function sanitizePlainText(input: string, maxLength = 8_000): string {
  let text = input.normalize("NFC");
  text = text.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, " ");
  text = text.replace(/javascript:/gi, "");
  text = text.replace(/on\w+\s*=/gi, "");
  text = text.replace(CONTROL_CHARS, "");
  text = text.replace(/\s+/g, " ").trim();
  return text.slice(0, maxLength);
}

function isSafeHref(href: string): boolean {
  const t = href.trim().toLowerCase();
  if (t.startsWith("https://") || t.startsWith("mailto:")) return true;
  if (t.startsWith("/") && !t.startsWith("//")) return true;
  if (t.startsWith("#")) return true;
  return false;
}

/**
 * Strict allowlist HTML sanitizer for CMS / rich text.
 * Prefer React text nodes; use this only when HTML rendering is required.
 */
export function sanitizeRichHtml(input: string, maxLength = 50_000): string {
  const clipped = input.normalize("NFC").slice(0, maxLength);
  // Drop dangerous blocks entirely
  let html = clipped
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  html = html.replace(
    /<\/?([a-zA-Z0-9]+)([^>]*)>/g,
    (full, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      const closing = full.startsWith("</");
      if (!ALLOWED_TAGS.has(tag)) {
        return "";
      }
      if (closing) return `</${tag}>`;
      if (tag === "br") return "<br />";

      const allowed = ALLOWED_ATTRS[tag];
      if (!allowed || allowed.size === 0) {
        return `<${tag}>`;
      }

      const attrs: string[] = [];
      const attrRe =
        /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
      let m: RegExpExecArray | null;
      while ((m = attrRe.exec(rawAttrs)) !== null) {
        const nameRaw = m[1];
        if (nameRaw == null) continue;
        const name = nameRaw.toLowerCase();
        if (!allowed.has(name)) continue;
        if (name.startsWith("on")) continue;
        const value = m[2] ?? m[3] ?? m[4] ?? "";
        if (name === "href" && !isSafeHref(value)) continue;
        if (name === "target" && value !== "_blank") continue;
        attrs.push(`${name}="${escapeHtml(value)}"`);
      }
      if (tag === "a") {
        attrs.push('rel="noopener noreferrer nofollow"');
      }
      return attrs.length ? `<${tag} ${attrs.join(" ")}>` : `<${tag}>`;
    },
  );

  return html.replace(CONTROL_CHARS, "");
}

/** Alias for CRM / favourites migration. */
export const sanitizeCrmPlainText = sanitizePlainText;
