import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AthleteRecord } from '../types';
import { useHighlight } from '../context/AppContext';
import './AthleteSearch.css';

// Country code to full name mapping
const COUNTRY_NAMES: Record<string, string[]> = {
  'USA': ['united states', 'america', 'american', 'us'],
  'GBR': ['great britain', 'united kingdom', 'uk', 'britain', 'british', 'england', 'english'],
  'KEN': ['kenya', 'kenyan'],
  'ETH': ['ethiopia', 'ethiopian'],
  'JAM': ['jamaica', 'jamaican'],
  'JPN': ['japan', 'japanese'],
  'GER': ['germany', 'german', 'deutschland'],
  'FRA': ['france', 'french'],
  'ITA': ['italy', 'italian'],
  'ESP': ['spain', 'spanish'],
  'CAN': ['canada', 'canadian'],
  'AUS': ['australia', 'australian'],
  'NZL': ['new zealand', 'kiwi'],
  'RSA': ['south africa', 'south african'],
  'CHN': ['china', 'chinese'],
  'RUS': ['russia', 'russian'],
  'BRA': ['brazil', 'brazilian'],
  'MEX': ['mexico', 'mexican'],
  'NED': ['netherlands', 'dutch', 'holland'],
  'BEL': ['belgium', 'belgian'],
  'SWE': ['sweden', 'swedish'],
  'NOR': ['norway', 'norwegian'],
  'DEN': ['denmark', 'danish'],
  'FIN': ['finland', 'finnish'],
  'POL': ['poland', 'polish'],
  'UKR': ['ukraine', 'ukrainian'],
  'IRL': ['ireland', 'irish'],
  'POR': ['portugal', 'portuguese'],
  'MAR': ['morocco', 'moroccan'],
  'TUN': ['tunisia', 'tunisian'],
  'ALG': ['algeria', 'algerian'],
  'UGA': ['uganda', 'ugandan'],
  'TAN': ['tanzania', 'tanzanian'],
  'ERI': ['eritrea', 'eritrean'],
  'SOM': ['somalia', 'somali'],
  'BRN': ['bahrain', 'bahraini'],
  'QAT': ['qatar', 'qatari'],
  'TUR': ['turkey', 'turkish'],
  'IND': ['india', 'indian'],
  'PAK': ['pakistan', 'pakistani'],
  'BAN': ['bangladesh', 'bangladeshi'],
  'SUI': ['switzerland', 'swiss'],
  'AUT': ['austria', 'austrian'],
  'CZE': ['czech', 'czechia', 'czech republic'],
  'HUN': ['hungary', 'hungarian'],
  'ROM': ['romania', 'romanian'],
  'BUL': ['bulgaria', 'bulgarian'],
  'GRE': ['greece', 'greek'],
  'SRB': ['serbia', 'serbian'],
  'CRO': ['croatia', 'croatian'],
  'SLO': ['slovenia', 'slovenian'],
  'SVK': ['slovakia', 'slovak'],
  'BLR': ['belarus', 'belarusian'],
  'LTU': ['lithuania', 'lithuanian'],
  'LAT': ['latvia', 'latvian'],
  'EST': ['estonia', 'estonian'],
};

// Build reverse lookup: name -> code
const NAME_TO_CODE: Record<string, string> = {};
Object.entries(COUNTRY_NAMES).forEach(([code, names]) => {
  names.forEach(name => {
    NAME_TO_CODE[name] = code;
  });
});

// Function to check if a search term matches a country code
function matchesCountry(countryCode: string, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase();
  // Direct code match
  if (countryCode.toLowerCase().includes(term)) return true;
  // Check if search term matches any name for this country
  const names = COUNTRY_NAMES[countryCode];
  if (names) {
    return names.some(name => name.includes(term));
  }
  return false;
}

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

  // Check if search term is primarily a country search
  const isCountrySearch = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return false;
    // Check if term matches any country code or name
    if (Object.keys(COUNTRY_NAMES).some(code => code.toLowerCase().includes(trimmed))) return true;
    if (Object.keys(NAME_TO_CODE).some(name => name.includes(trimmed))) return true;
    return false;
  }, [searchTerm]);

  // Filter athletes based on search term (searches name and country with full name lookup)
  const filteredAthletes = useMemo(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return [];
    
    const term = trimmed.toLowerCase();
    let matches = athleteOptions
      .filter(athlete => 
        athlete.name.toLowerCase().includes(term) ||
        matchesCountry(athlete.fastestRecord.country, term)
      );
    
    // If it's a country search, sort by fastest time
    if (isCountrySearch) {
      matches = matches.sort((a, b) => a.fastestRecord.timeSeconds - b.fastestRecord.timeSeconds);
    }
    
    // Remove limit after 3+ characters entered
    if (trimmed.length >= 3) {
      return matches;
    }
    return matches.slice(0, 10);
  }, [athleteOptions, searchTerm, isCountrySearch]);

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
          placeholder="Name or country..."
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
              <div className="athlete-info">
                <span className="athlete-name">{athlete.name}</span>
                <span className="athlete-country">{athlete.fastestRecord.country}</span>
              </div>
              <span className="athlete-time">{athlete.fastestRecord.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

AthleteSearch.displayName = 'AthleteSearch';
