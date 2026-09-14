"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Columns2,
  ExternalLink,
  ListFilter,
  MessageSquare,
  Star,
  Trash2,
} from "lucide-react";

import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { Field, Label, TextArea } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { AlertDialog, Dialog, DialogContent } from "@/components/overlays/dialog";
import { PropertyCard } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { GuestFavouritesMergePrompt } from "@/components/favourites/guest-favourites-merge-prompt";
import { comparisonConfig } from "@/config/comparison";
import {
  archiveFavouriteAction,
  listFavouritesAction,
  moveToShortlistAction,
  removeFavouriteAction,
  unarchiveFavouriteAction,
  updateFavouriteNoteAction,
  updateFavouriteStatusAction,
} from "@/domains/favourites/server/actions";
import {
  FAVOURITE_REJECTION_REASON_LABELS_CS,
  FAVOURITE_REJECTION_REASONS,
  FAVOURITE_STATUS_LABELS_CS,
  type FavouriteRejectionReasonValue,
  type FavouriteStatusValue,
} from "@/domains/favourites/status";
import type {
  FavouriteCollectionDto,
  FavouriteListItemDto,
} from "@/domains/favourites/types";
import type { FavouriteListSort } from "@/domains/favourites/service/sort-favourites";
import {
  addCompareItems,
  toggleCompareItem,
  type CompareTrayItem,
} from "@/domains/properties/search/compare-tray";
import { formatCzk, formatDateTime, formatPercentPoints } from "@/lib/format";
import { cn } from "@/lib/utils";

type FilterTab =
  | "all"
  | "saved"
  | "viewing"
  | "shortlist"
  | "rejected"
  | "archived";

type Counts = {
  all: number;
  considering: number;
  viewing: number;
  shortlist: number;
  rejected: number;
  archived: number;
};

function statusForTab(tab: FilterTab): FavouriteStatusValue | undefined {
  if (tab === "saved") return "CONSIDERING";
  if (tab === "viewing") return "VIEWING";
  if (tab === "shortlist") return "FAVORITE";
  if (tab === "rejected") return "REJECTED";
  return undefined;
}

function toCompareItem(item: FavouriteListItemDto): CompareTrayItem {
  return {
    id: item.property.id,
    slug: item.property.slug,
    title: item.property.title,
    href: item.property.href,
    priceCzk: item.property.askingPrice ?? undefined,
    location: item.property.location,
  };
}

function PriceChange({ item }: { item: FavouriteListItemDto }) {
  const { askingPrice, priceChangeCzk, priceChangePct } = item.property;
  if (askingPrice == null) {
    return <span className="text-[var(--text-muted)]">Cena neuvedena</span>;
  }
  if (priceChangeCzk == null || priceChangePct == null) {
    return <span>{formatCzk(askingPrice)}</span>;
  }
  if (priceChangeCzk === 0) {
    return (
      <span>
        {formatCzk(askingPrice)}{" "}
        <span className="text-[var(--text-muted)]">(bez změny)</span>
      </span>
    );
  }
  const up = priceChangeCzk > 0;
  return (
    <span>
      {formatCzk(askingPrice)}{" "}
      <span
        className={
          up ? "text-[var(--status-error)]" : "text-[var(--status-success)]"
        }
      >
        ({up ? "+" : ""}
        {formatCzk(priceChangeCzk)} ·{" "}
        {formatPercentPoints(priceChangePct, {
          signed: true,
          maximumFractionDigits: 1,
        })}
        )
      </span>
    </span>
  );
}

