"use client";

import dynamic from "next/dynamic";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Loader2, FileText, ImagePlus, MapPin, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LatLng } from "@/components/map/center-pin-map";
import { useMyRestaurant, useUpdateMyRestaurant } from "@/features/restaurant/hooks";
import { useOutlets, useCreateOutlet, useUpdateOutlet, useDeleteOutlet } from "@/features/restaurant/outlet-hooks";
import type { Outlet as OutletType } from "@/features/restaurant/outlet-api";
import { uploadMedia } from "@/features/media/api";
import type { components } from "@/types/api.generated";

type MediaDto = components["schemas"]["MediaDto"];

const CenterPinMap = dynamic(() => import("@/components/map/center-pin-map"), { ssr: false });
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE_MB     = 5;
const MAX_IMAGES      = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="md:col-span-2 space-y-4">{children}</div>
    </div>
  );
}

function FieldLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      {children}
    </Label>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

type GalleryItem =
  | { type: 'existing'; key: string; url: string; media: MediaDto }
  | { type: 'new';      key: string; url: string; file: File };

function makeExistingItem(m: MediaDto): GalleryItem {
  return { type: 'existing', key: m.id, url: m.url, media: m };
}

function GalleryUpload({ items, onChange }: {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}) {
  const [dropZoneDragging, setDropZoneDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  function processFiles(files: File[]) {
    const remaining = MAX_IMAGES - items.length;
    if (remaining <= 0) { toast.error(`Maximum ${MAX_IMAGES} images.`); return; }
    const valid = files.slice(0, remaining).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) { toast.error(`${f.name} : format non supporté.`); return false; }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { toast.error(`${f.name} : fichier trop lourd (max ${MAX_SIZE_MB} Mo).`); return false; }
      return true;
    });
    const newItems: GalleryItem[] = valid.map((f) => ({
      type: 'new', key: `${Date.now()}-${Math.random()}`, url: URL.createObjectURL(f), file: f,
    }));
    onChange([...items, ...newItems]);
  }

  function remove(key: string) {
    onChange(items.filter((i) => i.key !== key));
  }

  // ── drag to reorder ──
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDropTarget(index);
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDropTarget(null);
    if (dragIndex.current === null || dragIndex.current === index) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    dragIndex.current = null;
    onChange(next);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDropTarget(null);
  }

  // ── drop zone (files from OS) ──
  const onFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDropZoneDragging(false);
    if (e.dataTransfer.files.length) processFiles(Array.from(e.dataTransfer.files));
  }, [items]);

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((item, index) => (
            <div
              key={item.key}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border bg-muted/20 cursor-grab active:cursor-grabbing transition-all",
                dropTarget === index && dragIndex.current !== index && "ring-2 ring-primary scale-95",
                item.type === 'new' && "ring-2 ring-primary/40",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover pointer-events-none" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(item.key); }}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {items.length < MAX_IMAGES && (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/10 flex items-center justify-center hover:border-muted-foreground/40 hover:bg-muted/20 transition-all">
              <ImagePlus className="h-5 w-5 text-muted-foreground/40" />
            </button>
          )}
        </div>
      )}

      {items.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onFileDrop}
          onDragOver={(e) => { e.preventDefault(); setDropZoneDragging(true); }}
          onDragLeave={() => setDropZoneDragging(false)}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed h-36 cursor-pointer transition-all",
            dropZoneDragging ? "border-foreground/50 bg-muted/40" : "border-muted-foreground/25 bg-muted/10 hover:border-muted-foreground/40 hover:bg-muted/20",
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {dropZoneDragging ? "Déposez les images ici" : "Glissez vos photos ou cliquez pour parcourir"}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">PNG, JPG, WebP · Max {MAX_SIZE_MB} Mo · {items.length}/{MAX_IMAGES} photos</p>
        {items.length > 0 && items.length < MAX_IMAGES && (
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => inputRef.current?.click()}>
            <Upload className="h-3 w-3" />Ajouter des photos
          </Button>
        )}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(",")} multiple className="hidden"
        onChange={(e) => { if (e.target.files) processFiles(Array.from(e.target.files)); e.target.value = ""; }} />
    </div>
  );
}

// ─── Outlets ─────────────────────────────────────────────────────────────────

const DEFAULT_POSITION: LatLng = { lat: 49.4432, lng: 1.0993 };

