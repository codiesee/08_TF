import React, { memo, useCallback, useRef } from 'react';
import { AthleteRecord } from '../types';
import { useHighlight } from '../context/AppContext';
import './Histogram.css';

interface HistogramBarProps {
  record: AthleteRecord;
  index: number;
  heightPercent: number;
  leftPercent: number;
  barWidth: number;
  isHighlighted: boolean;
  onClick: (id: number) => void;
}

// Memoized bar component for performance
const HistogramBar = memo<HistogramBarProps>(({
  record,
  index,
  heightPercent,
  leftPercent,
  barWidth,
  isHighlighted,
  onClick,
}) => {
  const handleClick = useCallback(() => {
    onClick(record.id);
  }, [onClick, record.id]);

  return (
    <div
      className={`histogram-bar ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        height: `${Math.max(heightPercent, 1)}%`,
        left: `${leftPercent}%`,
        width: `${barWidth}%`,
        bottom: 0,
      }}
      onClick={handleClick}
      data-rank={record.rank}
      data-name={record.name}
      data-time={record.time}
      data-date={record.date}
      data-city={record.city}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance - only re-render if these change
  return (
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.heightPercent === nextProps.heightPercent &&
    prevProps.leftPercent === nextProps.leftPercent &&
    prevProps.barWidth === nextProps.barWidth &&
    prevProps.record.id === nextProps.record.id
  );
});

HistogramBar.displayName = 'HistogramBar';

interface HistogramProps {
  title: string;
  bars: {
    record: AthleteRecord;
    index: number;
    heightPercent: number;
    leftPercent: number;
    value: number;
  }[];
  labels: { value: number; position: number; label: string }[];
  className?: string;
}

export const Histogram: React.FC<HistogramProps> = memo(({
  title,
  bars,
  labels,
  className = '',
}) => {
  const { highlightedRecordId, highlight } = useHighlight();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate bar width based on number of bars
  const barWidth = bars.length > 0 ? Math.max(0.1, 100 / bars.length) : 1;

  const handleClick = useCallback((id: number) => {
    // Toggle: if clicking the same record, deselect it
    if (highlightedRecordId === id) {
      highlight(null);
    } else {
      highlight(id);
    }
  }, [highlight, highlightedRecordId]);

  // Click on empty space clears selection
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      highlight(null);
    }
  }, [highlight]);

  return (
    <div className={`histogram-container ${className}`}>
      <h3 className="histogram-title">{title}</h3>
      <div className="histogram-chart" ref={containerRef} onClick={handleBackgroundClick}>
        {bars.map((bar) => (
          <HistogramBar
            key={bar.record.id}
            record={bar.record}
            index={bar.index}
            heightPercent={bar.heightPercent}
            leftPercent={bar.leftPercent}
            barWidth={barWidth}
            isHighlighted={highlightedRecordId === bar.record.id}
            onClick={handleClick}
          />
        ))}
      </div>
      <div className="histogram-axis">
        {labels.map((label, i) => (
          <span
            key={i}
            className="axis-label"
            style={{ left: `${label.position}%` }}
          >
            {label.label}
          </span>
        ))}
      </div>
    </div>
  );
});

Histogram.displayName = 'Histogram';
