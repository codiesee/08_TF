import React, { memo } from 'react';
import { EVENTS } from '../config/constants';
import './EventSelector.css';

interface EventSelectorProps {
  selectedEvent: string;
  onEventChange: (event: string) => void;
  isLoading: boolean;
}

export const EventSelector: React.FC<EventSelectorProps> = memo(({
  selectedEvent,
  onEventChange,
  isLoading,
}) => {
  return (
    <div className="event-selector">
      <label htmlFor="event-select">Select Event: </label>
      <select
        id="event-select"
        value={selectedEvent}
        onChange={(e) => onEventChange(e.target.value)}
        disabled={isLoading}
      >
        <option value="">-- Choose Event --</option>
        {EVENTS.map((event) => (
          <option key={event.code} value={event.code}>
            {event.label}
          </option>
        ))}
      </select>
      {isLoading && <span className="loading-indicator">Loading...</span>}
    </div>
  );
});

EventSelector.displayName = 'EventSelector';
