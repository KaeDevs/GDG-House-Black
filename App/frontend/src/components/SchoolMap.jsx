import React, { useEffect, useRef } from 'react';

/**
 * SchoolMap — Leaflet map with color-coded school markers.
 * Uses Leaflet via CDN (loaded in index.html) to avoid SSR issues.
 *
 * Marker colors:
 *   red    → zero_enrollment (merge candidate)
 *   orange → overloaded (single teacher, >40 students)
 *   green  → healthy
 */
export default function SchoolMap({ schools, recommendations = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const linesRef = useRef([]);

  useEffect(() => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    // Center on Chennai
    const map = window.L.map(mapRef.current, {
      center: [13.1100, 80.2100],
      zoom: 12,
      zoomControl: true,
    });

    // Dark tile layer (CartoDB Dark Matter)
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !schools.length) return;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    linesRef.current.forEach(l => l.remove());
    linesRef.current = [];

    const colorConfig = {
      zero_enrollment: { color: '#ef4444', fill: '#fca5a5', label: 'Zero Enrollment' },
      overloaded:      { color: '#f59e0b', fill: '#fcd34d', label: 'Overloaded' },
      healthy:         { color: '#10b981', fill: '#6ee7b7', label: 'Healthy' },
    };

    schools.forEach(school => {
      const cfg = colorConfig[school.status] || colorConfig.healthy;

      const icon = window.L.divIcon({
        className: '',
        html: `
          <div style="
            width: 28px; height: 28px; border-radius: 50%;
            background: ${cfg.fill};
            border: 2.5px solid ${cfg.color};
            box-shadow: 0 0 12px ${cfg.color}55, 0 2px 8px rgba(0,0,0,0.5);
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; cursor: pointer;
            transition: transform 0.15s ease;
          " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'">
            ${school.status === 'zero_enrollment' ? '✕' : school.status === 'overloaded' ? '!' : '✓'}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const ratioStr = school.teacher_count > 0
        ? `${Math.round(school.enrollment / school.teacher_count)}:1`
        : 'N/A';

      const statusLabel = {
        zero_enrollment: '🔴 Zero Enrollment',
        overloaded: '🟠 Overloaded',
        healthy: '🟢 Healthy',
      }[school.status];

      const popupContent = `
        <div style="font-family: Inter, sans-serif; min-width: 200px; padding: 4px;">
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700; color: #f0f4ff; margin-bottom: 8px; line-height: 1.3;">${school.name}</div>
          <div style="font-size: 11px; color: #8fa3cc; margin-bottom: 10px;">${school.block} • ${school.district}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;">
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 8px; text-align: center;">
              <div style="font-size: 18px; font-weight: 800; color: #818cf8;">${school.enrollment}</div>
              <div style="font-size: 10px; color: #8fa3cc;">Students</div>
            </div>
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 8px; text-align: center;">
              <div style="font-size: 18px; font-weight: 800; color: #34d399;">${school.teacher_count}</div>
              <div style="font-size: 10px; color: #8fa3cc;">Teachers</div>
            </div>
          </div>
          <div style="font-size: 11px; color: #8fa3cc; margin-bottom: 4px;">Ratio: <span style="color: #f0f4ff; font-weight: 600;">${ratioStr}</span> &nbsp;|&nbsp; Type: <span style="color: #f0f4ff; font-weight: 600; text-transform: capitalize;">${school.school_type}</span></div>
          <div style="margin-top: 8px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; display: inline-block; background: rgba(255,255,255,0.06); color: #f0f4ff;">${statusLabel}</div>
        </div>
      `;

      const marker = window.L.marker([school.lat, school.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent, { maxWidth: 260 });

      markersRef.current.push(marker);
    });

    // Draw merge lines
    recommendations
      .filter(r => r.type === 'merge')
      .forEach(rec => {
        const src = rec.source_school;
        const tgt = rec.target_school;
        const lineColor = rec.rte_compliant ? '#10b981' : '#f59e0b';

        const line = window.L.polyline(
          [[src.lat, src.lng], [tgt.lat, tgt.lng]],
          {
            color: lineColor,
            weight: 2,
            opacity: 0.65,
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
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 1000,
        background: 'rgba(15, 22, 35, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Legend</div>
        {[
          { color: '#ef4444', label: 'Zero Enrollment' },
          { color: '#f59e0b', label: 'Overloaded' },
          { color: '#10b981', label: 'Healthy' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            <div style={{ width: 20, height: 2, background: '#10b981' }} /> RTE Compliant
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ width: 20, height: 2, backgroundImage: 'linear-gradient(90deg, #f59e0b 60%, transparent 60%)', backgroundSize: '6px 2px' }} /> Non-Compliant
          </div>
        </div>
      </div>
    </div>
  );
}
