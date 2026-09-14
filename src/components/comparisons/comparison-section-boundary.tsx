"use client";

import * as React from "react";

import { InlineAlert } from "@/components/feedback/states";

/**
 * Isolates a section so one failing module does not crash the comparison page.
 */
export class ComparisonSectionBoundary extends React.Component<
  {
    title: string;
    children: React.ReactNode;
    fallbackDescription?: string;
  },
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error) {
    console.error("[comparison-section]", this.props.title, error);
  }

  override render() {
    if (this.state.error) {
      return (
        <InlineAlert tone="warning" title={`${this.props.title} není k dispozici`}>
          {this.props.fallbackDescription ??
            "Tato sekce selhala, zbytek porovnání funguje dál. Zkuste obnovit stránku později."}
        </InlineAlert>
      );
    }
    return this.props.children;
  }
}
