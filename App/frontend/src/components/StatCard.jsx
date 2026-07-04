import React, { useEffect, useRef } from 'react';

/**
 * StatCard — animated metric card for the dashboard header
 * Props: icon, label, value, color ('indigo'|'emerald'|'amber'|'red'), delay (ms)
 */
export default function StatCard({ icon, label, value, sub, color = 'indigo', delay = 0 }) {
  const colorMap = {
    indigo: {
      gradient: 'linear-gradient(135deg, #6366f1, #818cf8)',
      glow: 'rgba(99, 102, 241, 0.2)',
      border: 'rgba(129, 140, 248, 0.25)',
      text: '#818cf8',
    },
    emerald: {
      gradient: 'linear-gradient(135deg, #10b981, #34d399)',
      glow: 'rgba(16, 185, 129, 0.18)',
      border: 'rgba(52, 211, 153, 0.25)',
      text: '#34d399',
    },
    amber: {
      gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
      glow: 'rgba(245, 158, 11, 0.18)',
      border: 'rgba(251, 191, 36, 0.25)',
      text: '#fbbf24',
    },
    red: {
      gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
      glow: 'rgba(239, 68, 68, 0.18)',
      border: 'rgba(248, 113, 113, 0.25)',
      text: '#f87171',
    },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div
      className="card animate-fade-in-up"
      style={{
        animationDelay: `${delay}ms`,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        borderColor: c.border,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow blob */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: c.glow,
        filter: 'blur(30px)',
        pointerEvents: 'none',
      }} />

      {/* Icon box */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: c.gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        flexShrink: 0,
        boxShadow: `0 4px 16px ${c.glow}`,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: c.text,
          lineHeight: 1.1,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          animation: 'count-up 0.6s ease both',
          animationDelay: `${delay + 200}ms`,
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            marginTop: 4,
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
