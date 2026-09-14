import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  as?: "span" | "p";
};

/** Text wordmark using brand display font — preferred in UI next to BrandSymbol. */
export function Wordmark({ className, as: Tag = "span" }: WordmarkProps) {
  return (
    <Tag
      className={cn(
        "font-display text-[1.35em] leading-none tracking-tight",
        className,
      )}
    >
      Majetio
    </Tag>
  );
}
