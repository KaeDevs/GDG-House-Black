import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create nodes (represent schools)
    const nodes = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 3 + 2,
      color: ['#818cf8', '#34d399', '#fbbf24', '#f87171'][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.7 + 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color + Math.round(n.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Soft glow
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = n.color + '14';
        ctx.fill();
      });

      // Update positions
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const features = [
    {
      icon: '🗺',
      title: 'Geospatial Mapping',
      desc: 'Interactive Leaflet maps with color-coded school markers and merge-line overlays.',
      color: '#818cf8',
    },
    {
      icon: '⚖',
      title: 'RTE Compliance Engine',
      desc: 'Validates every recommendation against RTE Act distance thresholds (1km / 3km).',
      color: '#34d399',
    },
    {
      icon: '👤',
      title: 'Teacher Optimization',
      desc: 'Greedily matches surplus teachers from merged schools to understaffed ones.',
      color: '#fbbf24',
    },
    {
      icon: '✦',
      title: 'AI Insights Chat',
      desc: 'Ask questions in natural language and get formatted recommendation cards instantly.',
      color: '#c084fc',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradient-hero)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Canvas particles background */}
      <canvas ref={canvasRef} style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.7,
        pointerEvents: 'none',
      }} />

      {/* Gradient orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Navbar */}
      <nav style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 48px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
          }}>
            🏫
          </div>
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
              SchoolSync
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Resource Rationalization Engine
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="badge badge-green">Hackathon MVP</span>
          <button
            id="nav-launch-btn"
            className="btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            Launch Dashboard →
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 24px 40px',
      }}>
        {/* Pill badge */}
        <div
          className="animate-fade-in"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 16px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--color-indigo-400)',
            marginBottom: 28,
            letterSpacing: '0.04em',
          }}
        >
          <span style={{ animation: 'pulse-glow 2s infinite', display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }} />
          Chennai Constituency · 25 Schools · RTE Act Compliant
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in-up"
          style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 900,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            lineHeight: 1.08,
            maxWidth: 820,
            marginBottom: 24,
            animationDelay: '100ms',
          }}
        >
          Smarter Schools,{' '}
          <span style={{
            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Optimized
          </span>{' '}
          Resources
        </h1>

        <p
          className="animate-fade-in-up"
          style={{
            fontSize: '1.1rem',
            color: 'var(--color-text-secondary)',
            maxWidth: 560,
            marginBottom: 40,
            lineHeight: 1.7,
            animationDelay: '200ms',
          }}
        >
          A constituency-level school resource rationalization engine that identifies
          merge opportunities, teacher imbalances, and RTE compliance gaps — all on an
          interactive map.
        </p>

        <div
          className="animate-fade-in-up"
          style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', animationDelay: '300ms' }}
        >
          <button
            id="hero-cta-btn"
            className="btn-primary"
            style={{ padding: '14px 32px', fontSize: '1rem' }}
            onClick={() => navigate('/dashboard')}
          >
            🚀 Open Dashboard
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '14px 28px', fontSize: '1rem' }}
            onClick={() => window.open('http://localhost:8000/docs', '_blank')}
          >
            📄 API Docs
          </button>
        </div>

        {/* Stat pills */}
        <div
          className="animate-fade-in-up"
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 56,
            flexWrap: 'wrap',
            justifyContent: 'center',
            animationDelay: '400ms',
          }}
        >
          {[
            { val: '25', label: 'Schools Mapped', color: '#818cf8' },
            { val: '5', label: 'Merge Candidates', color: '#f87171' },
            { val: '4', label: 'Overloaded Schools', color: '#fbbf24' },
            { val: 'RTE', label: 'Act Compliant', color: '#34d399' },
          ].map(stat => (
            <div key={stat.label} style={{
              textAlign: 'center',
              padding: '16px 24px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backdropFilter: 'blur(12px)',
              minWidth: 110,
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color, fontFamily: 'Plus Jakarta Sans', lineHeight: 1 }}>
                {stat.val}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '48px 48px 64px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}>
        {features.map((f, i) => (
          <div
            key={f.title}
            className="card animate-fade-in-up"
            style={{
              padding: '20px',
              animationDelay: `${500 + i * 80}ms`,
              borderColor: `${f.color}22`,
            }}
          >
            <div style={{
              fontSize: 26,
              marginBottom: 12,
              background: `${f.color}18`,
              width: 48,
              height: 48,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-text-primary)' }}>
              {f.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
