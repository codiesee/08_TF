import React, { memo, useMemo } from 'react';
import { AthleteRecord } from '../types';
import { useHighlight } from '../context/AppContext';
import './InfoPanel.css';

interface InfoPanelProps {
  records: AthleteRecord[];
}

export const InfoPanel: React.FC<InfoPanelProps> = memo(({ records }) => {
  const { highlightedRecordId } = useHighlight();

  const highlightedRecord = useMemo(() => {
    if (highlightedRecordId === null) return null;
    return records.find(r => r.rank === highlightedRecordId);
  }, [records, highlightedRecordId]);

  if (!highlightedRecord) {
    return (
      <div className="info-panel">
        <div className="info-placeholder">
          Hover over bars for details
        </div>
      </div>
    );
  }

  return (
    <div className="info-panel active">
      <div className="info-row">
        <span className="info-label">Athlete:</span>
        <span className="info-value">{highlightedRecord.name}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Time:</span>
        <span className="info-value">{highlightedRecord.time}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Rank:</span>
        <span className="info-value">#{highlightedRecord.rank}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Date:</span>
        <span className="info-value">{highlightedRecord.date}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Location:</span>
        <span className="info-value">{highlightedRecord.city}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Country:</span>
        <span className="info-value">{highlightedRecord.country}</span>
      </div>
      <div className="info-row">
        <span className="info-label">DOB:</span>
        <span className="info-value">{highlightedRecord.birthDate}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Age at event:</span>
        <span className="info-value">{highlightedRecord.ageYears} years</span>
      </div>
    </div>
  );
});

InfoPanel.displayName = 'InfoPanel';