export function FavouritesWorkspace({
  initialItems,
  initialPage = 1,
  initialHasMore = false,
  initialTotal = 0,
  initialCounts,
  initialCollections = [],
  initialSort = "recently_saved",
}: {
  initialItems: FavouriteListItemDto[];
  initialPage?: number;
  initialHasMore?: boolean;
  initialTotal?: number;
  initialCounts: Counts;
  initialCollections?: FavouriteCollectionDto[];
  initialSort?: FavouriteListSort;
}) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [page, setPage] = React.useState(initialPage);
  const [hasMore, setHasMore] = React.useState(initialHasMore);
  const [total, setTotal] = React.useState(initialTotal);
  const [counts, setCounts] = React.useState(initialCounts);
  const [collections] = React.useState(initialCollections);
  const [tab, setTab] = React.useState<FilterTab>("all");
  const [sort, setSort] = React.useState<FavouriteListSort>(initialSort);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [loadingList, setLoadingList] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [noteItem, setNoteItem] = React.useState<FavouriteListItemDto | null>(
    null,
  );
  const [noteValue, setNoteValue] = React.useState("");
  const [confirmRemove, setConfirmRemove] = React.useState<{
    mode: "single" | "bulk";
    ids: string[];
  } | null>(null);
  const [confirmMove, setConfirmMove] = React.useState(false);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [rejectItem, setRejectItem] = React.useState<FavouriteListItemDto | null>(
    null,
  );
  const [rejectReason, setRejectReason] = React.useState<
    FavouriteRejectionReasonValue | ""
  >("");

  React.useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setHasMore(initialHasMore);
    setTotal(initialTotal);
    setCounts(initialCounts);
  }, [
    initialItems,
    initialPage,
    initialHasMore,
    initialTotal,
    initialCounts,
  ]);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function reloadList(opts: {
    tab: FilterTab;
    sort: FavouriteListSort;
    page?: number;
    append?: boolean;
  }) {
    setLoadingList(true);
    setError(null);
    const nextPage = opts.page ?? 1;
    const result = await listFavouritesAction({
      status: statusForTab(opts.tab),
      page: nextPage,
      sort: opts.sort,
      archivedOnly: opts.tab === "archived",
      includeArchived: opts.tab === "archived" ? true : undefined,
    });
    setLoadingList(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((prev) =>
      opts.append ? [...prev, ...result.items] : result.items,
    );
    setPage(result.page);
    setHasMore(result.hasMore);
    setTotal(result.total);
    setCounts(result.counts);
    setSelected(new Set());
  }

  async function onTabChange(next: FilterTab) {
    setTab(next);
    await reloadList({ tab: next, sort, page: 1 });
  }

  async function onSortChange(next: FavouriteListSort) {
    setSort(next);
    await reloadList({ tab, sort: next, page: 1 });
  }

  async function loadMore() {
    if (!hasMore || loadingList) return;
    await reloadList({ tab, sort, page: page + 1, append: true });
  }

  const showFirstSaveEmpty = tab === "all" && counts.all === 0;
  const allVisibleSelected =
    items.length > 0 && items.every((i) => selected.has(i.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  }

  async function executeRemove(ids: string[]) {
    setBulkBusy(true);
    setError(null);
    const prev = items;
    setItems((list) => list.filter((x) => !ids.includes(x.id)));
    setSelected(new Set());
    let failed: string | null = null;
    for (const id of ids) {
      const result = await removeFavouriteAction({ favouriteId: id });
      if (!result.ok) {
        failed = result.error;
        break;
      }
    }
    setBulkBusy(false);
    if (failed) {
      setItems(prev);
      setError(failed);
      return;
    }
    setToast(ids.length > 1 ? `Odebráno ${ids.length} položek` : "Odebráno z uložených");
    await reloadList({ tab, sort, page: 1 });
    router.refresh();
  }

  async function executeMoveToFavorite(ids: string[]) {
    setBulkBusy(true);
    setError(null);
    let failed: string | null = null;
    for (const id of ids) {
      const result = await updateFavouriteStatusAction({
        favouriteId: id,
        status: "FAVORITE",
      });
      if (!result.ok) {
        failed = result.error;
        break;
      }
    }
    setBulkBusy(false);
    setSelected(new Set());
    if (failed) {
      setError(failed);
      return;
    }
    setToast(
      ids.length > 1
        ? `${ids.length} položek přesunuto mezi Favority`
        : "Označeno jako Favorit",
    );
    await reloadList({ tab, sort, page: 1 });
    router.refresh();
  }

  async function onSetStatus(
    item: FavouriteListItemDto,
    status: FavouriteStatusValue,
    rejectionReason?: FavouriteRejectionReasonValue | null,
  ) {
    setBusyId(item.id);
    setError(null);
    const result = await updateFavouriteStatusAction({
      favouriteId: item.id,
      status,
      rejectionReason: rejectionReason ?? null,
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToast(`Stav: ${FAVOURITE_STATUS_LABELS_CS[status]}`);
    setRejectItem(null);
    setRejectReason("");
    await reloadList({ tab, sort, page: 1 });
    router.refresh();
  }

  async function onShortlist(item: FavouriteListItemDto) {
    if (item.status === "FAVORITE") {
      setToast("Už je favorit");
      return;
    }
    setBusyId(item.id);
    setError(null);
    const result = await moveToShortlistAction({ favouriteId: item.id });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToast("Označeno jako Favorit");
    await reloadList({ tab, sort, page: 1 });
    router.refresh();
  }

  async function onArchive(item: FavouriteListItemDto) {
    setBusyId(item.id);
    setError(null);
    const result = item.archivedAt
      ? await unarchiveFavouriteAction({ favouriteId: item.id })
      : await archiveFavouriteAction({ favouriteId: item.id });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToast(item.archivedAt ? "Obnoveno z archivu" : "Archivováno");
    await reloadList({ tab, sort, page: 1 });
    router.refresh();
  }

  function onCompare(item: FavouriteListItemDto) {
    const result = toggleCompareItem(toCompareItem(item));
    if (!result.ok) {
      setToast(comparisonConfig.trayFullMessageCs);
      return;
    }
    setToast(result.added ? "Přidáno do porovnání" : "Odebráno z porovnání");
  }

  function onBulkCompare() {
    const chosen = items.filter((i) => selected.has(i.id));
    const result = addCompareItems(chosen.map(toCompareItem));
    if (result.added === 0 && result.full) {
      setToast(comparisonConfig.trayFullMessageCs);
      return;
    }
    if (result.full && result.added > 0) {
      setToast(
        `Přidáno ${result.added}. Limit ${comparisonConfig.maxProperties} — ${comparisonConfig.trayFullMessageCs}.`,
      );
      return;
    }
    setToast(
      result.added > 0
        ? `Přidáno do porovnání: ${result.added}`
        : "Vybrané už jsou v porovnání",
    );
  }

  function openNote(item: FavouriteListItemDto) {
    setNoteItem(item);
    setNoteValue(item.note ?? "");
  }

  async function saveNote() {
    if (!noteItem) return;
    setBusyId(noteItem.id);
    setError(null);
    const result = await updateFavouriteNoteAction({
      favouriteId: noteItem.id,
      note: noteValue,
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems((list) =>
      list.map((x) =>
        x.id === noteItem.id ? { ...x, note: noteValue.trim() || null } : x,
      ),
    );
    setNoteItem(null);
    setToast("Poznámka uložena");
    router.refresh();
  }

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "Vše", count: counts.all },
    { id: "saved", label: "Zvažuji", count: counts.considering },
    { id: "viewing", label: "Prohlídka", count: counts.viewing },
    { id: "shortlist", label: "Favorit", count: counts.shortlist },
    { id: "rejected", label: "Vyřazeno", count: counts.rejected },
    { id: "archived", label: "Archiv", count: counts.archived },
  ];

  const selectedCount = selected.size;
  const inactiveNeedsArchive = (item: FavouriteListItemDto) =>
    !item.archivedAt &&
    (item.listingLifecycle.kind === "inactive" ||
      item.listingLifecycle.kind === "sold");

  return (
    <div className="space-y-6">
      <GuestFavouritesMergePrompt />

      {error ? (
        <InlineAlert tone="error" title="Akce se nezdařila">
          {error}
        </InlineAlert>
      ) : null}

      {collections.length > 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Kolekce:{" "}
          {collections.map((c) => `${c.name} (${c.itemCount})`).join(" · ")}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div
          className="flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Filtr uložených"
        >
          <ListFilter className="size-4 text-[var(--text-muted)]" aria-hidden />
          {tabs.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={tab === t.id ? "secondary" : "outline"}
              role="tab"
              aria-selected={tab === t.id}
              disabled={loadingList}
              onClick={() => void onTabChange(t.id)}
            >
              {t.label}
              <span className="ml-1.5 text-[var(--text-muted)]">({t.count})</span>
            </Button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <Label htmlFor="favourites-sort">Řazení</Label>
          <Select
            id="favourites-sort"
            value={sort}
            onChange={(e) =>
              void onSortChange(e.target.value as FavouriteListSort)
            }
            aria-label="Řazení oblíbených"
            disabled={loadingList}
          >
            <option value="recently_saved">Nedávno uložené</option>
            <option value="activity">Podle aktivity</option>
            <option value="price_asc">Cena: od nejnižší</option>
            <option value="price_desc">Cena: od nejvyšší</option>
            <option value="price_drop">Největší pokles ceny</option>
            <option value="match">Podle shody / skóre</option>
            <option value="status">Podle stavu</option>
          </Select>
        </div>
      </div>

      {items.length === 0 && !loadingList ? (
        <EmptyState
          title={
            tab === "shortlist"
              ? "Zatím nemáte užší výběr"
              : tab === "archived"
                ? "Archiv je prázdný"
                : showFirstSaveEmpty
                  ? "Začněte uložením první nemovitosti"
                  : "V tomto filtru nic není"
          }
          description={
            tab === "shortlist"
              ? "Přesuňte vážně zvažované nabídky mezi Favority."
              : tab === "archived"
                ? "Prodané nebo neaktivní nabídky můžete archivovat — zůstanou v historii."
                : showFirstSaveEmpty
                  ? "Uložte tip z katalogu — zůstanou tady s cenou, stavem a možností porovnání."
                  : "Zkuste jiný filtr nebo uložte další nabídku."
          }
          action={
            <ButtonLink href="/nemovitosti" variant="secondary">
              Procházet nemovitosti
            </ButtonLink>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                className="size-4 rounded border-[var(--border-default)]"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                aria-label="Vybrat všechny viditelné"
              />
              Vybrat vše ({items.length}
              {total > items.length ? ` / ${total}` : ""})
            </label>
          </div>

          {selectedCount > 0 ? (
            <div
              className="sticky top-2 z-[20] flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-overlay)]"
              role="toolbar"
              aria-label="Hromadné akce"
            >
              <p className="mr-auto text-sm font-medium text-[var(--text-primary)]">
                Vybráno: {selectedCount}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bulkBusy}
                onClick={onBulkCompare}
                leftIcon={<Columns2 className="size-3.5" aria-hidden />}
              >
                Přidat do porovnání
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={bulkBusy}
                onClick={() => setConfirmMove(true)}
                leftIcon={<Star className="size-3.5" aria-hidden />}
              >
                Přesunout mezi Favority
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={bulkBusy}
                onClick={() =>
                  setConfirmRemove({
                    mode: "bulk",
                    ids: [...selected],
                  })
                }
                leftIcon={<Trash2 className="size-3.5" aria-hidden />}
              >
                Odebrat
              </Button>
            </div>
          ) : null}

          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <li key={item.id} className="flex flex-col gap-3">
                  <div
                    className={cn(
                      "relative rounded-[var(--radius-md)]",
                      isSelected && "ring-2 ring-[var(--border-focus)]",
                    )}
                  >
                    <label className="absolute top-3 left-3 z-[2] flex items-center gap-2 rounded bg-[var(--surface-primary)]/95 px-2 py-1 text-xs shadow-sm">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-[var(--border-default)]"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        aria-label={`Vybrat ${item.property.title}`}
                      />
                      Vybrat
                    </label>
                    <PropertyCard
                      property={{
                        id: item.property.id,
                        slug: item.property.slug,
                        href: item.property.href,
                        title: item.property.title,
                        location: item.property.location,
                        disposition: item.property.layout ?? undefined,
                        areaSqm: item.property.usableArea ?? undefined,
                        priceCzk: item.property.askingPrice ?? undefined,
                        imageUrl: item.property.imageUrl ?? undefined,
                        isDemo: item.property.isDemo,
                      }}
                      isFavourite
                    />
                  </div>

                  <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          item.status === "FAVORITE"
                            ? "premium"
                            : item.status === "REJECTED"
                              ? "neutral"
                              : "info"
                        }
                      >
                        {item.statusLabel}
                      </Badge>
                      {item.listingLifecycle.label ? (
                        <Badge tone="warning">{item.listingLifecycle.label}</Badge>
                      ) : null}
                      {item.archivedAt ? (
                        <Badge tone="neutral">Archivováno</Badge>
                      ) : null}
                      {item.folder || item.collectionName ? (
                        <span className="text-[var(--text-muted)]">
                          {item.collectionName ?? item.folder}
                        </span>
                      ) : null}
                      {item.rejectionReasonLabel ? (
                        <span className="text-xs text-[var(--text-muted)]">
                          Důvod: {item.rejectionReasonLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[var(--text-secondary)]">
                      <PriceChange item={item} />
                    </p>
                    {item.matchScore != null ? (
                      <p className="text-xs text-[var(--text-muted)]">
                        Skóre shody: {Math.round(item.matchScore)}
                      </p>
                    ) : null}
                    <p className="text-xs text-[var(--text-muted)]">
                      Uloženo {formatDateTime(item.createdAt)}
                      {" · "}
                      Aktivita {formatDateTime(item.updatedAt)}
                    </p>
                    {item.note ? (
                      <p className="line-clamp-2 text-[var(--text-secondary)]">
                        {item.note}
                      </p>
                    ) : null}

                    {inactiveNeedsArchive(item) ? (
                      <InlineAlert
                        tone="warning"
                        title={item.listingLifecycle.label ?? "Nabídka není aktivní"}
                      >
                        Nemovitost zůstává uložená. Můžete ji archivovat, nebo
                        dál porovnávat.
                        <div className="mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busyId === item.id}
                            onClick={() => void onArchive(item)}
                            leftIcon={<Archive className="size-3.5" aria-hidden />}
                          >
                            Archivovat
                          </Button>
                        </div>
                      </InlineAlert>
                    ) : null}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <ButtonLink
                        href={item.property.href}
                        size="sm"
                        variant="outline"
                        className="inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                        Otevřít
                      </ButtonLink>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === item.id}
                        onClick={() => onCompare(item)}
                        leftIcon={<Columns2 className="size-3.5" aria-hidden />}
                      >
                        Porovnat
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === item.id}
                        onClick={() => openNote(item)}
                        leftIcon={
                          <MessageSquare className="size-3.5" aria-hidden />
                        }
                      >
                        Poznámka
                      </Button>
                      <Select
                        aria-label={`Stav ${item.property.title}`}
                        className="h-8 w-[8.5rem] text-xs"
                        value={item.status}
                        disabled={busyId === item.id}
                        onChange={(e) => {
                          const next = e.target.value as FavouriteStatusValue;
                          if (next === "REJECTED") {
                            setRejectItem(item);
                            setRejectReason("");
                            return;
                          }
                          void onSetStatus(item, next);
                        }}
                      >
                        <option value="CONSIDERING">
                          {FAVOURITE_STATUS_LABELS_CS.CONSIDERING}
                        </option>
                        <option value="VIEWING">
                          {FAVOURITE_STATUS_LABELS_CS.VIEWING}
                        </option>
                        <option value="FAVORITE">
                          {FAVOURITE_STATUS_LABELS_CS.FAVORITE}
                        </option>
                        <option value="REJECTED">
                          {FAVOURITE_STATUS_LABELS_CS.REJECTED}
                        </option>
                      </Select>
                      {item.status !== "FAVORITE" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busyId === item.id}
                          onClick={() => void onShortlist(item)}
                          leftIcon={<Star className="size-3.5" aria-hidden />}
                        >
                          Favorit
                        </Button>
                      ) : null}
                      {item.archivedAt ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === item.id}
                          onClick={() => void onArchive(item)}
                        >
                          Obnovit
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyId === item.id}
                        onClick={() =>
                          setConfirmRemove({ mode: "single", ids: [item.id] })
                        }
                        leftIcon={<Trash2 className="size-3.5" aria-hidden />}
                      >
                        Odebrat
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                loading={loadingList}
                onClick={() => void loadMore()}
              >
                Načíst další
              </Button>
            </div>
          ) : null}
        </>
      )}

      <p className="text-sm text-[var(--text-muted)]">
        Potřebujete porovnat více najednou?{" "}
        <Link href="/ucet/porovnani" className="underline underline-offset-2">
          Přejít na porovnání
        </Link>
      </p>

      <Dialog
        open={Boolean(noteItem)}
        onOpenChange={(open) => {
          if (!open) setNoteItem(null);
        }}
      >
        <DialogContent
          title="Poznámka k nemovitosti"
          description={noteItem?.property.title}
        >
          <Field id="favourite-note" label="Soukromá poznámka">
            <TextArea
              id="favourite-note"
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              maxLength={2000}
              rows={5}
            />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setNoteItem(null)}>
              Zrušit
            </Button>
            <Button
              type="button"
              loading={busyId === noteItem?.id}
              onClick={() => void saveNote()}
            >
              Uložit poznámku
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rejectItem)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectItem(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent
          title="Vyřadit z výběru?"
          description="Vyřazené nabídky se neobjeví jako top doporučení. Důvod je volitelný."
        >
          <Field id="reject-reason" label="Důvod (volitelně)">
            <Select
              id="reject-reason"
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(
                  e.target.value as FavouriteRejectionReasonValue | "",
                )
              }
            >
              <option value="">Bez důvodu</option>
              {FAVOURITE_REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {FAVOURITE_REJECTION_REASON_LABELS_CS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setRejectItem(null);
                setRejectReason("");
              }}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              loading={busyId === rejectItem?.id}
              onClick={() => {
                if (!rejectItem) return;
                void onSetStatus(
                  rejectItem,
                  "REJECTED",
                  rejectReason || null,
                );
              }}
            >
              Vyřadit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(confirmRemove)}
        onOpenChange={(open) => {
          if (!open) setConfirmRemove(null);
        }}
        title={
          confirmRemove?.mode === "bulk"
            ? `Odebrat ${confirmRemove.ids.length} nemovitostí?`
            : "Odebrat z oblíbených?"
        }
        description="Akci nelze vrátit. Nemovitost můžete znovu uložit z katalogu."
        confirmLabel="Odebrat"
        destructive
        onConfirm={() => {
          if (confirmRemove) void executeRemove(confirmRemove.ids);
        }}
      />

      <AlertDialog
        open={confirmMove}
        onOpenChange={setConfirmMove}
        title={`Přesunout ${selectedCount} položek mezi Favority?`}
        description="Označí vybrané nemovitosti jako Favorit ve vašem shortlistu."
        confirmLabel="Přesunout"
        onConfirm={() => {
          void executeMoveToFavorite([...selected]);
        }}
      />

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[40] max-w-sm -translate-x-1/2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-2 text-sm shadow-[var(--shadow-overlay)] lg:bottom-8"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
