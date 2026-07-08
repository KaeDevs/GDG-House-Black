import React, { useState } from 'react';

/**
 * RecommendationCard — Matches Stitch design exactly:
 *  - Left accent border (4px teal or amber)
 *  - Title + RTE badge row
 *  - Mini-stats grid (Saves / Distance)
 *  - Reasoning text
 *  - Action button (Approve Analysis | View Logic | Dismiss)
 *  - Hover: slide-right
 */
export default function RecommendationCard({ rec, index = 0, compact = false, onHighlight }) {
  const [expanded, setExpanded] = useState(false);
  const isMerge = rec.type === 'merge';

  const accentColor = isMerge
    ? (rec.rte_compliant ? 'var(--secondary)' : '#D97706')
    : 'var(--secondary)';

  const title = isMerge
    ? `${rec.source_school.name} → ${rec.target_school.name}`
    : `Redistribute: ${rec.source_school.name} → ${rec.target_school.name}`;

  const shortTitle = isMerge
    ? `Merge ${rec.source_school.name}`
    : `Redistribute Staff`;

  return (
    <div
      className="rec-card animate-fade-in-up"
      style={{
        animationDelay: `${index * 80}ms`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 'var(--radius-lg)',
      }}
      onClick={() => { setExpanded(e => !e); if (onHighlight) onHighlight(rec); }}
    >
      {/* Header: title + RTE badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 700,
          color: 'var(--primary)',
          lineHeight: 1.3,
          flex: 1,
        }}>
          {compact ? shortTitle : (isMerge ? `${rec.source_school.name} → ${rec.target_school.name}` : shortTitle)}
        </div>

        <span className={rec.rte_compliant ? 'badge badge-green' : 'badge badge-amber'} style={{ flexShrink: 0, fontSize: '0.65rem' }}>
          {rec.rte_compliant ? 'RTE Compliant ✓' : 'Needs Review ⚠'}
        </span>
      </div>

      {/* Stats mini-grid */}
      {isMerge && !compact && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div style={{
            background: 'var(--surface-container)',
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', fontWeight: 500, marginBottom: 2 }}>Saves</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--secondary)' }}>
              {rec.teachers_freed || 1} Teacher{(rec.teachers_freed || 1) !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{
            background: 'var(--surface-container)',
            borderRadius: 8,
            padding: '8px 10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', fontWeight: 500, marginBottom: 2 }}>Distance</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
              {rec.distance_km} km
            </div>
          </div>
        </div>
      )}

      {/* Compact distance */}
      {compact && (
        <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginBottom: 8 }}>
          {rec.distance_km} km apart
        </div>
      )}

      {/* Reasoning */}
      {!compact && rec.reasoning && (
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--on-surface-variant)',
          lineHeight: 1.55,
          marginBottom: 12,
        }}>
          {rec.reasoning}
        </div>
      )}

      {/* Action button */}
      {!compact && (
        isMerge && rec.rte_compliant ? (
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '8px 16px', fontSize: '0.8125rem' }}
            onClick={e => e.stopPropagation()}
          >
            Approve Analysis
          </button>
        ) : isMerge ? (
          <button
            className="btn-outline-teal"
            onClick={e => e.stopPropagation()}
          >
            View Logic
          </button>
        ) : (
          <button
            className="btn-dismiss"
            onClick={e => e.stopPropagation()}
          >
            Dismiss
          </button>
        )
      )}
    </div>
  );
}
