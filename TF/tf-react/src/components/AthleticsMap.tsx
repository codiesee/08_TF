import React, { useEffect, useRef, useMemo, memo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { AthleteRecord } from '../types';
import { getCityCoordinates } from '../data';
import { useHighlight } from '../context/AppContext';
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

      // Add mouseover handler
      marker.on('mouseover', () => {
        if (cityRecords.length === 1) {
          highlight(cityRecords[0].rank);
        }
      });

      marker.on('mouseout', () => {
        highlight(null);
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
      </MapContainer>
    </div>
  );
});

AthleticsMap.displayName = 'AthleticsMap';
