import { apiClient } from '@/lib/api-client';

// Places API (New) de Google, relayée telle quelle par l'API (réservée aux restaurateurs) :
// la clé Google reste côté serveur, le format des requêtes et réponses est celui de Google.

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  /** Parties de mainText correspondant à la saisie */
  mainTextMatches: { startOffset: number; endOffset: number }[];
  secondaryText?: string;
}

export interface PlaceDetails {
  placeId: string;
  name?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
}

export interface PlaceAutocompleteParams {
  input: string;
  sessionToken?: string;
  /** Oriente les suggestions autour de ce point */
  latitude?: number;
  longitude?: number;
}

// Réponses brutes de Google, limitées aux champs utilisés
interface GoogleText {
  text: string;
  matches?: { startOffset?: number; endOffset: number }[]; // startOffset absent quand il vaut 0
}
interface GoogleAutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      text: GoogleText;
      structuredFormat?: { mainText: GoogleText; secondaryText?: GoogleText };
    };
  }[];
}
interface GooglePlaceResponse {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
}

const PLACE_FIELDS = 'id,displayName,formattedAddress,location';
const BIAS_RADIUS_M = 20_000;

export async function searchGooglePlaces({
  input,
  sessionToken,
  latitude,
  longitude,
}: PlaceAutocompleteParams): Promise<PlaceSuggestion[]> {
  const { data } = await apiClient.post<GoogleAutocompleteResponse>('/google/places/autocomplete', {
    input,
    sessionToken,
    includedPrimaryTypes: ['establishment'],
    includedRegionCodes: ['fr'],
    languageCode: 'fr',
    ...(latitude != null &&
      longitude != null && {
        locationBias: { circle: { center: { latitude, longitude }, radius: BIAS_RADIUS_M } },
      }),
  });

  return (data.suggestions ?? []).flatMap(({ placePrediction: p }) => {
    if (!p) return [];
    const main = p.structuredFormat?.mainText ?? p.text;
    return {
      placeId: p.placeId,
      mainText: main.text,
      mainTextMatches: (main.matches ?? []).map(({ startOffset = 0, endOffset }) => ({ startOffset, endOffset })),
      secondaryText: p.structuredFormat?.secondaryText?.text,
    };
  });
}

export async function fetchGooglePlace(placeId: string, sessionToken?: string): Promise<PlaceDetails> {
  const { data } = await apiClient.get<GooglePlaceResponse>(`/google/places/${encodeURIComponent(placeId)}`, {
    params: { fields: PLACE_FIELDS, languageCode: 'fr', sessionToken },
  });

  return {
    placeId: data.id,
    name: data.displayName?.text,
    formattedAddress: data.formattedAddress,
    latitude: data.location?.latitude,
    longitude: data.location?.longitude,
  };
}
