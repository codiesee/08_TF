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
 * Compute histogram data for date-based histogram
 */
export function useDateHistogram(records: AthleteRecord[]): HistogramData {
  return useMemo(() => {
    if (records.length === 0) {
      return { bars: [], minValue: 0, maxValue: 0, valueRange: 0, labels: [] };
    }

    // Filter for reasonable dates: 1950-2030 (in days format)
    const MIN_DATE = 1950 * 12 * 30;
    const MAX_DATE = 2030 * 12 * 30;
    
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

    // Generate year labels
    const minYear = Math.floor(minDate / (12 * 30));
    const maxYear = Math.ceil(maxDate / (12 * 30));
    const yearStep = Math.ceil((maxYear - minYear) / 10) || 1;
    const labels: { value: number; position: number; label: string }[] = [];

    for (let year = minYear; year <= maxYear; year += yearStep) {
      const yearValue = year * (12 * 30);
      const position = ((yearValue - minDate) / dateRange) * 100;
      if (position >= 0 && position <= 100) {
        labels.push({
          value: year,
          position,
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

    // Filter for reasonable athlete ages: 10-70 years (in days: 3600 - 25200)
    const MIN_AGE_DAYS = 10 * 12 * 30;  // ~10 years
    const MAX_AGE_DAYS = 70 * 12 * 30;  // ~70 years
    
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

    // Generate age labels
    const minAgeYears = Math.floor(minAge / (12 * 30));
    const maxAgeYears = Math.ceil(maxAge / (12 * 30));
    const ageStep = Math.ceil((maxAgeYears - minAgeYears) / 10) || 1;
    const labels: { value: number; position: number; label: string }[] = [];

    for (let age = minAgeYears; age <= maxAgeYears; age += ageStep) {
      const ageValue = age * (12 * 30);
      const position = ((ageValue - minAge) / ageRange) * 100;
      if (position >= 0 && position <= 100) {
        labels.push({
          value: age,
          position,
          label: `${age}y`,
        });
      }
    }

    return { bars, minValue: minAge, maxValue: maxAge, valueRange: ageRange, labels };
  }, [records]);
}
