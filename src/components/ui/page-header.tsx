import { PageHeader as LayoutPageHeader } from "@/components/layout/page-layouts";

/** @deprecated Prefer importing from `@/components/layout/page-layouts` */
export function PageHeader(
  props: React.ComponentProps<typeof LayoutPageHeader>,
) {
  return <LayoutPageHeader {...props} />;
}
