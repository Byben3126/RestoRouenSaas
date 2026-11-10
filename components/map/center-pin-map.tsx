"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

interface CenterPinMapProps {
  initialPosition?: LatLng;
  zoom?: number;
  /** Recentre la carte (et donc l'épingle) à chaque nouvelle valeur. */
  focusPosition?: LatLng;
  onPositionChange?: (pos: LatLng) => void;
}

// ─── Map event hook ───────────────────────────────────────────────────────────

function MapEvents({ onMove }: { onMove: (pos: LatLng) => void }) {
  useMapEvents({
    moveend(e) {
      const { lat, lng } = e.target.getCenter();
      onMove({ lat, lng });
    },
  });
  return null;
}

function FocusOn({ position }: { position?: LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 17));
  }, [map, position]);
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CenterPinMap({
  initialPosition = { lat: 49.4432, lng: 1.0993 }, // Rouen par défaut
  zoom = 15,
  focusPosition,
  onPositionChange,
}: CenterPinMapProps) {
  const [pos, setPos] = useState<LatLng>(initialPosition);

  function handleMove(newPos: LatLng) {
    setPos(newPos);
    onPositionChange?.(newPos);
  }

  return (
    <div className="relative w-full h-full">

      {/* Leaflet map */}
      <MapContainer
        center={[initialPosition.lat, initialPosition.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents onMove={handleMove} />
        <FocusOn position={focusPosition} />
      </MapContainer>

      {/* Épingle fixe au centre — hors du contexte Leaflet */}
      <div
        className="absolute inset-0 pointer-events-none z-[1000] flex items-center justify-center"
      >
        <div className="flex flex-col items-center" style={{ transform: "translateY(-50%)" }}>
          {/* Pin SVG */}
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            <path d="M16 0C7.163 0 0 7.163 0 16C0 27 16 42 16 42C16 42 32 27 32 16C32 7.163 24.837 0 16 0Z" fill="#ef4444"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
          {/* Ombre au sol */}
          <div className="h-1.5 w-4 rounded-full bg-black/20 blur-[2px] -mt-1" />
        </div>
      </div>

      {/* Coordonnées affichées */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow text-xs font-mono text-muted-foreground pointer-events-none">
        {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
      </div>

    </div>
  );
}
