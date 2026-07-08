import React, { useEffect, useRef } from 'react';

/**
 * SchoolMap — Leaflet map with color-coded school markers.
 * Uses light CartoDB Positron tile layer to match Stitch design.
 *
 * Props:
 *   schools        - array of school objects with lat/lng/status
 *   recommendations - array of recommendation objects (for merge lines)
 *   mapCenter      - [lat, lng] to fly to when district changes
 *   mapZoom        - zoom level for the selected district
 *   onSchoolSelect - callback when a marker is clicked
 */
export default function SchoolMap({ schools, recommendations = [], mapCenter, mapZoom, onSchoolSelect }) {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef     = useRef([]);
  const linesRef       = useRef([]);

  // ── Initialize map once ─────────────────────────────────────────────────
  useEffect(() => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    const map = window.L.map(mapRef.current, {
      center: mapCenter || [13.1100, 80.2100],
      zoom:   mapZoom   || 12,
      zoomControl: true,
    });

    // Light CartoDB Positron tiles
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // only once

  // ── Pan/zoom when district changes ─────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !mapCenter) return;
    mapInstanceRef.current.flyTo(mapCenter, mapZoom || 12, { duration: 1.2 });
  }, [mapCenter, mapZoom]);

  // ── Re-render markers when schools/recommendations change ───────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const map = mapInstanceRef.current;

    // Clear existing markers & lines
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    linesRef.current.forEach(l => l.remove());
    linesRef.current = [];

    if (!schools.length) return;

    const colorConfig = {
      zero_enrollment: { color: '#DC2626', fill: '#FFDAD6', symbol: '✕', label: 'Zero Enrollment' },
      overloaded:      { color: '#D97706', fill: '#FEF3C7', symbol: '!', label: 'Single-Teacher' },
      healthy:         { color: '#0D9488', fill: '#CCFBF1', symbol: '✓', label: 'Healthy' },
    };

    schools.forEach(school => {
      const cfg = colorConfig[school.status] || colorConfig.healthy;

      const icon = window.L.divIcon({
        className: '',
        html: `
          <div style="
            width: 32px; height: 32px; border-radius: 50%;
            background: white;
            border: 2.5px solid ${cfg.color};
            box-shadow: 0 2px 8px rgba(0,0,0,0.2), 0 0 0 4px ${cfg.color}22;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 700; color: ${cfg.color};
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          "
          onmouseover="this.style.transform='scale(1.35)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.25), 0 0 0 6px ${cfg.color}33';"
          onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.2), 0 0 0 4px ${cfg.color}22';"
          >
            ${cfg.symbol}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const ratioStr = school.teacher_count > 0
        ? `${Math.round(school.enrollment / school.teacher_count)}:1`
        : 'N/A';

      const popupContent = `
        <div style="font-family: Inter, sans-serif; min-width: 220px; padding: 4px 2px;">
          <div style="font-size: 14px; font-weight: 700; color: #091426; margin-bottom: 4px; line-height: 1.3;">${school.name}</div>
          <div style="font-size: 11px; color: #45474c; margin-bottom: 12px;">${school.block} · ${school.district}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div style="background: #f5f3f4; border-radius: 10px; padding: 10px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #091426; line-height: 1;">${school.enrollment}</div>
              <div style="font-size: 10px; color: #45474c; margin-top: 2px; font-weight: 500;">Students</div>
            </div>
            <div style="background: #f5f3f4; border-radius: 10px; padding: 10px; text-align: center;">
              <div style="font-size: 20px; font-weight: 800; color: #006a61; line-height: 1;">${school.teacher_count}</div>
              <div style="font-size: 10px; color: #45474c; margin-top: 2px; font-weight: 500;">Teachers</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #45474c; margin-bottom: 8px;">
            <span>S:T Ratio <strong style="color: #091426;">${ratioStr}</strong></span>
            <span style="text-transform: capitalize;">${school.school_type || ''}</span>
          </div>
          <div style="display: inline-flex; align-items: center; gap: 5px; background: ${cfg.fill}; color: ${cfg.color}; border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 600;">${cfg.label}</div>
        </div>
      `;

      const marker = window.L.marker([school.lat, school.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent, { maxWidth: 260 });

      marker.on('click', () => {
        if (onSchoolSelect) onSchoolSelect(school);
      });

      markersRef.current.push(marker);
    });

    // Draw merge lines
    recommendations
      .filter(r => r.type === 'merge')
      .forEach(rec => {
        const src = rec.source_school;
        const tgt = rec.target_school;
        const lineColor = rec.rte_compliant ? '#0D9488' : '#D97706';

        const line = window.L.polyline(
          [[src.lat, src.lng], [tgt.lat, tgt.lng]],
          {
            color:     lineColor,
            weight:    2,
            opacity:   0.7,
            dashArray: rec.rte_compliant ? null : '6, 6',
          }
        ).addTo(map);

        linesRef.current.push(line);
      });

  }, [schools, recommendations]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }} />

      {/* Legend */}
      <div className="glass-card" style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        borderRadius: 10,
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        {[
          { color: '#0D9488', label: 'Healthy' },
          { color: '#D97706', label: 'Review' },
          { color: '#DC2626', label: 'Closure' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
