// Athletic record data types

export interface AthleteRecord {
  rank: number;
  time: string;
  timeSeconds: number;
  wind: string;
  name: string;
  country: string;
  birthDate: string;
  position: string;
  city: string;
  date: string;
  // Computed fields
  dateValue: number;  // Days since epoch for sorting
  ageValue: number;   // Age in days at time of performance
  ageYears: number;   // Age in years
}

export interface EventOption {
  code: string;
  label: string;
}

export interface CityCoordinates {
  [city: string]: {
    lat: number;
    lng: number;
  };
}

export interface HistogramBar {
  record: AthleteRecord;
  index: number;
  heightPercent: number;
}

export interface HighlightedRecord {
  recordId: number | null;
}

// API Response types (matches actual PHP API)
export interface ApiRecord {
  rank: string;
  time: string;
  wind?: string;
  athlete: string;
  country: string;
  dob: string;
  position: string;
  location: string;
  date: string;
}

export interface ApiResponse {
  success: boolean;
  count: number;
  fetched_at: string;
  records: ApiRecord[];
  error?: string;
}
