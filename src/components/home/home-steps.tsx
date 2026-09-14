import { Container } from "@/components/ui/container";

const STEPS = [
  {
    step: "01",
    title: "Vyberete nemovitost",
    text: "Z nabídky nebo vlastní vstup — Majetio připraví kontext pro rozhodnutí.",
  },
  {
    step: "02",
    title: "Projdete analýzu",
    text: "Hodnota, výnosy, lokalita, rekonstrukce a rizika v jednom přehledu.",
  },
  {
    step: "03",
    title: "Rozhodnete se s jistotou",
    text: "Porovnání scénářů, doporučená nabídková cena a podpora při koupi.",
  },
] as const;

export function HomeSteps() {
  return (
    <section className="py-16 sm:py-20" aria-labelledby="steps-heading">
      <Container>
        <h2
          id="steps-heading"
          className="font-display text-2xl text-[var(--color-ink)] sm:text-3xl"
        >
          Tři kroky k rozhodnutí
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">
          Od výběru nemovitosti k podloženému rozhodnutí — bez zbytečného šumu.
        </p>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((item) => (
            <li key={item.step}>
              <p className="text-sm font-medium tracking-widest text-[var(--color-sand)]">
                {item.step}
              </p>
              <h3 className="mt-2 font-display text-xl text-[var(--color-ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {item.text}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
