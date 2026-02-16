import React, { useEffect, useRef, useMemo, memo } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { AthleteRecord } from '../types';
import { getCityCoordinates } from '../data';
import { useHighlight, useHighlightedRecordId } from '../context/AppContext';
import { MAP_CENTER, MAP_ZOOM, MAP_TILE_URL, MAP_ATTRIBUTION } from '../config/constants';
import './AthleticsMap.css';

// Fix Leaflet default marker icon issue with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Highlighted marker icon (red) - using divIcon for reliability
const HighlightedIcon = L.divIcon({
  className: 'highlighted-marker',
  html: `<div style="
    background-color: #ff0000;
    width: 30px;
    height: 30px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid #cc0000;
    box-shadow: 0 0 10px rgba(255,0,0,0.5);
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MarkerClusterLayerProps {
  records: AthleteRecord[];
}

// Marker cluster layer component
const MarkerClusterLayer: React.FC<MarkerClusterLayerProps> = memo(({ records }) => {
  const map = useMap();
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const { highlight } = useHighlight();

  // Group records by city for clustering
  const cityGroups = useMemo(() => {
    const groups: Map<string, AthleteRecord[]> = new Map();
    
    records.forEach(record => {
      if (!record.city) return;
      const existing = groups.get(record.city) || [];
      existing.push(record);
      groups.set(record.city, existing);
    });
    
    return groups;
  }, [records]);

  useEffect(() => {
    // Clear existing markers
    if (markersRef.current) {
      map.removeLayer(markersRef.current);
    }

    // Create new marker cluster group
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    // Add markers for each city
    cityGroups.forEach((cityRecords, city) => {
      const coords = getCityCoordinates(city);
      if (!coords) return;

      // Create popup content
      const popupContent = cityRecords.length <= 5
        ? cityRecords.map(r => `<b>#${r.rank}</b> ${r.name} (${r.time})`).join('<br>')
        : `<b>${city}</b><br>${cityRecords.length} performances`;

      const marker = L.marker([coords.lat, coords.lng])
        .bindPopup(popupContent);

      // Add click handler for single-record cities
      marker.on('click', () => {
        if (cityRecords.length === 1) {
          highlight(cityRecords[0].id);
        }
      });

      markers.addLayer(marker);
    });

    map.addLayer(markers);
    markersRef.current = markers;

    return () => {
      if (markersRef.current) {
        map.removeLayer(markersRef.current);
      }
    };
  }, [map, cityGroups, highlight]);

  return null;
});

MarkerClusterLayer.displayName = 'MarkerClusterLayer';

// Component to show the selected/highlighted event marker
interface SelectedMarkerLayerProps {
  records: AthleteRecord[];
}

const SelectedMarkerLayer: React.FC<SelectedMarkerLayerProps> = memo(({ records }) => {
  const highlightedRecordId = useHighlightedRecordId();
  
  // Find the highlighted record
  const highlightedRecord = useMemo(() => {
    if (highlightedRecordId === null) return null;
    return records.find(r => r.id === highlightedRecordId) || null;
  }, [records, highlightedRecordId]);

  // Get coordinates for the highlighted record
  const coords = useMemo(() => {
    if (!highlightedRecord?.city) return null;
    return getCityCoordinates(highlightedRecord.city);
  }, [highlightedRecord]);

  if (!highlightedRecord || !coords) return null;

  return (
    <Marker 
      position={[coords.lat, coords.lng]} 
      icon={HighlightedIcon}
      zIndexOffset={1000}
    >
      <Popup>
        <div>
          <strong>#{highlightedRecord.rank}</strong> {highlightedRecord.name}<br />
          <strong>Time:</strong> {highlightedRecord.time}<br />
          <strong>Date:</strong> {highlightedRecord.date}<br />
          <strong>Location:</strong> {highlightedRecord.city}
        </div>
      </Popup>
    </Marker>
  );
});

SelectedMarkerLayer.displayName = 'SelectedMarkerLayer';

interface AthleticsMapProps {
  records: AthleteRecord[];
}

export const AthleticsMap: React.FC<AthleticsMapProps> = memo(({ records }) => {
  return (
    <div className="map-container">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="athletics-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution={MAP_ATTRIBUTION}
          url={MAP_TILE_URL}
        />
        <MarkerClusterLayer records={records} />
        <SelectedMarkerLayer records={records} />
      </MapContainer>
    </div>
  );
});

AthleticsMap.displayName = 'AthleticsMap';
