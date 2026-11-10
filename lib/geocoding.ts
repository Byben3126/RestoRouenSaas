// Géocodeur inverse gratuit de l'IGN (Base Adresse Nationale) : sans clé, CORS ouvert, France uniquement.
const REVERSE_URL = "https://data.geopf.fr/geocodage/reverse";

type ReverseResponse = {
  features: { properties: { name?: string; postcode?: string; city?: string; label?: string } }[];
};

/** Adresse lisible la plus proche d'un point (ex : "2 Place du General de Gaulle, 76000 Rouen"), ou undefined si introuvable. */
export async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng), index: "address", limit: "1" });
    const res = await fetch(`${REVERSE_URL}?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return undefined;

    const { features } = (await res.json()) as ReverseResponse;
    const p = features[0]?.properties;
    if (!p) return undefined;
    if (!p.postcode || !p.city) return p.label;
    return p.name && p.name !== p.city ? `${p.name}, ${p.postcode} ${p.city}` : `${p.postcode} ${p.city}`;
  } catch {
    // Une adresse manquante ne doit jamais bloquer l'enregistrement.
    return undefined;
  }
}
