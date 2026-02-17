import React, { useEffect, useRef, useMemo, memo } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { AthleteRecord } from '../types';
import { getCityCoordinates } from '../data';
import { useHighlight, useHighlightedRecordId, useHover, useHoveredRecordId } from '../context/AppContext';
import { MAP_CENTER, MAP_ZOOM, MAP_TILE_URL, MAP_ATTRIBUTION } from '../config/constants';
import './AthleticsMap.css';

// Default marker icon (circle style to match clusters)
const DefaultIcon = L.divIcon({
  className: 'default-marker',
  html: `<div style="
    background-color: #3388ff9b;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #ffffff84;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
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
  const { hover } = useHover();

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

    // Add one marker per performance record (so cluster counts show performances)
    records.forEach(record => {
      if (!record.city) return;
      
      const coords = getCityCoordinates(record.city);
      if (!coords) return;

      // Create popup content for this specific performance
      const popupContent = `<b>#${record.rank}</b> ${record.name}<br>${record.time} - ${record.city}`;

      const marker = L.marker([coords.lat, coords.lng])
        .bindPopup(popupContent);

      // Add click handler to highlight this record
      marker.on('click', () => {
        highlight(record.id);
      });

      // Add hover handlers
      marker.on('mouseover', () => {
        hover(record.id);
      });
      marker.on('mouseout', () => {
        hover(null);
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
  }, [map, records, highlight, hover]);

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

  // Create a custom icon with the city label
  const labeledIcon = useMemo(() => {
    if (!highlightedRecord?.city) return null;
    return L.divIcon({
      className: 'highlighted-marker-labeled',
      html: `<div style="display: flex; align-items: center; gap: 6px;">
        <div style="
          background-color: #ff0000;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 3px solid #fff;
          box-shadow: 0 0 10px rgba(255,0,0,0.5);
          flex-shrink: 0;
        "></div>
        <div style="
          font-size: 13px;
          font-weight: bold;
          color: #ff0000;
          white-space: nowrap;
          text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 -1px 0 #fff, 0 1px 0 #fff, -1px 0 0 #fff, 1px 0 0 #fff;
        ">${highlightedRecord.city}</div>
      </div>`,
      iconSize: [150, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13],
    });
  }, [highlightedRecord]);

  if (!highlightedRecord || !coords || !labeledIcon) return null;

  return (
    <Marker 
      position={[coords.lat, coords.lng]} 
      icon={labeledIcon}
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

// Component to show the hovered event marker (dark gray)
interface HoveredMarkerLayerProps {
  records: AthleteRecord[];
}

const HoveredMarkerLayer: React.FC<HoveredMarkerLayerProps> = memo(({ records }) => {
  const hoveredRecordId = useHoveredRecordId();
  const highlightedRecordId = useHighlightedRecordId();
  
  // Find the hovered record (but don't show if it's also highlighted)
  const hoveredRecord = useMemo(() => {
    if (hoveredRecordId === null || hoveredRecordId === highlightedRecordId) return null;
    return records.find(r => r.id === hoveredRecordId) || null;
  }, [records, hoveredRecordId, highlightedRecordId]);

  // Get coordinates for the hovered record
  const coords = useMemo(() => {
    if (!hoveredRecord?.city) return null;
    return getCityCoordinates(hoveredRecord.city);
  }, [hoveredRecord]);

  // Create a custom icon with dark gray color and city label
  const hoveredIcon = useMemo(() => {
    if (!hoveredRecord?.city) return null;
    return L.divIcon({
      className: 'hovered-marker-labeled',
      html: `<div style="display: flex; align-items: center; gap: 6px;">
        <div style="
          background-color: #404040;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 8px rgba(0,0,0,0.4);
          flex-shrink: 0;
        "></div>
        <div style="
          font-size: 12px;
          font-weight: bold;
          color: #404040;
          white-space: nowrap;
          text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 -1px 0 #fff, 0 1px 0 #fff, -1px 0 0 #fff, 1px 0 0 #fff;
        ">${hoveredRecord.city}</div>
      </div>`,
      iconSize: [150, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -11],
    });
  }, [hoveredRecord]);

  if (!hoveredRecord || !coords || !hoveredIcon) return null;

  return (
    <Marker 
      position={[coords.lat, coords.lng]} 
      icon={hoveredIcon}
      zIndexOffset={900}
    />
  );
});

HoveredMarkerLayer.displayName = 'HoveredMarkerLayer';

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
        <HoveredMarkerLayer records={records} />
        <SelectedMarkerLayer records={records} />
      </MapContainer>
    </div>
  );
});

AthleticsMap.displayName = 'AthleticsMap';
