import type { Metadata } from "next";

/**
 * User-specific analysis routes — never index (Part 2/D).
 * Public calculator marketing pages stay outside this layout.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AnalysisToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
