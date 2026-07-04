import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import SchoolMap from '../components/SchoolMap';
import RecommendationCard from '../components/RecommendationCard';
import ChatInterface from '../components/ChatInterface';

const TABS = [
  { id: 'map',      label: '🗺  Map View' },
  { id: 'recs',     label: '📋 Recommendations' },
  { id: 'ai',       label: '✦  AI Insights' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('map');
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [schoolsData, recsData] = await Promise.all([
        api.getSchools(),
        api.getRecommendations(),
      ]);

      setSchools(schoolsData.schools || []);
      setStats(schoolsData.stats || {});
      setRecommendations(recsData.recommendations || []);
    } catch (err) {
      setError(err.message || 'Failed to connect to the backend. Make sure the FastAPI server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter recommendations by merge/redistribute
  const mergeRecs = recommendations.filter(r => r.type === 'merge');
  const redistRecs = recommendations.filter(r => r.type === 'redistribute');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <header style={{
        background: 'var(--color-bg-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              transition: 'color var(--transition-fast)',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
          >
            ← Back
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🏫</span>
            <div>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '0.95rem' }}>SchoolSync</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginLeft: 8 }}>Dashboard</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!loading && stats && (
            <span className="badge badge-indigo">
              {stats.total_schools} Schools · Chennai Constituency
            </span>
          )}
          <button
            id="refresh-btn"
            className="btn-secondary"
            onClick={fetchData}
            disabled={loading}
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
          >
            {loading ? '⟳ Loading…' : '⟳ Refresh'}
          </button>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div style={{
          margin: '20px 32px',
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-red-400)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Backend connection error</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{error}</div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{
        padding: '24px 32px 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 16,
      }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 96, borderRadius: 'var(--radius-lg)' }} />
          ))
        ) : stats ? (
          <>
            <StatCard icon="🏫" label="Total Schools"   value={stats.total_schools}          color="indigo"  delay={0}   />
            <StatCard icon="🔴" label="Zero Enrollment" value={stats.zero_enrollment_schools}  color="red"     delay={80}  sub="Merge candidates" />
            <StatCard icon="🟠" label="Overloaded"      value={stats.overloaded_schools}       color="amber"   delay={160} sub="Need extra teacher" />
            <StatCard icon="🟢" label="Healthy Schools" value={stats.healthy_schools}           color="emerald" delay={240} />
            <StatCard icon="📊" label="Avg S:T Ratio"   value={`${stats.avg_student_teacher_ratio}:1`} color="indigo" delay={320} sub={`${stats.total_students} students`} />
          </>
        ) : null}
      </div>

      {/* Tab Bar */}
      <div style={{
        padding: '20px 32px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        borderBottom: '1px solid var(--color-border)',
        marginTop: 8,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              fontSize: '0.85rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--color-indigo-400)' : 'var(--color-text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-indigo-400)' : '2px solid transparent',
              marginBottom: -1,
              borderRadius: '6px 6px 0 0',
              transition: 'all var(--transition-fast)',
              background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.06)' : 'transparent',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => {
              if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            onMouseLeave={e => {
              if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            {tab.label}
          </button>
        ))}

        {!loading && recommendations.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <span className="badge badge-red">{mergeRecs.length} merges</span>
            <span className="badge badge-amber">{redistRecs.length} redistributions</span>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: '0 32px 32px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* ── Map Tab ── */}
        {activeTab === 'map' && (
          <div className="animate-fade-in" style={{ flex: 1, paddingTop: 20, display: 'flex', gap: 16, minHeight: 520 }}>
            {/* Map */}
            <div style={{
              flex: '1 1 auto',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              minHeight: 480,
            }}>
              {loading ? (
                <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', minHeight: 480 }} />
              ) : (
                <SchoolMap schools={schools} recommendations={recommendations} />
              )}
            </div>

            {/* Sidebar: quick stats */}
            <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 20 }}>
                School Summary
              </div>

              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 60 }} />
                ))
              ) : (
                <>
                  {[
                    { status: 'zero_enrollment', label: 'Zero Enrollment', color: '#f87171', count: schools.filter(s => s.status === 'zero_enrollment').length },
                    { status: 'overloaded',       label: 'Overloaded',      color: '#fbbf24', count: schools.filter(s => s.status === 'overloaded').length },
                    { status: 'healthy',          label: 'Healthy',         color: '#34d399', count: schools.filter(s => s.status === 'healthy').length },
                  ].map(item => (
                    <div key={item.status} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: item.color }}>{item.count}</span>
                    </div>
                  ))}

                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 8 }}>
                    Blocks
                  </div>
                  {[...new Set(schools.map(s => s.block))].map(block => {
                    const blockSchools = schools.filter(s => s.block === block);
                    return (
                      <div key={block} style={{
                        padding: '10px 14px',
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{block}</span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{blockSchools.length} schools</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Recommendations Tab ── */}
        {activeTab === 'recs' && (
          <div className="animate-fade-in" style={{ paddingTop: 24 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 180 }} />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                No recommendations generated. Check that the backend is running.
              </div>
            ) : (
              <div>
                {/* Merge section */}
                {mergeRecs.length > 0 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        🔀 School Merges
                      </h2>
                      <span className="badge badge-red">{mergeRecs.length}</span>
                      <div style={{
                        marginLeft: 'auto',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                      }}>
                        {mergeRecs.filter(r => r.rte_compliant).length} of {mergeRecs.length} RTE-compliant
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14, marginBottom: 32 }}>
                      {mergeRecs.map((rec, i) => (
                        <RecommendationCard key={i} rec={rec} index={i} />
                      ))}
                    </div>
                  </>
                )}

                {/* Redistribute section */}
                {redistRecs.length > 0 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        👤 Teacher Redistributions
                      </h2>
                      <span className="badge badge-amber">{redistRecs.length}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14 }}>
                      {redistRecs.map((rec, i) => (
                        <RecommendationCard key={i} rec={rec} index={i} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── AI Insights Tab ── */}
        {activeTab === 'ai' && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: 20,
              flex: 1,
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 520,
            }}
          >
            {/* Chat header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #c084fc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
              }}>
                ✦
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                  SchoolSync AI
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-emerald-400)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Online · {recommendations.length} recommendations loaded
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="badge badge-indigo">Simulated AI · No LLM Cost</span>
              </div>
            </div>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Loading recommendations…</div>
              </div>
            ) : (
              <ChatInterface recommendations={recommendations} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
