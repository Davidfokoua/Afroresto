/**
 * Geolocation & Proximity Calculation Utilities
 * For the Meituan-style Online Food Ordering Hub (AFRORESTO Food Market)
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPreset {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  country: string;
  coordinates: Coordinates;
}

// Popular predefined delivery drop-off zones in major African cities
export const POPULAR_LOCATION_PRESETS: LocationPreset[] = [
  // Yaoundé, Cameroun
  {
    id: 'yde_bastos',
    name: 'Bastos (Ambassades & Bureaux)',
    neighborhood: 'Bastos',
    city: 'Yaoundé',
    country: 'Cameroun',
    coordinates: { latitude: 3.8824, longitude: 11.5165 }
  },
  {
    id: 'yde_centre',
    name: 'Centre-Ville Commercial',
    neighborhood: 'Centre-Ville',
    city: 'Yaoundé',
    country: 'Cameroun',
    coordinates: { latitude: 3.8667, longitude: 11.5167 }
  },
  {
    id: 'yde_omnisports',
    name: 'Omnisports (Stade Ahmadou Ahidjo)',
    neighborhood: 'Omnisports',
    city: 'Yaoundé',
    country: 'Cameroun',
    coordinates: { latitude: 3.8785, longitude: 11.5372 }
  },
  {
    id: 'yde_mendong',
    name: 'Mendong & Simbock',
    neighborhood: 'Mendong',
    city: 'Yaoundé',
    country: 'Cameroun',
    coordinates: { latitude: 3.8420, longitude: 11.4880 }
  },

  // Douala, Cameroun
  {
    id: 'dla_akwa',
    name: 'Akwa (Boulevard de la Liberté)',
    neighborhood: 'Akwa',
    city: 'Douala',
    country: 'Cameroun',
    coordinates: { latitude: 4.0511, longitude: 9.7043 }
  },
  {
    id: 'dla_bonapriso',
    name: 'Bonapriso (Quartier Résidentiel & Banques)',
    neighborhood: 'Bonapriso',
    city: 'Douala',
    country: 'Cameroun',
    coordinates: { latitude: 4.0321, longitude: 9.6978 }
  },

  // Abidjan, Côte d'Ivoire
  {
    id: 'abj_plateau',
    name: 'Plateau (Cité Administrative & Tours)',
    neighborhood: 'Plateau',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    coordinates: { latitude: 5.3260, longitude: -4.0200 }
  },
  {
    id: 'abj_cocody',
    name: 'Cocody (Deux Plateaux & Vallon)',
    neighborhood: 'Cocody',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    coordinates: { latitude: 5.3540, longitude: -3.9920 }
  },
  {
    id: 'abj_zone4',
    name: 'Marcory (Zone 4 & Biétry)',
    neighborhood: 'Zone 4',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    coordinates: { latitude: 5.2930, longitude: -3.9850 }
  }
];

export const DEFAULT_CUSTOMER_LOCATION: LocationPreset = POPULAR_LOCATION_PRESETS[0];

/**
 * Calculates distance in kilometers between two GPS coordinates using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal
  return Math.round(distance * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance nicely (e.g. 850 m or 2.4 km)
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return '< 100 m';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Calculates estimated delivery time based on distance (cooking prep + courier transit)
 */
export function estimateDeliveryTime(
  distanceKm: number,
  basePrepMinutes: number = 20
): { minMinutes: number; maxMinutes: number; label: string } {
  // Estimated motorcycle transit time: ~3 minutes per km in dense city traffic
  const transitMinutes = Math.max(5, Math.round(distanceKm * 3.5));
  const min = Math.max(15, basePrepMinutes + transitMinutes - 5);
  const max = min + 12;

  return {
    minMinutes: min,
    maxMinutes: max,
    label: `${min}-${max} min`
  };
}

/**
 * Calculates delivery fee based on distance in FCFA
 */
export function calculateDeliveryFee(
  distanceKm: number,
  subtotal: number = 0,
  freeThreshold: number = 15000
): { fee: number; isFree: boolean; label: string } {
  if (freeThreshold > 0 && subtotal >= freeThreshold) {
    return { fee: 0, isFree: true, label: 'Livraison Offerte' };
  }

  let fee = 1000;
  if (distanceKm <= 1.5) {
    fee = 500;
  } else if (distanceKm <= 3.5) {
    fee = 1000;
  } else if (distanceKm <= 6) {
    fee = 1500;
  } else if (distanceKm <= 10) {
    fee = 2000;
  } else {
    fee = 2500;
  }

  return {
    fee,
    isFree: false,
    label: `${fee.toLocaleString()} FCFA`
  };
}

/**
 * Request real browser HTML5 Geolocation with graceful timeout and fallbacks
 */
export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => {
        console.warn('Geolocation permission or lookup notice:', err.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  });
}
