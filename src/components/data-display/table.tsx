import { cn } from "@/lib/utils";

export function Table({
  className,
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-default)]">
      <table
        className={cn("w-full min-w-[36rem] border-collapse text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-[var(--background-secondary)] text-left text-[var(--text-label-m)] font-semibold text-[var(--text-secondary)]",
        className,
      )}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("bg-[var(--surface-primary)]", className)} {...props} />;
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-t border-[var(--border-default)]", className)}
      {...props}
    />
  );
}

export function TH({
  className,
  align = "left",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "sticky top-0 px-4 py-3 whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  align = "left",
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
  numeric?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-[var(--text-primary)]",
        (align === "right" || numeric) && "text-right",
        align === "center" && "text-center",
        numeric && "font-metric",
        className,
      )}
      {...props}
    />
  );
}

export function TableEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border-default)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
      {message}
    </div>
  );
}

export function FinancialTable({
  caption,
  headers,
  rows,
  className,
}: {
  caption: string;
  headers: string[];
  rows: { id: string; cells: React.ReactNode[]; highlight?: "best" | "worst" }[];
  className?: string;
}) {
  return (
    <Table className={className}>
      <caption className="sr-only">{caption}</caption>
      <THead>
        <TR>
          {headers.map((h, i) => (
            <TH key={h} align={i === 0 ? "left" : "right"}>
              {h}
            </TH>
          ))}
        </TR>
      </THead>
      <TBody>
        {rows.map((row) => (
          <TR
            key={row.id}
            className={cn(
              row.highlight === "best" && "bg-[color-mix(in_srgb,var(--status-success)_8%,white)]",
              row.highlight === "worst" && "bg-[color-mix(in_srgb,var(--status-error)_8%,white)]",
            )}
          >
            {row.cells.map((cell, i) => (
              <TD key={i} numeric={i > 0} align={i === 0 ? "left" : "right"}>
                {cell}
                {i === 0 && row.highlight === "best" ? (
                  <span className="ml-2 text-[var(--text-caption)] text-[var(--status-success)]">
                    (nejlepší)
                  </span>
                ) : null}
                {i === 0 && row.highlight === "worst" ? (
                  <span className="ml-2 text-[var(--text-caption)] text-[var(--status-error)]">
                    (nejhorší)
                  </span>
                ) : null}
              </TD>
            ))}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
