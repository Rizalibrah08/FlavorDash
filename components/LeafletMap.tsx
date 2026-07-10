import React, { useRef, useCallback } from 'react';
import { WebView } from 'react-native-webview';

type MarkerData = {
  id?: string;
  latitude: number;
  longitude: number;
  title?: string;
  color?: string;
  draggable?: boolean;
};

type LeafletMapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MarkerData[];
  style?: object;
  onMarkerDragEnd?: (markerId: string, lat: number, lng: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
};

const generateHtml = (
  latitude: number,
  longitude: number,
  zoom: number,
  markers: MarkerData[],
  markerIdMap: Record<string, number>
) => {
  const markersJson = JSON.stringify(
    markers.map((m, i) => ({
      ...m,
      index: i,
      color: m.color || '#2563eb',
    }))
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      background: #2563eb;
      position: relative;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .custom-marker.restaurant { background: #dc2626; }
    .custom-marker.user { background: #2563eb; }
    .marker-inner {
      transform: rotate(45deg);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
    .marker-label {
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      center: [${latitude}, ${longitude}],
      zoom: ${zoom},
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const markers = ${markersJson};
    const markerObjects = {};

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker ' + (m.id || '') + '"><span class="marker-inner">' + (m.title ? m.title.charAt(0) : '') + '</span></div>' + (m.title ? '<div class="marker-label">' + m.title + '</div>' : ''),
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker([m.latitude, m.longitude], {
        icon: icon,
        draggable: m.draggable || false
      }).addTo(map);

      if (m.draggable) {
        marker.on('dragend', function(e) {
          const pos = e.target.getLatLng();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'markerDragEnd',
            markerId: m.id || 'main',
            latitude: pos.lat,
            longitude: pos.lng
          }));
        });
      }

      markerObjects[m.id || 'main'] = marker;
    });

    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapClick',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));
    });

    window.updateMarkerPosition = function(id, lat, lng) {
      if (markerObjects[id]) {
        markerObjects[id].setLatLng([lat, lng]);
      }
    };

    window.setZoom = function(z) {
      map.setZoom(z);
    };

    setTimeout(() => map.invalidateSize(), 100);
  </script>
</body>
</html>
  `;
};

export default function LeafletMap({
  latitude,
  longitude,
  zoom = 15,
  markers = [],
  style,
  onMarkerDragEnd,
  onMapClick,
}: LeafletMapProps) {
  const webViewRef = useRef<WebView>(null);

  const markerIdMap: Record<string, number> = {};
  markers.forEach((m, i) => {
    markerIdMap[m.id || `marker_${i}`] = i;
  });

  const html = generateHtml(latitude, longitude, zoom, markers, markerIdMap);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'markerDragEnd' && onMarkerDragEnd) {
          onMarkerDragEnd(data.markerId, data.latitude, data.longitude);
        }
        if (data.type === 'mapClick' && onMapClick) {
          onMapClick(data.latitude, data.longitude);
        }
      } catch (e) {}
    },
    [onMarkerDragEnd, onMapClick]
  );

  return (
    <WebView
      ref={webViewRef}
      source={{ html }}
      style={[{ flex: 1 }, style]}
      onMessage={handleMessage}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      originWhitelist={['*']}
    />
  );
}
