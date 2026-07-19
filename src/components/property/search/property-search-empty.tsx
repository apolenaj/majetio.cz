import { EmptyState } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import {
  buildPropertySearchHref,
  type PropertyUrlFilterState,
} from "@/domains/properties/search/url-state";

export function PropertySearchEmptyState({
  state,
  relaxedCount,
}: {
  state: PropertyUrlFilterState;
  /** How many listings appear if cena-do is raised ~25%. */
  relaxedCount?: number | null;
}) {
  const clearHref = "/nemovitosti";
  const relaxedHref =
    state.cenaDo != null
      ? buildPropertySearchHref({
          ...state,
          cenaDo: Math.round(state.cenaDo * 1.25),
          stranka: 1,
        })
      : null;

  return (
    <EmptyState
      title="Nenašli jsme žádnou nemovitost"
      description="Zkuste upravit lokalitu, cenu nebo dispozici — případně smažte aktivní filtry."
      action={
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href={clearHref} variant="secondary">
            Vymazat všechny filtry
          </ButtonLink>
          {relaxedHref && relaxedCount != null && relaxedCount > 0 ? (
            <ButtonLink href={relaxedHref} variant="primary">
              Zvýšením rozpočtu získáte {relaxedCount}{" "}
              {relaxedCount === 1
                ? "nabídku"
                : relaxedCount >= 2 && relaxedCount <= 4
                  ? "nabídky"
                  : "nabídek"}
            </ButtonLink>
          ) : null}
        </div>
      }
    />
  );
}
