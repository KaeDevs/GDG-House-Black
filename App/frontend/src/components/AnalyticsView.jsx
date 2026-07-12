import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AnalyticsView({ selectedDistrict, schools, loading }) {
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async () => {
      setLoadingAll(true);
      try {
        const data = await api.getAnalytics(selectedDistrict?.id || null);
        if (mounted) {
          setEnrollmentData(data.enrollment_data || []);
          setComparisonData(data.comparison_data || []);
        }
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        if (mounted) setLoadingAll(false);
      }
    };
    fetchAnalytics();
    return () => { mounted = false; };
  }, [selectedDistrict]);

  // 3. Table Data
  const sortedAndFilteredSchools = useMemo(() => {
    let filtered = schools.filter(s => 
      s.name.toLowerCase().includes(filterText.toLowerCase()) ||
      s.school_id.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [schools, filterText, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const statusColors = {
    'healthy': 'var(--teal)',
    'needs_audit': 'var(--amber)',
    'understaffed': 'var(--orange)',
    'zero_enrollment': 'var(--red)',
    'single_teacher': 'var(--amber)',
    'infrastructure_gap': 'var(--purple)'
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: 520 }}>
      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Enrollment Distribution */}
        <div style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--primary)', fontWeight: 600 }}>
            Enrollment Distribution - {selectedDistrict?.name}
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            {loading ? (
               <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'var(--surface-container-low)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '0.875rem' }} />
                  <Bar dataKey="count" name="Schools" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* District Comparison */}
        <div style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--primary)', fontWeight: 600 }}>
            At-Risk Schools by District
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            {loadingAll ? (
               <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                  <XAxis dataKey="district" tick={{ fontSize: 12, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'var(--surface-container-low)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)', fontSize: '0.875rem' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="zeroEnrollment" name="Zero Enrollment" fill="var(--red)" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="singleTeacher" name="Single Teacher" fill="var(--amber)" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="missingElectricity" name="No Electricity" fill="var(--on-surface-variant)" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="missingWater" name="No Water" fill="var(--blue)" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="missingToilet" name="No Toilet" fill="var(--purple)" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="missingWall" name="No Wall" fill="var(--brown)" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="missingLibrary" name="No Library" fill="var(--teal)" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)', fontWeight: 600 }}>School Directory</h3>
          
          <div style={{ position: 'relative', width: 250 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--on-surface-variant)' }}>search</span>
            <input 
              className="search-input" 
              type="text" 
              placeholder="Filter schools..." 
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, background: 'var(--surface-container)' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-container-lowest)', zIndex: 1, borderBottom: '2px solid var(--outline-variant)' }}>
              <tr>
                {[{key: 'name', label: 'School Name'}, {key: 'enrollment', label: 'Enrollment'}, {key: 'teacher_count', label: 'Teachers'}, {key: 'status', label: 'Status'}].map(col => (
                  <th 
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    style={{ padding: '12px 20px', color: 'var(--on-surface-variant)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      <span className="material-symbols-outlined" style={{ fontSize: 16, opacity: sortConfig.key === col.key ? 1 : 0.3 }}>
                        {getSortIcon(col.key) || 'unfold_more'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                 <tr>
                   <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center' }}>
                     <div className="skeleton" style={{ height: 160, borderRadius: 8, width: '100%' }} />
                   </td>
                 </tr>
              ) : sortedAndFilteredSchools.length === 0 ? (
                 <tr>
                   <td colSpan={4} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                     No schools found matching your filter.
                   </td>
                 </tr>
              ) : (
                sortedAndFilteredSchools.map((s, i) => (
                  <tr key={s.school_id} style={{ borderBottom: '1px solid var(--outline-variant)', background: i % 2 === 0 ? 'var(--surface-container-lowest)' : 'var(--surface-container)' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 500, color: 'var(--on-surface)' }}>{s.name} <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginLeft: 6 }}>{s.school_id}</span></td>
                    <td style={{ padding: '12px 20px' }}>{s.enrollment}</td>
                    <td style={{ padding: '12px 20px' }}>{s.teacher_count}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 4, 
                        padding: '4px 8px', borderRadius: 12, 
                        fontSize: '0.75rem', fontWeight: 600, 
                        background: `${statusColors[s.status] || 'var(--outline-variant)'}1A`, 
                        color: statusColors[s.status] || 'var(--on-surface-variant)' 
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[s.status] || 'currentColor' }} />
                        {s.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
