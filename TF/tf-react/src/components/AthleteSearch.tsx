import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AthleteRecord } from '../types';
import { useHighlight } from '../context/AppContext';
import './AthleteSearch.css';

interface AthleteSearchProps {
  records: AthleteRecord[];
}

export const AthleteSearch: React.FC<AthleteSearchProps> = ({ records }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { highlight } = useHighlight();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique athlete names with their fastest time
  const athleteOptions = useMemo(() => {
    const athleteMap = new Map<string, AthleteRecord>();
    
    // Find the fastest record for each athlete
    records.forEach(record => {
      const existing = athleteMap.get(record.name);
      if (!existing || record.timeSeconds < existing.timeSeconds) {
        athleteMap.set(record.name, record);
      }
    });

    // Convert to array and sort alphabetically
    return Array.from(athleteMap.entries())
      .map(([name, record]) => ({ name, fastestRecord: record }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  // Filter athletes based on search term
  const filteredAthletes = useMemo(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return [];
    
    const term = trimmed.toLowerCase();
    const matches = athleteOptions
      .filter(athlete => athlete.name.toLowerCase().includes(term));
    
    // Remove limit after 3+ characters entered
    if (trimmed.length >= 3) {
      return matches;
    }
    return matches.slice(0, 10);
  }, [athleteOptions, searchTerm]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    setSelectedIndex(0);
  }, []);

  // Handle athlete selection
  const handleSelectAthlete = useCallback((athlete: { name: string; fastestRecord: AthleteRecord }) => {
    setSearchTerm(athlete.name);
    setIsOpen(false);
    // Highlight their fastest record - secondary highlights will show other records
    highlight(athlete.fastestRecord.id);
  }, [highlight]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || filteredAthletes.length === 0) {
      if (e.key === 'ArrowDown' && searchTerm) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredAthletes.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredAthletes[selectedIndex]) {
          handleSelectAthlete(filteredAthletes[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  }, [isOpen, filteredAthletes, selectedIndex, handleSelectAthlete, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const handleClear = useCallback(() => {
    setSearchTerm('');
    setIsOpen(false);
    highlight(null);
    inputRef.current?.focus();
  }, [highlight]);

  return (
    <div className="athlete-search">
      <label className="search-label">Search Athlete:</label>
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Type athlete name..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setIsOpen(true)}
        />
        {searchTerm && (
          <button className="clear-button" onClick={handleClear} type="button">
            ×
          </button>
        )}
      </div>
      
      {isOpen && filteredAthletes.length > 0 && (
        <div className="search-dropdown" ref={dropdownRef}>
          {filteredAthletes.map((athlete, index) => (
            <div
              key={athlete.name}
              className={`search-option ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelectAthlete(athlete)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="athlete-name">{athlete.name}</span>
              <span className="athlete-time">{athlete.fastestRecord.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

AthleteSearch.displayName = 'AthleteSearch';
