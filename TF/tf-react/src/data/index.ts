import { CityCoordinates } from '../types';

// Import city coordinates (extracted from original app)
import cityData from './cityCoordinates.json';

export const cityCoordinates: CityCoordinates = cityData;

/**
 * Get coordinates for a city, with fallback
 */
export function getCityCoordinates(city: string): { lat: number; lng: number } | null {
  if (!city) return null;
  
  // Try exact match first
  if (cityCoordinates[city]) {
    return cityCoordinates[city];
  }
  
  // Try case-insensitive match
  const lowerCity = city.toLowerCase();
  for (const [key, coords] of Object.entries(cityCoordinates)) {
    if (key.toLowerCase() === lowerCity) {
      return coords;
    }
  }
  
  // Try partial match
  for (const [key, coords] of Object.entries(cityCoordinates)) {
    if (key.toLowerCase().includes(lowerCity) || lowerCity.includes(key.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
}
