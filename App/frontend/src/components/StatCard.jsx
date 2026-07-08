import React from 'react';

/**
 * StatCard — Matches Stitch design:
 *  - Top row: icon box (left) + status badge (right)
 *  - Label (small, uppercase, muted)
 *  - Large bold number
 *  - Sub-label (muted)
 *  - Hover: lift + shadow increase
 */

const ICON_MAP = {
  school: 'school',
  zero:   'person_off',
  single: 'diversity_3',
  students: 'groups',
};

const BADGE_CONFIG = {
  'In Range':    { cls: 'badge-green' },
  'Critical':    { cls: 'badge-red' },
  'Warning':     { cls: 'badge-amber' },
  'High Impact': { cls: 'badge-navy' },
};

export default function StatCard({
  icon,        // material symbol name OR emoji fallback
  label,
  value,
  sub,
  badge,       // e.g. "In Range", "Critical", "Warning", "High Impact"
  color = 'navy',   // 'navy' | 'red' | 'teal' | 'amber'
  delay = 0,
}) {
  const colorConfig = {
    navy: {
      iconBg:   'rgba(9, 20, 38, 0.08)',
      iconColor: 'var(--primary)',
      valueColor: 'var(--primary)',
    },
    red: {
      iconBg:   'var(--error-container)',
      iconColor: 'var(--error)',
      valueColor: 'var(--error)',
    },
    teal: {
      iconBg:   'var(--secondary-container)',
      iconColor: 'var(--secondary)',
      valueColor: 'var(--secondary)',
    },
    amber: {
      iconBg:   'rgba(245, 158, 11, 0.12)',
      iconColor: '#D97706',
      valueColor: '#D97706',
    },
  };

  const c = colorConfig[color] || colorConfig.navy;
  const badgeCls = (badge && BADGE_CONFIG[badge]?.cls) || 'badge-navy';

  // Determine if icon is a material symbol name (no emoji)
  const isMaterial = icon && !icon.match(/\p{Emoji}/u);

  return (
    <div
      className="stat-card animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top row: icon + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        {/* Icon */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: c.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isMaterial ? (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: c.iconColor, fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              {icon}
            </span>
          ) : (
            <span style={{ fontSize: 20 }}>{icon}</span>
          )}
        </div>

        {/* Status badge */}
        {badge && (
          <span className={`badge ${badgeCls}`} style={{ fontSize: '0.7rem' }}>
            {badge}
          </span>
        )}
      </div>

      {/* Label */}
      <div style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        color: 'var(--on-surface-variant)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: 4,
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '2rem',
        fontWeight: 800,
        color: c.valueColor,
        lineHeight: 1.1,
        letterSpacing: '-0.01em',
        animation: 'count-up 0.5s ease both',
        animationDelay: `${delay + 150}ms`,
      }}>
        {value}
      </div>

      {/* Sub-label */}
      {sub && (
        <div style={{
          fontSize: '0.72rem',
          color: 'var(--on-surface-variant)',
          marginTop: 6,
          fontWeight: 500,
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}
