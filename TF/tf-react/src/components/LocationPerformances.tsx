import React, { memo, useMemo, useState } from 'react';
import { AthleteRecord } from '../types';
import { useHighlight, useHighlightedRecordId } from '../context/AppContext';
import './LocationPerformances.css';

type SortOrder = 'time' | 'date';

interface LocationPerformancesProps {
  records: AthleteRecord[];
}

export const LocationPerformances: React.FC<LocationPerformancesProps> = memo(({ records }) => {
  const highlightedRecordId = useHighlightedRecordId();
  const { highlight } = useHighlight();
  const [sortOrder, setSortOrder] = useState<SortOrder>('time');

  // Find the highlighted record to get its city
  const highlightedRecord = useMemo(() => {
    if (highlightedRecordId === null) return null;
    return records.find(r => r.id === highlightedRecordId) || null;
  }, [records, highlightedRecordId]);

  // Get all performances at the same location, sorted by selected order
  const locationPerformances = useMemo(() => {
    if (!highlightedRecord?.city) return [];
    
    const filtered = records.filter(r => r.city === highlightedRecord.city);
    
    if (sortOrder === 'time') {
      return filtered.sort((a, b) => a.timeSeconds - b.timeSeconds);
    } else {
      return filtered.sort((a, b) => a.dateValue - b.dateValue);
    }
  }, [records, highlightedRecord, sortOrder]);

  if (!highlightedRecord || locationPerformances.length === 0) {
    return (
      <div className="location-performances">
        <div className="location-placeholder">
          Select a performance to see all events at that location
        </div>
      </div>
    );
  }

  return (
    <div className="location-performances">
      <h3 className="location-title">{highlightedRecord.city}</h3>
      <div className="location-header">
        <span className="location-count">{locationPerformances.length} performance{locationPerformances.length !== 1 ? 's' : ''}</span>
        <div className="sort-toggle">
          <button 
            className={`sort-btn ${sortOrder === 'time' ? 'active' : ''}`}
            onClick={() => setSortOrder('time')}
          >
            Time
          </button>
          <button 
            className={`sort-btn ${sortOrder === 'date' ? 'active' : ''}`}
            onClick={() => setSortOrder('date')}
          >
            Date
          </button>
        </div>
      </div>
      <div className="performances-list">
        {locationPerformances.map(record => {
          const isSelected = record.id === highlightedRecordId;
          return (
            <div 
              key={record.id}
              className={`performance-item ${isSelected ? 'selected' : ''}`}
              onClick={() => highlight(record.id)}
            >
              <div className="performance-name">{record.name}</div>
              <div className="performance-details">
                <span className="performance-time">{record.time}</span>
                <span className="performance-date">{record.date}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

LocationPerformances.displayName = 'LocationPerformances';
