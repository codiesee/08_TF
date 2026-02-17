import { EventOption } from '../types';

// API base URL - in development, we proxy to the PHP server
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const EVENTS: EventOption[] = [
  // Sprints
  { code: 'm_100', label: "Men's 100m" },
  { code: 'm_200', label: "Men's 200m" },
  { code: 'm_400', label: "Men's 400m" },
  { code: 'm_110h', label: "Men's 110m Hurdles" },
  { code: 'm_400h', label: "Men's 400m Hurdles" },
  // Middle Distance
  { code: 'm_800', label: "Men's 800m" },
  { code: 'm_1500', label: "Men's 1500m" },
  { code: 'm_mile', label: "Men's Mile" },
  // Long Distance
  { code: 'm_3000', label: "Men's 3,000m" },
  { code: 'm3000h', label: "Men's 3,000m Steeplechase" },
  { code: 'm_5000', label: "Men's 5,000m" },
  { code: 'm10000', label: "Men's 10,000m" },
  { code: 'mhmara', label: "Men's Half Marathon" },
  { code: 'mmara', label: "Men's Marathon" },
  // Race Walks
  { code: 'm20kw', label: "Men's 20km Race Walk" },
  { code: 'm35kw', label: "Men's 35km Race Walk" },
  { code: 'm50kw', label: "Men's 50km Race Walk" },
  // Field Events - Jumps
  { code: 'mhigh', label: "Men's High Jump" },
  { code: 'mpole', label: "Men's Pole Vault" },
  { code: 'mlong', label: "Men's Long Jump" },
  { code: 'mtrip', label: "Men's Triple Jump" },
  // Field Events - Throws
  { code: 'mshot', label: "Men's Shot Put" },
  { code: 'mdisc', label: "Men's Discus" },
  { code: 'mhamm', label: "Men's Hammer Throw" },
  { code: 'mjave', label: "Men's Javelin" },
  // Combined Events
  { code: 'mdeca', label: "Men's Decathlon" },
  // Women's Events
  { code: 'w_3000', label: "Women's 3,000m" },
  { code: 'w_5000', label: "Women's 5,000m" },
  { code: 'w10000', label: "Women's 10,000m" },
  { code: 'whmara', label: "Women's Half Marathon" },
  { code: 'wmara', label: "Women's Marathon" },
];

// Map configuration
export const MAP_CENTER: [number, number] = [30, 0];
export const MAP_ZOOM = 2;
export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Histogram configuration
export const HISTOGRAM_HEIGHT = 200;
export const BAR_MIN_WIDTH = 0.3;

// Default cutoff for time filtering (in seconds)
export const DEFAULT_CUTOFF = 99999;
