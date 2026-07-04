import React from 'react';

/**
 * RecommendationCard — displays a single recommendation from the engine.
 * Type 'merge' → purple/blue accent
 * Type 'redistribute' → green accent
 * rte_compliant → green badge vs amber warning badge
 */
export default function RecommendationCard({ rec, index = 0, compact = false }) {
  const isMerge = rec.type === 'merge';

  const typeConfig = {
    merge: {
      icon: '🔀',
      label: 'Merge Recommended',
      color: '#818cf8',
      glow: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(129, 140, 248, 0.2)',
    },
    redistribute: {
      icon: '👤',
      label: 'Teacher Redistribution',
      color: '#34d399',
      glow: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(52, 211, 153, 0.2)',
    },
  };

  const cfg = typeConfig[rec.type] || typeConfig.merge;

  return (
    <div
      className="animate-fade-in-up"
      style={{
        animationDelay: `${index * 80}ms`,
        background: 'var(--color-bg-card)',
        border: `1px solid ${cfg.border}`,
        borderRadius: 'var(--radius-md)',
        padding: compact ? '14px 16px' : '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: `var(--shadow-card), 0 0 20px ${cfg.glow}`,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: cfg.glow,
            border: `1px solid ${cfg.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}>
            {cfg.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: cfg.color }}>
              {cfg.label}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              {rec.distance_km} km apart
            </div>
          </div>
        </div>

        {/* RTE Badge */}
        <span className={rec.rte_compliant ? 'badge badge-green' : 'badge badge-amber'}>
          {rec.rte_compliant ? '✓ RTE Compliant' : '⚠ Check Distance'}
        </span>
      </div>

      {/* School names */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        padding: '10px 12px',
        flexWrap: 'wrap',
      }}>
        {/* Source */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
            {isMerge ? 'Close' : 'From'}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {rec.source_school.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {rec.source_school.block}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ color: cfg.color, fontSize: 18, flexShrink: 0 }}>→</div>

        {/* Target */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
            {isMerge ? 'Merge Into' : 'To'}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {rec.target_school.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            {rec.target_school.block}
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {!compact && (
        <div style={{
          fontSize: '0.77rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.55,
          borderLeft: `2px solid ${cfg.border}`,
          paddingLeft: 10,
        }}>
          {rec.reasoning}
        </div>
      )}
    </div>
  );
}
