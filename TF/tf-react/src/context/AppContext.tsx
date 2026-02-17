import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { AthleteRecord } from '../types';

interface AppContextType {
  records: AthleteRecord[];
  setRecords: (records: AthleteRecord[]) => void;
  selectedEvent: string;
  setSelectedEvent: (event: string) => void;
  highlightedRecordId: number | null;
  setHighlightedRecordId: (id: number | null) => void;
  hoveredRecordId: number | null;
  setHoveredRecordId: (id: number | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<AthleteRecord[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(null);
  const [hoveredRecordId, setHoveredRecordId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AppContext.Provider
      value={{
        records,
        setRecords,
        selectedEvent,
        setSelectedEvent,
        highlightedRecordId,
        setHighlightedRecordId,
        hoveredRecordId,
        setHoveredRecordId,
        isLoading,
        setIsLoading,
        error,
        setError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

// Custom hook for highlight management (click selection)
export function useHighlight() {
  const { highlightedRecordId, setHighlightedRecordId } = useAppContext();
  
  const highlight = useCallback((id: number | null) => {
    setHighlightedRecordId(id);
  }, [setHighlightedRecordId]);
  
  return { highlightedRecordId, highlight };
}

// Custom hook for hover management with debouncing for performance
export function useHover() {
  const { hoveredRecordId, setHoveredRecordId } = useAppContext();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const hover = useCallback((id: number | null) => {
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    
    // For clearing hover (mouseout), debounce to avoid flickering
    if (id === null) {
      debounceRef.current = setTimeout(() => {
        setHoveredRecordId(null);
      }, 50);
    } else {
      // For setting hover, apply immediately for responsiveness
      setHoveredRecordId(id);
    }
  }, [setHoveredRecordId]);
  
  return { hoveredRecordId, hover };
}

// Hook to get just the highlighted record ID
export function useHighlightedRecordId() {
  const { highlightedRecordId } = useAppContext();
  return highlightedRecordId;
}

// Hook to get just the hovered record ID
export function useHoveredRecordId() {
  const { hoveredRecordId } = useAppContext();
  return hoveredRecordId;
}
