import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
  width = "marketing",
}: {
  className?: string;
  children: React.ReactNode;
  width?: "marketing" | "dashboard" | "form" | "article" | "full";
}) {
  const widthClass = {
    marketing: "max-w-7xl",
    dashboard: "max-w-7xl",
    form: "max-w-xl",
    article: "max-w-2xl",
    full: "max-w-none",
  }[width];

  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widthClass, className)}>
      {children}
    </div>
  );
}
