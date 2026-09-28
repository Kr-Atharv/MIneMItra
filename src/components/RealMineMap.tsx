import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MineMapPoint } from '../data/mineMapPoints';

interface RealMineMapProps {
  points: MineMapPoint[];
  selectedId: string | null;
  onSelect: (point: MineMapPoint) => void;
  onViewComplaint?: (id: string) => void;
  mapMode: 'satellite' | 'hybrid' | 'street';
  zoomTrigger?: number;
}

export interface RealMineMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  invalidateSize: () => void;
  fitAll: () => void;
}

const STATUS_COLOR: Record<MineMapPoint['status'], string> = {
  critical: '#ef4444',
  observation: '#f59e0b',
  safe: '#22c55e'
};

export const LIFECYCLE_PIN_COLOR: Record<string, string> = {
  SUBMITTED: '#64748b',
  PENDING_INSPECTION: '#2563eb',
  ASSIGNED_MAINTENANCE: '#d97706',
  PENDING_AUDIT: '#7c3aed',
  RESOLVED_VERIFIED: '#16a34a',
  REJECTED: '#e11d48'
};

// Free, no-API-key tile sources that render a real Google-Maps-like basemap.
const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics'
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};
// Hybrid = satellite imagery + a transparent labels/roads reference overlay on top.
const HYBRID_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

function escHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function makePinIcon(color: string, isSelected: boolean) {
  const size = isSelected ? 40 : 32;
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
        <path d="M16 0C8.3 0 2 6.3 2 14c0 10 14 18 14 18s14-8 14-18c0-7.7-6.3-14-14-14z" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
        <circle cx="16" cy="14" r="6" fill="#0f172a"/>
      </svg>
      ${isSelected ? `<div style="position:absolute;top:-4px;left:-4px;width:${size + 8}px;height:${size + 8}px;border-radius:50%;border:2px solid #facc15;animation:pulseRing 1.4s ease-out infinite;"></div>` : ''}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'mine-pin-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
}

