"use client";

import {
  DEFAULT_PRE_PURCHASE_CHECKS,
  summarizeVerifyGroups,
  type VerifyGroup,
} from "@/domains/properties/presentation";

import { FactStatusMark, VerifyStatusLabel } from "./property-fact";

export function PrePurchaseChecklist({
  groups = DEFAULT_PRE_PURCHASE_CHECKS,
}: {
  groups?: VerifyGroup[];
}) {
  const summary = summarizeVerifyGroups(groups);

  return (
    <section className="pd-verify">
      <div className="pd-section-head">
        <h2>Co ověřit před koupí</h2>
        <p>
          Přehled důležitých právních, technických a provozních bodů, které
          doporučujeme prověřit před rozhodnutím.
        </p>
      </div>

      <div className="pd-verify-summary" aria-label="Souhrn ověření">
        <div>
          <span>Ověřeno</span>
          <strong>{summary.verified}</strong>
        </div>
        <div>
          <span>Nutno ověřit</span>
          <strong>{summary.checkRequired}</strong>
        </div>
        <div>
          <span>Rizika</span>
          <strong>{summary.issues}</strong>
        </div>
      </div>

      <div className="pd-verify-grid">
        {groups.map((group) => (
          <article key={group.id} className="pd-card">
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <span className="pd-verify-label">{item.label}</span>
                  <FactStatusMark
                    status={item.status}
                    label={VerifyStatusLabel(item.status)}
                    tooltip={item.tooltip}
                  />
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="pd-note">
        U položek označených jako „Nutno ověřit“ zatím nemáme potvrzený podklad.
      </p>
    </section>
  );
}
