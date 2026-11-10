"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { fetchGooglePlace, searchGooglePlaces, type PlaceSuggestion } from "@/features/restaurant/google-places-api";
import type { LatLng } from "./center-pin-map";

export interface GooglePlace {
  placeId: string;
  name: string;
  formattedAddress?: string;
  location?: LatLng;
}

interface GooglePlaceSearchProps {
  onSelect: (place: GooglePlace) => void;
  /** Proposé en bas des résultats quand l'établissement est introuvable. */
  onNotListed?: () => void;
  /** Les suggestions sont orientées autour de ce point (lu au montage). */
  near?: LatLng;
  autoFocus?: boolean;
}

type Status = "idle" | "loading" | "done" | "error";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

/** Nom d'une suggestion, avec la partie tapée en gras. */
function Highlighted({ suggestion }: { suggestion: PlaceSuggestion }) {
  const { mainText: text, mainTextMatches: matches } = suggestion;
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const { startOffset, endOffset } of matches) {
    if (startOffset > last) parts.push(text.slice(last, startOffset));
    parts.push(
      <span key={startOffset} className="font-semibold">
        {text.slice(startOffset, endOffset)}
      </span>,
    );
    last = endOffset;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

/** Recherche d'un établissement référencé sur Google, via l'API (la clé Google reste côté serveur). */
export function GooglePlaceSearch({ onSelect, onNotListed, near, autoFocus }: GooglePlaceSearchProps) {
  const listId = useId();
  const [query, setQuery]             = useState("");
  const [predictions, setPredictions] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus]           = useState<Status>("idle");
  const [open, setOpen]               = useState(false);
  const [active, setActive]           = useState(-1);
  const [selecting, setSelecting]     = useState(false);

  const initialNear = useRef(near);
  const timer       = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requestId   = useRef(0);
  // Une session regroupe les frappes et la sélection finale en une seule facturation Google
  const session     = useRef<string | null>(null);

  useEffect(() => {
    const t = timer;
    return () => clearTimeout(t.current);
  }, []);

  const hasQuery = query.trim().length >= MIN_CHARS;

  function search(value: string) {
    setQuery(value);
    setActive(-1);
    clearTimeout(timer.current);

    const input = value.trim();
    const id = ++requestId.current;
    if (input.length < MIN_CHARS) {
      setPredictions([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setOpen(true);
    timer.current = setTimeout(async () => {
      try {
        session.current ??= crypto.randomUUID();
        const center = initialNear.current;
        const suggestions = await searchGooglePlaces({
          input,
          sessionToken: session.current,
          latitude: center?.lat,
          longitude: center?.lng,
        });
        if (id !== requestId.current) return; // une frappe plus récente a pris le relais
        setPredictions(suggestions);
        setStatus("done");
      } catch {
        if (id === requestId.current) setStatus("error");
      }
    }, DEBOUNCE_MS);
  }

  async function select(suggestion: PlaceSuggestion) {
    setOpen(false);
    setQuery(suggestion.mainText);
    setSelecting(true);
    try {
      const place = await fetchGooglePlace(suggestion.placeId, session.current ?? undefined);
      session.current = null; // session close après la sélection
      onSelect({
        placeId: place.placeId,
        name: place.name || suggestion.mainText,
        formattedAddress: place.formattedAddress,
        location:
          place.latitude != null && place.longitude != null
            ? { lat: place.latitude, lng: place.longitude }
            : undefined,
      });
    } catch {
      setStatus("error");
      setOpen(true);
    } finally {
      setSelecting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % predictions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? predictions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(predictions[Math.max(active, 0)]);
    }
  }

  const busy = status === "loading" || selecting;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        role="combobox"
        aria-expanded={open && hasQuery}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        onChange={(e) => search(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => hasQuery && setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder="Rechercher votre établissement sur Google…"
        className="h-9 bg-background pl-8 pr-8 text-sm"
      />
      <span className="absolute right-2.5 top-1/2 flex -translate-y-1/2">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            aria-label="Effacer la recherche"
            onClick={() => search("")}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </span>

      {open && hasQuery && (
        // mousedown empêché : un clic dans la liste ne fait pas perdre le focus au champ
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-[1100] mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {predictions.length > 0 ? (
            <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
              {predictions.map((p, i) => (
                <li
                  key={p.placeId}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => select(p)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5",
                    i === active && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">
                      <Highlighted suggestion={p} />
                    </span>
                    {p.secondaryText && (
                      <span className="block truncate text-xs text-muted-foreground">{p.secondaryText}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : status === "loading" ? (
            <div className="space-y-1 p-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-1.5">
                  <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-3/5 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : status === "error" ? (
            <p className="px-3 py-3 text-xs text-destructive">La recherche Google est indisponible pour le moment.</p>
          ) : (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              Aucun établissement trouvé pour « {query.trim()} ».
            </p>
          )}

          <div className="flex items-center justify-between gap-2 border-t bg-muted/40 px-3 py-1.5">
            {onNotListed ? (
              <button
                type="button"
                onClick={onNotListed}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Mon établissement n&apos;est pas sur Google
              </button>
            ) : (
              <span />
            )}
            {/* Attribution exigée par Google quand les résultats ne s'affichent pas sur une carte Google */}
            <span className="text-[11px] font-medium text-muted-foreground">Google Maps</span>
          </div>
        </div>
      )}
    </div>
  );
}
