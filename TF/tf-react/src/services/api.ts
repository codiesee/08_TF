import { AthleteRecord, ApiResponse, ApiRecord } from '../types';

// API base URL - direct to PHP server (proxy not working reliably)
const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Fetch event data from the PHP API
 */
export async function fetchEventData(eventCode: string): Promise<AthleteRecord[]> {
  const response = await fetch(`${API_BASE_URL}/scraper.php?event=${eventCode}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch event data: ${response.statusText}`);
  }
  
  const data: ApiResponse = await response.json();
  
  if (data.error || !data.success) {
    throw new Error(data.error || 'Unknown error');
  }
  
  return data.records.map((record, index) => transformRecord(record, index));
}

/**
 * Parse time string to seconds
 */
function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length === 3) {
    // HH:MM:SS or H:MM:SS
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS
    const minutes = parseInt(parts[0], 10);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return parseFloat(timeStr) || 0;
}

/**
 * Parse date string to days since epoch
 */
function parseDateToDays(dateStr: string): number {
  if (!dateStr) return 0;
  
  // Date format: DD.MM.YYYY
  const parts = dateStr.split('.');
  if (parts.length !== 3) return 0;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  // Convert to days (approximate)
  return year * 12 * 30 + month * 30 + day;
}

/**
 * Calculate age at time of performance
 */
function calculateAge(birthDateStr: string, eventDateStr: string): { ageValue: number; ageYears: number } {
  const birthDays = parseDateToDays(birthDateStr);
  const eventDays = parseDateToDays(eventDateStr);
  
  const ageValue = eventDays - birthDays;
  const ageYears = Math.floor(ageValue / (12 * 30));
  
  return { ageValue, ageYears };
}

/**
 * Transform API record to internal format
 */
function transformRecord(apiRecord: ApiRecord, index: number): AthleteRecord {
  // DOB format from API: DD.MM.YY - need to convert to full year
  const dobParts = apiRecord.dob?.split('.') || [];
  let fullDob = apiRecord.dob || '';
  if (dobParts.length === 3 && dobParts[2].length === 2) {
    const year = parseInt(dobParts[2], 10);
    const fullYear = year > 30 ? 1900 + year : 2000 + year;
    fullDob = `${dobParts[0]}.${dobParts[1]}.${fullYear}`;
  }
  
  const { ageValue, ageYears } = calculateAge(fullDob, apiRecord.date);
  
  return {
    rank: parseInt(apiRecord.rank, 10) || index + 1,
    time: apiRecord.time,
    timeSeconds: parseTimeToSeconds(apiRecord.time),
    wind: apiRecord.wind || '',
    name: apiRecord.athlete,
    country: apiRecord.country,
    birthDate: fullDob,
    position: apiRecord.position,
    city: apiRecord.location,
    date: apiRecord.date,
    dateValue: parseDateToDays(apiRecord.date),
    ageValue,
    ageYears,
  };
}

/**
 * Get available events list
 */
export async function fetchEventsList(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/scraper.php?list`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch events list: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.available_events || [];
}