export const RealMineMap = forwardRef<RealMineMapHandle, RealMineMapProps>(({ points, selectedId, onSelect, onViewComplaint, mapMode, zoomTrigger }, ref) => {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    invalidateSize: () => setTimeout(() => mapRef.current?.invalidateSize(), 250),
    fitAll: () => {
      const map = mapRef.current;
      if (!map || points.length === 0) return;
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
    }
  }), [points]);

  // Init map once
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      zoomControl: false,
      attributionControl: true,
      minZoom: 4,
      maxZoom: 17
    }).setView([22.6, 84.2], 6);

    mapRef.current = map;

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulseRing {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      .mine-pin-icon { background: transparent; border: none; }
      .leaflet-popup-content-wrapper { border-radius: 8px; }
    `;
    document.head.appendChild(style);

    // Leaflet caches its container size and uses it to compute where every
    // marker lands in pixel space. It only recalculates that on an explicit
    // invalidateSize() call — it does NOT notice plain CSS/layout resizes on
    // its own. This page's map container shrinks whenever the right-hand
    // "selected complaint" panel mounts (and grows again when it unmounts),
    // and it also resizes with the browser window and the fullscreen toggle.
    // Without this, Leaflet keeps using the old size, so flyTo()/markers end
    // up positioned outside the now-different visible area — pins appear to
    // vanish. A ResizeObserver keeps Leaflet's internal size in sync with
    // whatever the container's actual size is at any given moment.
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapDivRef.current);

    // Also correct for the container not yet having its final layout size
    // at the instant the map is constructed (e.g. flex layout settling,
    // fonts loading).
    const initialInvalidate = setTimeout(() => map.invalidateSize(), 0);

    return () => {
      clearTimeout(initialInvalidate);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      style.remove();
    };
  }, []);

  // Switch base tile layer when mapMode changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    if (mapMode === 'street') {
      baseLayerRef.current = L.tileLayer(TILE_LAYERS.street.url, {
        attribution: TILE_LAYERS.street.attribution,
        maxZoom: 19
      }).addTo(map);
    } else {
      // satellite and hybrid both start from the same satellite imagery
      baseLayerRef.current = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: TILE_LAYERS.satellite.attribution,
        maxZoom: 19
      }).addTo(map);

      if (mapMode === 'hybrid') {
        labelsLayerRef.current = L.tileLayer(HYBRID_LABELS_URL, {
          maxZoom: 19,
          opacity: 0.9
        }).addTo(map);
      }
    }
  }, [mapMode]);

  // Render / update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove markers for points no longer present
    Object.keys(markersRef.current).forEach((id) => {
      if (!points.find((p) => p.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    points.forEach((p) => {
      const isSelected = p.id === selectedId;
      const color = p.pinColor || STATUS_COLOR[p.status];
      const icon = makePinIcon(color, isSelected);
      let marker = markersRef.current[p.id];

      if (!marker) {
        marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        marker.on('click', () => onSelect(p));
        markersRef.current[p.id] = marker;
      } else {
        marker.setIcon(icon);
        marker.setLatLng([p.lat, p.lng]);
      }

      const popup = L.popup({ maxWidth: 320 });
      const wrap = document.createElement('div');
      wrap.style.fontFamily = 'ui-sans-serif, system-ui';
      wrap.style.minWidth = '220px';
      wrap.innerHTML = `
        <div style="font-size:10px;font-weight:700;color:#0B6B4A;letter-spacing:.04em;margin-bottom:4px;">${escHtml(p.trackingNumber || p.id)}</div>
        <div style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px;">${escHtml(p.title || p.mineName)}</div>
        <div style="font-size:11px;color:#475569;margin-bottom:6px;">${escHtml(p.mineName)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
          ${p.category ? `<span style="font-size:10px;padding:2px 6px;border:1px solid #d1d5db;border-radius:4px;">${escHtml(p.category)}</span>` : ''}
          ${p.severity ? `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#fef3c7;color:#92400e;font-weight:700;">${escHtml(p.severity)}</span>` : ''}
          ${p.lifecycleLabel ? `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${color}22;color:${color};font-weight:700;border:1px solid ${color}55;">${escHtml(p.lifecycleLabel)}</span>` : ''}
        </div>
        ${p.reportedAt ? `<div style="font-size:11px;color:#334155;margin-bottom:4px;">Reported: <b>${escHtml(p.reportedAt)}</b></div>` : ''}
        ${p.detailRows && p.detailRows.length > 0 ? `
        <div style="margin:4px 0 6px 0;padding-top:6px;border-top:1px solid #e2e8f0;">
          ${p.detailRows.map((r) => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:11px;color:#334155;margin-bottom:2px;"><span style="color:#64748b;">${escHtml(r.label)}</span><span style="font-weight:700;text-align:right;">${escHtml(r.value)}</span></div>`).join('')}
        </div>` : ''}
        <div style="font-size:11px;font-family:ui-monospace,monospace;color:#0B6B4A;">${p.lat.toFixed(6)}°N, ${p.lng.toFixed(6)}°E</div>
      `;
      if (onViewComplaint && (p.complaintId || p.id.startsWith('CMP-'))) {
        const btn = document.createElement('button');
        btn.textContent = 'View Complaint';
        btn.style.cssText = 'margin-top:8px;width:100%;padding:6px 8px;background:#16a34a;color:#fff;border:0;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;';
        btn.onclick = (ev) => {
          ev.preventDefault();
          onViewComplaint(p.complaintId || p.id);
        };
        wrap.appendChild(btn);
      }
      popup.setContent(wrap);
      marker.bindPopup(popup);
    });

    if (points.length > 0 && !selectedId) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]: [string, L.Marker]) => {
      const p = points.find((pt) => pt.id === id);
      if (!p) return;
      const color = p.pinColor || STATUS_COLOR[p.status];
      marker.setIcon(makePinIcon(color, id === selectedId));
    });
  }, [selectedId, points]);

  // Fly to selected marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const p = points.find((pt) => pt.id === selectedId);
    if (p) {
      map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 13), { duration: 0.55 });
      markersRef.current[p.id]?.openPopup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Re-fit bounds on explicit reset trigger
  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomTrigger]);

  return <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />;
});

RealMineMap.displayName = 'RealMineMap';
