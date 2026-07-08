import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Landing — Matches Stitch design:
 *  - Light background #fbf8fa
 *  - Top nav: SchoolSync logo + nav links + Sign In button
 *  - Hero: left-aligned headline, two CTAs
 *  - Right: mock dashboard preview card
 *  - Feature section: 3-column
 *  - Footer
 */
export default function Landing() {
  const navigate   = useNavigate();
  const canvasRef  = useRef(null);
  const [activeSection, setActiveSection] = useState('Home');

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.id === 'hero') setActiveSection('Home');
          else if (entry.target.id === 'solutions') setActiveSection('Solutions');
          else if (entry.target.id === 'governance') setActiveSection('Governance');
        }
      });
    }, { threshold: 0.5 });

    const hero = document.getElementById('hero');
    const sol = document.getElementById('solutions');
    const gov = document.getElementById('governance');

    if (hero) observer.observe(hero);
    if (sol) observer.observe(sol);
    if (gov) observer.observe(gov);

    return () => observer.disconnect();
  }, []);

  // Subtle animated connection graph in the hero background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes = Array.from({ length: 20 }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.3,
      vy:    (Math.random() - 0.5) * 0.3,
      r:     Math.random() * 2.5 + 1.5,
      color: ['#006a61', '#0D9488', '#1e293b', '#c5c6cd'][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, 106, 97, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        });
      });

      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color + Math.round(n.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
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
      icon: 'account_tree',
      title: 'Data Federation',
      desc: 'Incorporate diverse datasets from across the educational spectrum into a single unified truth.',
    },
    {
      icon: 'bar_chart',
      title: 'Predictive Modeling',
      desc: 'Simulate resource shifts and school merges with instant impact analysis on student accessibility.',
    },
    {
      icon: 'verified_user',
      title: 'Secure Governance',
      desc: 'Enterprise-grade security ensuring all citizen and student data is protected by sovereign protocols.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Canvas background */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.6 }} />

      {/* ── TOP NAV ──────────────────────────────────────────── */}
      <nav style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 48px',
        borderBottom: '1px solid var(--outline-variant)',
        background: 'rgba(251, 248, 250, 0.9)',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.01em' }}>SchoolSync</span>
        </div>

        {/* Center links */}
        <div style={{ display: 'flex', gap: 32 }}>
          {['Home', 'Solutions', 'Governance'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              onClick={(e) => {
                e.preventDefault();
                if (link === 'Home') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  const el = document.getElementById(link.toLowerCase());
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                fontSize: '0.875rem',
                fontWeight: activeSection === link ? 600 : 400,
                color: activeSection === link ? 'var(--primary)' : 'var(--on-surface-variant)',
                textDecoration: activeSection === link ? 'underline' : 'none',
                textUnderlineOffset: 4,
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => { if (activeSection !== link) e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right: Sign In */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: '0.875rem', fontFamily: 'Inter' }}
            onClick={() => navigate('/dashboard')}
          >
            Sign In
          </button>
          <button
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid var(--outline-variant)',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontFamily: 'Inter',
              color: 'var(--on-surface-variant)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.color = 'var(--on-surface-variant)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 4 }}>notifications</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle' }}>settings</span>
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <div id="hero" style={{
        position: 'relative',
        zIndex: 10,
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 48,
        alignItems: 'center',
        padding: '80px 80px 60px',
        maxWidth: 1280,
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Left: Text */}
        <div className="animate-fade-in-up">
          {/* Ministry badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--secondary-container)',
            color: 'var(--on-secondary-container)',
            borderRadius: 'var(--radius-full)',
            padding: '5px 14px',
            fontSize: '0.78rem',
            fontWeight: 600,
            marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block' }} />
            Ministry of Education Official
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 4vw, 3.2rem)',
            fontWeight: 900,
            color: 'var(--primary)',
            lineHeight: 1.1,
            marginBottom: 20,
            letterSpacing: '-0.02em',
          }}>
            Turn school data into{' '}
            <span style={{ color: 'var(--secondary)' }}>action — automatically.</span>
          </h1>

          <p style={{
            fontSize: '1rem',
            color: 'var(--on-surface-variant)',
            lineHeight: 1.7,
            marginBottom: 36,
            maxWidth: 480,
          }}>
            The premium rationalization engine for Constituency resource management.
            Aligning infrastructure, faculty, and student needs with mathematical precision.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <button
              id="hero-cta-btn"
              className="btn-primary"
              style={{ padding: '13px 28px', fontSize: '0.9375rem', borderRadius: 10 }}
              onClick={() => navigate('/dashboard')}
            >
              Get Started
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
            <button
              className="btn-secondary"
              style={{ padding: '13px 24px', fontSize: '0.9375rem', borderRadius: 10 }}
              onClick={() => window.open('http://localhost:8000/docs', '_blank')}
            >
              Watch Demo
            </button>
          </div>

          {/* Trust line */}
          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, opacity: 0.7 }}>
              Trusted by State Boards
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {['State Board', 'District Council', 'Ministry'].map(org => (
                <div key={org} style={{
                  padding: '7px 16px',
                  borderRadius: 8,
                  background: 'var(--surface-container)',
                  border: '1px solid var(--outline-variant)',
                  fontSize: '0.78rem',
                  color: 'var(--on-surface-variant)',
                  fontWeight: 500,
                }}>
                  {org}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Dashboard preview card */}
        <div className="animate-slide-in" style={{ animationDelay: '200ms' }}>
          <div style={{
            background: 'var(--surface-container-lowest)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
          }}>
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary)' }}>Regional Resource Heatmap</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>Constituency: West Bengal VII</div>
              </div>
              <span className="badge badge-green">Live Sync</span>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'var(--surface-container-low)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontWeight: 500, marginBottom: 4 }}>Utilization Rate</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>94.2%</div>
                {/* Progress bar */}
                <div style={{ marginTop: 8, height: 4, background: 'var(--outline-variant)', borderRadius: 9999 }}>
                  <div style={{ width: '94.2%', height: '100%', background: 'var(--secondary)', borderRadius: 9999 }} />
                </div>
              </div>
              <div style={{ background: 'var(--surface-container-low)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontWeight: 500, marginBottom: 4 }}>Faculty Ratio</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>1:32</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: 4, fontWeight: 600 }}>↑ Optimized</div>
              </div>
            </div>

            {/* AI insight float */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--primary)',
              borderRadius: 12,
              padding: '10px 14px',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'white', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'white' }}>AI Insight</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>Rationalization ready for 12 rural districts.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SOLUTIONS SECTION ─────────────────────────────────── */}
      <div id="solutions" style={{ position: 'relative', zIndex: 10, padding: '80px 48px', maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>Intelligent Solutions</h2>
        <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          SchoolSync provides automated, data-driven recommendations for school closures, mergers, and teacher redistribution, ensuring resources are allocated exactly where they are needed most.
        </p>
      </div>

      {/* ── GOVERNANCE SECTION ─────────────────────────────────── */}
      <div id="governance" style={{ position: 'relative', zIndex: 10, padding: '80px 48px', maxWidth: 1120, margin: '0 auto', textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>Transparent Governance</h2>
        <p style={{ fontSize: '1rem', color: 'var(--on-surface-variant)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Maintain full compliance with RTE distance limits. Every optimization proposal is fully traceable, auditable, and designed to maximize student accessibility.
        </p>
      </div>

      {/* ── FEATURES SECTION ─────────────────────────────────── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        background: 'var(--surface-container-lowest)',
        borderTop: '1px solid var(--outline-variant)',
        padding: '72px 80px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0,
          maxWidth: 1120,
          margin: '0 auto',
        }}>
          {features.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-in-up"
              style={{
                padding: '32px 40px',
                borderRight: i < features.length - 1 ? '1px solid var(--outline-variant)' : 'none',
                animationDelay: `${i * 100}ms`,
              }}
            >
              <div style={{
                width: 44, height: 44,
                borderRadius: 10,
                background: 'var(--surface-container)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--secondary)' }}>{f.icon}</span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        padding: '24px 48px',
        borderTop: '1px solid var(--outline-variant)',
        background: 'var(--surface-container-lowest)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>SchoolSync</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>
            © 2024 SchoolSync. Ministry of Education — Governance Portal.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {['Privacy Policy', 'Terms of Service', 'Data Security'].map(link => (
            <a
              key={link}
              href="#"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--on-surface-variant)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
