import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import SchoolMap from '../components/SchoolMap';
import RecommendationCard from '../components/RecommendationCard';
import ChatInterface from '../components/ChatInterface';
import AnalyticsView from '../components/AnalyticsView';
import ReportsView from '../components/ReportsView';

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      icon: 'dashboard' },
  { id: 'analytics', label: 'Analytics', icon: 'leaderboard' },
  { id: 'insights',  label: 'Insights',  icon: 'psychology' },
  { id: 'reports',   label: 'Reports',   icon: 'description' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('home');
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  const [districts, setDistricts]             = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);   // full district object
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);
  const [districtSearchInput, setDistrictSearchInput] = useState('');
  const districtMenuRef = useRef(null);
  
  // ── Chat state ─────────────────────────────────────────────────────────
  const [chatHistories, setChatHistories] = useState({});

  const defaultWelcomeMessage = (districtName, textContent) => ({
    id: 'welcome',
    role: 'assistant',
    type: 'text',
    content: textContent || `Good morning, Director. I've analyzed the latest staff distribution reports for ${districtName}. How can I assist you with resource optimization today?`,
    cards: [],
    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  });

  const activeDistrictId = selectedDistrict?.id || 'all';
  const activeDistrictName = selectedDistrict?.name || 'this constituency';
  
  const currentChat = chatHistories[activeDistrictId] || {
    messages: [defaultWelcomeMessage(activeDistrictName)],
    usedPrompts: new Set()
  };

  const handleSetMessages = (updater) => {
    setChatHistories(prev => {
      const chat = prev[activeDistrictId] || { messages: [defaultWelcomeMessage(activeDistrictName)], usedPrompts: new Set() };
      return {
        ...prev,
        [activeDistrictId]: {
          ...chat,
          messages: typeof updater === 'function' ? updater(chat.messages) : updater
        }
      };
    });
  };

  const handleSetUsedPrompts = (updater) => {
    setChatHistories(prev => {
      const chat = prev[activeDistrictId] || { messages: [defaultWelcomeMessage(activeDistrictName)], usedPrompts: new Set() };
      return {
        ...prev,
        [activeDistrictId]: {
          ...chat,
          usedPrompts: typeof updater === 'function' ? updater(chat.usedPrompts) : updater
        }
      };
    });
  };

  // ── Data state ─────────────────────────────────────────────────────────
  const [schools, setSchools]               = useState([]);
  const [stats, setStats]                   = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [switching, setSwitching]           = useState(false); // district switch in-progress
  const [error, setError]                   = useState(null);
  const [loaded, setLoaded]                 = useState(false);
  
  const [searchInput, setSearchInput]       = useState('');
  const [isSearching, setIsSearching]       = useState(false);

  // ── Close district menu on outside click ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (districtMenuRef.current && !districtMenuRef.current.contains(e.target)) {
        setDistrictMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Step 1: Load available districts on mount ──────────────────────────
  useEffect(() => {
    api.getDistricts()
      .then(data => {
        const list = data.districts || [];
        setDistricts(list);
        if (list.length > 0) {
          setSelectedDistrict(list[0]); // default to first district
        }
      })
      .catch(err => {
        setError(`Could not load districts: ${err.message}`);
        setLoading(false);
      });
  }, []);

  // ── Step 2: Fetch school + rec data whenever selectedDistrict changes ──
  const fetchDistrictData = useCallback(async (district) => {
    if (!district) return;
    try {
      setSwitching(true);
      setError(null);

      const [schoolsData, recsData, dashData, insightData] = await Promise.all([
        api.getSchools(district.id),
        api.getRecommendations(district.id),
        api.getDashboard(district.id),
        api.getInsights(district.id)
      ]);

      // Clear old data first so nothing stale remains on screen
      setSchools([]);
      setStats(null);
      setRecommendations([]);

      setSchools(schoolsData.schools || []);
      setStats(dashData || {});
      setRecommendations(recsData.recommendations || []);
      
      // Update chat history with insight if empty
      setChatHistories(prev => {
        if (!prev[district.id] || prev[district.id].messages.length <= 1) {
          return {
            ...prev,
            [district.id]: {
              messages: [defaultWelcomeMessage(district.name, insightData.insight)],
              usedPrompts: new Set()
            }
          };
        }
        return prev;
      });

      if (!loaded) {
        setTimeout(() => setLoaded(true), 50);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to backend. Make sure the FastAPI server is running on port 8000.');
    } finally {
      setLoading(false);
      setSwitching(false);
    }
  }, [loaded]);

  useEffect(() => {
    if (selectedDistrict && !searchInput) {
      fetchDistrictData(selectedDistrict);
    }
  }, [selectedDistrict]); // intentionally not including fetchDistrictData to avoid loop

  // ── Search Effect ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchInput.trim()) {
      if (selectedDistrict) fetchDistrictData(selectedDistrict);
      return;
    }
    
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchSchools(searchInput);
        setSchools(results || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    
    return () => clearTimeout(delay);
  }, [searchInput]);

  // ── District selector handler ──────────────────────────────────────────
  const handleDistrictSelect = (district) => {
    if (district.id === selectedDistrict?.id) {
      setDistrictMenuOpen(false);
      return;
    }
    setSelectedDistrict(district);
    setDistrictMenuOpen(false);
    setDistrictSearchInput('');
  };

  // ── Derived stats ──────────────────────────────────────────────────────
  const totalSchools     = stats?.total_schools     ?? (loading ? '—' : '0');
  const zeroEnrollment   = stats?.zero_enrollment_schools ?? (loading ? '—' : '0');
  const singleTeacher    = stats?.single_teacher_schools
    ?? schools.filter(s => s.teacher_count === 1).length
    ?? (loading ? '—' : '0');
  const studentsAffected = stats?.students_affected ?? (loading ? '—' : '0');

  const mergeRecs  = recommendations.filter(r => r.type === 'merge');
  const redistRecs = recommendations.filter(r => r.type === 'redistribute');

  // ── Overlay for district switch ────────────────────────────────────────
  const isBusy = loading || switching;

  return (
    <div className="app-shell">

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside className="sidebar">
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.01em' }}>SchoolSync</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2, opacity: 0.8 }}>
              Governance Engine
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-link ${activeNav === item.id ? 'active' : ''}`}
              style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => { setActiveNav(item.id); setSelectedRecommendation(null); }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: activeNav === item.id ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <a className="nav-link" href="#" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>help</span>
            <span style={{ fontSize: '0.875rem' }}>Support</span>
          </a>
          <button className="nav-link" style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            <span style={{ fontSize: '0.875rem' }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ══ MAIN CANVAS ══════════════════════════════════════════════════ */}
      <main className="main-canvas">

        {/* TOP BAR */}
        <header className="topbar">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, maxWidth: 640 }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--on-surface-variant)' }}>search</span>
              <input 
                className="search-input" 
                type="text" 
                placeholder="Search schools, constituencies..." 
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {isSearching && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--outline-variant)', borderTopColor: 'var(--secondary)', animation: 'spin 0.7s linear infinite' }} />
              )}
            </div>

            {/* ── DISTRICT SELECTOR ─────────────────────────────────── */}
            <div style={{ position: 'relative' }} ref={districtMenuRef}>
              <button
                onClick={() => setDistrictMenuOpen(o => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1px solid ${districtMenuOpen ? 'var(--secondary)' : 'var(--outline-variant)'}`,
                  background: districtMenuOpen ? 'var(--secondary-container)' : 'var(--surface-container-lowest)',
                  color: districtMenuOpen ? 'var(--on-secondary-container)' : 'var(--on-surface-variant)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                {selectedDistrict ? `${selectedDistrict.name}` : 'Select District'}
                <span className="material-symbols-outlined" style={{ fontSize: 16, marginLeft: 2, transition: 'transform 0.15s', transform: districtMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>expand_more</span>
              </button>

              {/* Dropdown menu */}
              {districtMenuOpen && (
                <div
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    minWidth: 240,
                    background: 'var(--surface-container-lowest)',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: 10,
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 200,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                    <div style={{ position: 'relative' }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--on-surface-variant)' }}>search</span>
                      <input 
                        type="text" 
                        placeholder="Search district or state..." 
                        value={districtSearchInput}
                        onChange={e => setDistrictSearchInput(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px 6px 28px',
                          borderRadius: 6,
                          border: '1px solid var(--outline-variant)',
                          background: 'var(--surface-container-low)',
                          color: 'var(--on-surface)',
                          fontSize: '0.8125rem',
                          fontFamily: 'Inter, sans-serif',
                          outline: 'none',
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div style={{ padding: '6px 12px 4px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 }}>
                    Districts / Constituencies
                  </div>
                  <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                  {districts.length === 0 ? (
                    <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Loading…</div>
                  ) : (
                    districts.filter(d => 
                      (d.name || '').toLowerCase().includes(districtSearchInput.toLowerCase()) || 
                      (d.state || '').toLowerCase().includes(districtSearchInput.toLowerCase())
                    ).map(d => (
                      <button
                        key={`${d.state}-${d.id}`}
                        onClick={() => handleDistrictSelect(d)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '9px 14px',
                          border: 'none',
                          background: selectedDistrict?.id === d.id ? 'var(--secondary-container)' : 'transparent',
                          color: selectedDistrict?.id === d.id ? 'var(--on-secondary-container)' : 'var(--on-surface)',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '0.875rem',
                          fontWeight: selectedDistrict?.id === d.id ? 700 : 400,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (selectedDistrict?.id !== d.id) e.currentTarget.style.background = 'var(--surface-container-low)'; }}
                        onMouseLeave={e => { if (selectedDistrict?.id !== d.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: selectedDistrict?.id === d.id ? 'var(--secondary)' : 'var(--on-surface-variant)' }}>
                          {selectedDistrict?.id === d.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                        </span>
                        <div>
                          <div>{d.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', opacity: 0.7 }}>{d.state}</div>
                        </div>
                      </button>
                    ))
                  )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Switching spinner */}
            {switching && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 500 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--secondary-container)', borderTopColor: 'var(--secondary)', animation: 'spin 0.7s linear infinite' }} />
                Switching…
              </div>
            )}
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
            </button>
            <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>settings</span>
            </button>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-container)', border: '2px solid var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--on-primary-container)', cursor: 'pointer' }}>
              D
            </div>
          </div>
        </header>

        {/* ── CONTENT AREA ───────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 40px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            position: 'relative',
          }}
        >
          {/* District switch loading overlay */}
          {switching && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(251, 248, 250, 0.7)',
              backdropFilter: 'blur(3px)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--secondary-container)', borderTopColor: 'var(--secondary)', animation: 'spin 0.7s linear infinite' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--secondary)' }}>
                  Loading {selectedDistrict?.name} data…
                </div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div style={{ padding: '14px 18px', background: 'var(--error-container)', border: '1px solid rgba(186, 26, 26, 0.3)', borderRadius: 'var(--radius-md)', color: 'var(--on-error-container)', fontSize: '0.875rem', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>warning</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Backend connection error</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{error}</div>
              </div>
            </div>
          )}

          {/* ── STAT CARDS ─────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {isBusy && !loaded ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)' }} />
              ))
            ) : (
              <>
                <StatCard icon="school"    label="Total Schools"    value={typeof totalSchools === 'number' ? totalSchools.toLocaleString() : totalSchools}       badge="In Range"    sub={stats?.active_pct ? `${stats.active_pct}% Active Status` : '98.2% Active Status'} color="navy"  delay={0}   />
                <StatCard icon="person_off" label="Zero-Enrollment" value={typeof zeroEnrollment === 'number' ? zeroEnrollment.toLocaleString() : zeroEnrollment}  badge="Critical"    sub="Requiring immediate audit"    color="red"   delay={80}  />
                <StatCard icon="people"    label="Single-Teacher"   value={typeof singleTeacher === 'number' ? singleTeacher.toLocaleString() : singleTeacher}      badge="Warning"     sub="85% in rural clusters"        color="amber" delay={160} />
                <StatCard icon="groups"    label="Students Affected" value={typeof studentsAffected === 'number' ? studentsAffected.toLocaleString() : studentsAffected} badge="High Impact" sub="By proposed optimizations"    color="navy"  delay={240} />
              </>
            )}
          </div>

          {/* ── HOME TAB ────────────────────────────────── */}
          {activeNav === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: 520 }}>
              {/* Map */}
              <div style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', height: 480 }}>
                {loading && !loaded ? (
                  <div className="skeleton" style={{ width: '100%', height: '100%', minHeight: 480, borderRadius: 'var(--radius-lg)' }} />
                ) : (
                  <SchoolMap
                    schools={schools}
                    recommendations={recommendations}
                    mapCenter={selectedDistrict?.center?.length ? selectedDistrict.center : undefined}
                    mapZoom={selectedDistrict?.zoom}
                  />
                )}
              </div>

              {/* Priority Actions */}
              <div style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--red)' }}>warning</span>
                  Top Priority Actions
                </h3>
                
                {isBusy && !loaded ? (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="skeleton" style={{ height: 60, flex: 1, borderRadius: 8 }} />
                    <div className="skeleton" style={{ height: 60, flex: 1, borderRadius: 8 }} />
                  </div>
                ) : recommendations.length === 0 ? (
                  <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>No priority actions needed at this time.</div>
                ) : (
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                    {recommendations.slice(0, 3).map((rec, idx) => {
                      const primarySchool = rec.source_school?.name || rec.school?.name || 'Unknown';
                      const isMerge = rec.type === 'merge';
                      return (
                        <button 
                          key={idx}
                          onClick={() => {
                            setSelectedRecommendation(rec);
                            setActiveNav('insights');
                          }}
                          style={{
                            flex: 1,
                            minWidth: 250,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            background: 'var(--surface-container)',
                            border: '1px solid var(--outline-variant)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            fontFamily: 'Inter, sans-serif'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--secondary)'; e.currentTarget.style.background = 'var(--surface-container-low)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; e.currentTarget.style.background = 'var(--surface-container)'; }}
                        >
                          <div style={{ 
                            width: 32, height: 32, borderRadius: 8, 
                            background: isMerge ? 'rgba(211, 47, 47, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                            color: isMerge ? 'var(--red)' : 'var(--amber)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                              {isMerge ? 'merge' : 'move_group'}
                            </span>
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {primarySchool}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {isMerge ? `Merge with ${rec.target_school?.name}` : `Redistribute teachers to ${rec.target_school?.name}`}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ────────────────────────────────── */}
          {activeNav === 'analytics' && (
            <AnalyticsView 
              selectedDistrict={selectedDistrict} 
              schools={schools} 
              loading={isBusy && !loaded} 
            />
          )}

          {/* ── REPORTS TAB ────────────────────────────────── */}
          {activeNav === 'reports' && (
            <ReportsView 
              selectedDistrict={selectedDistrict} 
              stats={stats} 
              schools={schools} 
              recommendations={recommendations} 
              loading={isBusy && !loaded} 
            />
          )}

          {/* ── AI INSIGHTS TAB ────────────────────────────────────────── */}
          {activeNav === 'insights' && (
            <div className="animate-fade-in" style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 580, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface-container-lowest)', flexShrink: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'white', fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--primary)' }}>AI Insights Chat</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
                    {selectedDistrict?.name} · {recommendations.length} recommendations loaded
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  {selectedDistrict && <span className="badge badge-teal" style={{ fontSize: '0.65rem' }}>{selectedDistrict.name}</span>}
                </div>
              </div>

              {isBusy ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 40 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                    Loading {selectedDistrict?.name} recommendations…
                  </div>
                </div>
              ) : (
                <ChatInterface 
                  recommendations={recommendations} 
                  districtName={selectedDistrict?.name} 
                  preloadedRecommendation={selectedRecommendation}
                  messages={currentChat.messages}
                  setMessages={handleSetMessages}
                  usedPrompts={currentChat.usedPrompts}
                  setUsedPrompts={handleSetUsedPrompts}
                />
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer style={{ padding: '16px 40px', borderTop: '1px solid var(--outline-variant)', background: 'var(--surface-container-lowest)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', opacity: 0.7 }}>
            © 2024 SchoolSync. Ministry of Education — Governance Portal.
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service', 'Data Security'].map(link => (
              <a key={link} href="#" style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', fontWeight: link === 'Data Security' ? 700 : 400, transition: 'color var(--transition-fast)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--on-surface-variant)'}
              >{link}</a>
            ))}
          </div>
        </footer>
      </main>

      {/* FAB */}
      <button title="Manual Audit" style={{ position: 'fixed', bottom: 32, right: 32, width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(9, 20, 38, 0.35)', cursor: 'pointer', zIndex: 100, transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(9, 20, 38, 0.45)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(9, 20, 38, 0.35)'; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
      </button>
    </div>
  );
}
