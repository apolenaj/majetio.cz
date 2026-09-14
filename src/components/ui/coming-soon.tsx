import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";

export function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Container className="py-16 sm:py-20">
      <PageHeader title={title} description={description} />
      <InlineAlert tone="info" title="Připravujeme">
        Tato část se připravuje. Záměrně zde nejsou falešná tlačítka ani předstírané funkce.
      </InlineAlert>
    </Container>
  );
}
