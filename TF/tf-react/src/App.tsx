import React, { useCallback } from 'react';
import { useAppContext } from './context/AppContext';
import { AthleticsMap, AthleteSearch, EventSelector, Histogram, InfoPanel, LocationPerformances } from './components';
import { useRankHistogram, useDateHistogram, useAgeHistogram } from './hooks/useHistogramData';
import { fetchEventData } from './services/api';
import './App.css';

function App() {
  const {
    records,
    setRecords,
    selectedEvent,
    setSelectedEvent,
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useAppContext();

  // Compute histogram data (pass selectedEvent for height inversion logic)
  const rankHistogram = useRankHistogram(records, selectedEvent);
  const dateHistogram = useDateHistogram(records, selectedEvent);
  const ageHistogram = useAgeHistogram(records, selectedEvent);

  // Handle event selection
  const handleEventChange = useCallback(async (eventCode: string) => {
    if (!eventCode) {
      setRecords([]);
      setSelectedEvent('');
      return;
    }

    setSelectedEvent(eventCode);
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchEventData(eventCode);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [setRecords, setSelectedEvent, setIsLoading, setError]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Track &amp; Field All-Time Rankings</h1>
        <p className="subtitle">
          Data visualization of all-time athletic performance rankings.
          <br />
          Bar width = rank position | Bar height = relative time (taller = slower)
          <br />
          Hover over bars for details
        </p>
      </header>

      <div className="app-controls">
        <EventSelector
          selectedEvent={selectedEvent}
          onEventChange={handleEventChange}
          isLoading={isLoading}
        />
        {records.length > 0 && (
          <AthleteSearch records={records} />
        )}
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div className="app-content">
        <div className="left-column">
          <InfoPanel records={records} />
          <LocationPerformances records={records} />
        </div>

        <div className="main-column">
          <AthleticsMap records={records} />
          
          <div className="histograms-container">
            <Histogram
              title="By Rank (left = fastest)"
              bars={rankHistogram.bars}
              labels={rankHistogram.labels}
              className="histogram-rank"
            />
            
            <Histogram
              title="By Date (left = oldest)"
              bars={dateHistogram.bars}
              labels={dateHistogram.labels}
              className="histogram-date"
            />
            
            <Histogram
              title="By Age at Event (left = youngest)"
              bars={ageHistogram.bars}
              labels={ageHistogram.labels}
              className="histogram-age"
            />
          </div>
        </div>
      </div>

      <footer className="app-footer">
        <p>
          Data source: <a href="https://www.alltime-athletics.com" target="_blank" rel="noopener noreferrer">alltime-athletics.com</a>
        </p>
        <p className="record-count">
          {records.length > 0 && `Showing ${records.length} records`}
        </p>
      </footer>
    </div>
  );
}

export default App;
