import { EventOption } from '../types';

// API base URL - in development, we proxy to the PHP server
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const EVENTS: EventOption[] = [
  { code: 'mmara', label: "Men's Marathon" },
  { code: 'mhmara', label: "Men's Half Marathon" },
  { code: 'm10000', label: "Men's 10,000m" },
  { code: 'm_5000', label: "Men's 5,000m" },
  { code: 'm_3000', label: "Men's 3,000m" },
  { code: 'wmara', label: "Women's Marathon" },
  { code: 'whmara', label: "Women's Half Marathon" },
  { code: 'w10000', label: "Women's 10,000m" },
  { code: 'w_5000', label: "Women's 5,000m" },
  { code: 'w_3000', label: "Women's 3,000m" },
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
