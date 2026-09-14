/**
 * Transactional e-mail templates — HTML + text.
 * Never include financial amounts, passwords, or full profile dumps in the body.
 */

export type EmailTemplate = {
  subject: string;
  text: string;
  html: string;
};

function layout(title: string, bodyHtml: string, bodyText: string): EmailTemplate {
  const subject = title;
  const text = `${title}\n\n${bodyText}\n\n—\nMajetio.cz\nTento e-mail je transakční. Neobsahuje nabídky ani citlivé finanční údaje.`;
  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#12202e;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px 24px;border:1px solid #e2e8f0;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#5b6b7c;">Majetio</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${escapeHtml(title)}</h1>
              ${bodyHtml}
              <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#5b6b7c;">
                Tento e-mail je transakční. Neobsahuje marketingové nabídky ani citlivé finanční údaje z vašeho pasu.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cta(href: string, label: string): string {
  return `<p style="margin:20px 0;">
  <a href="${escapeHtml(href)}" style="display:inline-block;background:#0f3d3e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
    ${escapeHtml(label)}
  </a>
</p>
<p style="margin:0;font-size:12px;color:#5b6b7c;word-break:break-all;">Pokud tlačítko nefunguje, zkopírujte odkaz:<br />${escapeHtml(href)}</p>`;
}

export function passwordResetEmail(resetUrl: string): EmailTemplate {
  return layout(
    "Obnovení hesla k účtu Majetio",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Požádali jste o obnovení hesla. Odkaz platí omezenou dobu. Pokud jste o to nežádali, e-mail ignorujte.</p>
     ${cta(resetUrl, "Nastavit nové heslo")}`,
    `Požádali jste o obnovení hesla. Otevřete odkaz (platí omezenou dobu):\n${resetUrl}\n\nPokud jste o to nežádali, e-mail ignorujte.`,
  );
}

export function emailChangeConfirmEmail(confirmUrl: string): EmailTemplate {
  return layout(
    "Potvrzení změny e-mailu",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Potvrďte novou e-mailovou adresu k účtu Majetio. Do potvrzení zůstává aktivní původní adresa.</p>
     ${cta(confirmUrl, "Potvrdit změnu e-mailu")}`,
    `Potvrďte změnu e-mailu otevřením odkazu:\n${confirmUrl}\n\nDo potvrzení zůstává aktivní původní adresa.`,
  );
}

export function welcomeEmail(accountUrl: string): EmailTemplate {
  return layout(
    "Vítejte v Majetio",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Účet je připravený. Dokončete krátké nastavení preferencí — bez citlivých údajů jako rodné číslo nebo adresa bydliště.</p>
     ${cta(accountUrl, "Pokračovat do účtu")}`,
    `Účet je připravený. Pokračujte na: ${accountUrl}`,
  );
}

export function mortgageLeadStatusUpdatedEmail(input: {
  statusLabel: string;
  previousStatusLabel?: string;
  detailUrl: string;
}): EmailTemplate {
  const changeLine = input.previousStatusLabel
    ? `Stav financování se změnil z „${input.previousStatusLabel}“ na „${input.statusLabel}“.`
    : `Aktuální stav financování: „${input.statusLabel}“.`;

  return layout(
    "Stav financování byl aktualizován",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${escapeHtml(changeLine)}</p>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Podrobnosti a další krok najdete ve svém účtu. V tomto e-mailu neuvádíme finanční částky ani jiné citlivé údaje.</p>
     ${cta(input.detailUrl, "Zobrazit stav financování")}`,
    `${changeLine}\n\nPodrobnosti najdete ve svém účtu:\n${input.detailUrl}\n\nV tomto e-mailu neuvádíme finanční částky ani jiné citlivé údaje.`,
  );
}

/** Dev/helper: log template without sending (no provider wired yet). */
export function logEmailInDev(template: EmailTemplate, toHint = "user"): void {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[email:dev] to=${toHint} subject=${template.subject}`);
  console.info(`[email:dev] text=\n${template.text}`);
}