function OutletCard({ outlet }: { outlet: OutletType }) {
  const { mutate: update, isPending: isSaving } = useUpdateOutlet();
  const { mutate: remove, isPending: isDeleting } = useDeleteOutlet();

  const [open, setOpen]   = useState(false);
  const [name, setName]   = useState(outlet.name);
  const [pos, setPos]     = useState<LatLng>({
    lat: outlet.latitude  ?? DEFAULT_POSITION.lat,
    lng: outlet.longitude ?? DEFAULT_POSITION.lng,
  });

  const isDirty = name !== outlet.name || pos.lat !== (outlet.latitude ?? DEFAULT_POSITION.lat) || pos.lng !== (outlet.longitude ?? DEFAULT_POSITION.lng);

  function handleSave() {
    update(
      { id: outlet.id, name, latitude: pos.lat, longitude: pos.lng },
      { onSuccess: () => toast.success("Point de vente mis à jour."), onError: () => toast.error("Une erreur est survenue.") },
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{outlet.name || "Sans nom"}</p>
          {outlet.formattedAddress && (
            <p className="text-xs text-muted-foreground truncate">{outlet.formattedAddress}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => remove(outlet.id, { onSuccess: () => toast.success("Point de vente supprimé.") })}
          disabled={isDeleting}
          className="text-muted-foreground hover:text-red-500 transition-colors p-1 disabled:opacity-40"
        >
          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nom du point de vente</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Centre-ville, Saint-Sever…"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Position</Label>
            <div className="rounded-lg overflow-hidden border h-52">
              <CenterPinMap initialPosition={pos} onPositionChange={setPos} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={!isDirty || isSaving || !name.trim()} onClick={handleSave} className="gap-1.5">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RestaurantPage() {
  const { data: restaurant, isLoading } = useMyRestaurant();
  const { mutateAsync: updateRestaurant, isPending: isSaving } = useUpdateMyRestaurant();
  const { data: outlets = [], isLoading: outletsLoading } = useOutlets();
  const { mutate: createOutlet, isPending: isCreating } = useCreateOutlet();

  const [name, setName]                 = useState('');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [initialized, setInitialized]   = useState(false);

  useEffect(() => {
    if (restaurant && !initialized) {
      setName(restaurant.name);
      setGalleryItems((restaurant.medias ?? []).map(makeExistingItem));
      setInitialized(true);
    }
  }, [restaurant, initialized]);

  const hasNewFiles   = galleryItems.some((i) => i.type === 'new');
  const mediasChanged = hasNewFiles || galleryItems.length !== (restaurant?.medias?.length ?? 0) ||
    galleryItems.some((item, idx) => item.type === 'existing' && item.media.id !== restaurant?.medias?.[idx]?.id);

  const isDirty = initialized && (
    name !== (restaurant?.name ?? '') ||
    mediasChanged
  );

  async function handleSave() {
    try {
      let mediaIds: string[] | undefined;

      if (mediasChanged) {
        const resolved = await Promise.all(
          galleryItems.map((item) =>
            item.type === 'existing'
              ? Promise.resolve(item.media.id)
              : uploadMedia(item.file).then((r) => r.mediaId),
          ),
        );
        mediaIds = resolved;
        setGalleryItems((prev) => prev.filter((item) => item.type === 'existing'));
      }

      const updated = await updateRestaurant({ name, mediaIds });
      if (updated?.medias) setGalleryItems(updated.medias.map(makeExistingItem));
      toast.success("Modifications enregistrées.");
    } catch {
      toast.error("Une erreur est survenue.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-xl font-semibold">Mon restaurant</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les informations et la présentation de votre établissement.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving || !name.trim()}
          size="sm"
          className="gap-2"
        >
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Enregistrer
        </Button>
      </div>

      <div className="space-y-6">

        {/* ── Identité ── */}
        <Section title="Identité" description="Nom affiché aux clients sur l'application.">
          <div className="space-y-1.5 max-w-sm">
            <FieldLabel icon={FileText}>Nom du restaurant</FieldLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Le nom de votre restaurant"
              className="h-9"
            />
          </div>
        </Section>

        <Separator />

        {/* ── Galerie ── */}
        <Section
          title="Galerie"
          description={`Photos de votre établissement visibles par les clients. Maximum ${MAX_IMAGES} images.`}
        >
          <GalleryUpload items={galleryItems} onChange={setGalleryItems} />
        </Section>

        <Separator />

        {/* ── Points de vente ── */}
        <Section
          title="Points de vente"
          description="Chaque point de vente apparaît comme un épingle distinct sur la carte de l'application mobile."
        >
          <div className="space-y-3">
            {outletsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : (
              outlets.map((outlet) => <OutletCard key={outlet.id} outlet={outlet} />)
            )}

            <button
              type="button"
              disabled={isCreating}
              onClick={() =>
                createOutlet(
                  { name: "Nouveau point de vente", latitude: DEFAULT_POSITION.lat, longitude: DEFAULT_POSITION.lng },
                  { onError: () => toast.error("Une erreur est survenue.") },
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 py-3 text-xs text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-all disabled:opacity-40"
            >
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Ajouter un point de vente
            </button>
          </div>
        </Section>

        <div className="pb-8" />

      </div>
    </div>
  );
}
