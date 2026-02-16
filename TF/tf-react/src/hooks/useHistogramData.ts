import { useMemo } from 'react';
import { AthleteRecord } from '../types';

interface HistogramData {
  bars: {
    record: AthleteRecord;
    index: number;
    heightPercent: number;
    leftPercent: number;
    value: number;
  }[];
  minValue: number;
  maxValue: number;
  valueRange: number;
  labels: { value: number; position: number; label: string }[];
}

/**
 * Compute histogram data for rank-based histogram (ordered by rank, height = time)
 */
export function useRankHistogram(records: AthleteRecord[]): HistogramData {
  return useMemo(() => {
    if (records.length === 0) {
      return { bars: [], minValue: 0, maxValue: 0, valueRange: 0, labels: [] };
    }

    const times = records.map(r => r.timeSeconds);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;

    const bars = records.map((record, index) => ({
      record,
      index,
      heightPercent: ((record.timeSeconds - minTime) / timeRange) * 100,
      leftPercent: (index / records.length) * 100,
      value: record.timeSeconds,
    }));

    // Generate labels for ranks
    const totalRecords = records.length;
    const step = Math.ceil(totalRecords / 10);
    const labels: { value: number; position: number; label: string }[] = [];
    
    for (let i = 0; i <= totalRecords; i += step) {
      const rank = i === 0 ? 1 : i;
      labels.push({
        value: rank,
        position: (rank / totalRecords) * 100,
        label: `#${rank}`,
      });
    }

    return { bars, minValue: minTime, maxValue: maxTime, valueRange: timeRange, labels };
  }, [records]);
}

/**
 * Helper to extract year from dateValue (days format: year*360 + month*30 + day)
 */
function dateValueToYear(dateValue: number): number {
  return Math.floor(dateValue / 360);
}

/**
 * Compute histogram data for date-based histogram
 */
export function useDateHistogram(records: AthleteRecord[]): HistogramData {
  return useMemo(() => {
    if (records.length === 0) {
      return { bars: [], minValue: 0, maxValue: 0, valueRange: 0, labels: [] };
    }

    // Filter for reasonable dates: 1950-2030
    const MIN_DATE = 1950 * 360;
    const MAX_DATE = 2030 * 360;
    
    const validRecords = records.filter(r => 
      r.dateValue > MIN_DATE && r.dateValue < MAX_DATE
    );
    
    if (validRecords.length === 0) {
      return { bars: [], minValue: 0, maxValue: 0, valueRange: 0, labels: [] };
    }

    const dates = validRecords.map(r => r.dateValue);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dateRange = maxDate - minDate || 1;

    const times = validRecords.map(r => r.timeSeconds);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;

    const bars = validRecords
      .map((record, index) => ({
        record,
        index,
        heightPercent: ((record.timeSeconds - minTime) / timeRange) * 100,
        leftPercent: ((record.dateValue - minDate) / dateRange) * 100,
        value: record.dateValue,
      }));

    // Generate year labels based on actual min/max years in data
    const minYear = dateValueToYear(minDate);
    const maxYear = dateValueToYear(maxDate);
    const yearSpan = maxYear - minYear;
    const yearStep = Math.max(1, Math.ceil(yearSpan / 8));
    const labels: { value: number; position: number; label: string }[] = [];

    // Round minYear down to nearest step
    const startYear = Math.floor(minYear / yearStep) * yearStep;
    
    for (let year = startYear; year <= maxYear + yearStep; year += yearStep) {
      const yearValue = year * 360;
      const position = ((yearValue - minDate) / dateRange) * 100;
      if (position >= -5 && position <= 105) {
        labels.push({
          value: year,
          position: Math.max(0, Math.min(100, position)),
          label: String(year),
        });
      }
    }

    return { bars, minValue: minDate, maxValue: maxDate, valueRange: dateRange, labels };
  }, [records]);
}

/**
 * Compute histogram data for age-based histogram
 */
export function useAgeHistogram(records: AthleteRecord[]): HistogramData {
  return useMemo(() => {
    if (records.length === 0) {
      return { bars: [], minValue: 0, maxValue: 0, valueRange: 0, labels: [] };
    }

    // Filter for reasonable athlete ages: 10-70 years (360 days per year)
    const MIN_AGE_DAYS = 10 * 360;
    const MAX_AGE_DAYS = 70 * 360;
    
    const validRecords = records.filter(r => 
      r.ageValue > MIN_AGE_DAYS && r.ageValue < MAX_AGE_DAYS
    );
    
    if (validRecords.length === 0) {
      return { bars: [], minValue: 0, maxValue: 0, valueRange: 0, labels: [] };
    }

    const ages = validRecords.map(r => r.ageValue);
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    const ageRange = maxAge - minAge || 1;

    const times = validRecords.map(r => r.timeSeconds);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;

    const bars = validRecords
      .map((record, index) => ({
        record,
        index,
        heightPercent: ((record.timeSeconds - minTime) / timeRange) * 100,
        leftPercent: ((record.ageValue - minAge) / ageRange) * 100,
        value: record.ageValue,
      }));

    // Generate age labels (360 days per year)
    const minAgeYears = Math.floor(minAge / 360);
    const maxAgeYears = Math.ceil(maxAge / 360);
    const ageStep = Math.max(1, Math.ceil((maxAgeYears - minAgeYears) / 8));
    const labels: { value: number; position: number; label: string }[] = [];

    const startAge = Math.floor(minAgeYears / ageStep) * ageStep;
    for (let age = startAge; age <= maxAgeYears + ageStep; age += ageStep) {
      const ageValue = age * 360;
      const position = ((ageValue - minAge) / ageRange) * 100;
      if (position >= -5 && position <= 105) {
        labels.push({
          value: age,
          position: Math.max(0, Math.min(100, position)),
          label: `${age}y`,
        });
      }
    }

    return { bars, minValue: minAge, maxValue: maxAge, valueRange: ageRange, labels };
  }, [records]);
}
