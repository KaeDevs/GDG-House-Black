import React from 'react';

export default function ReportsView({ selectedDistrict, stats, schools, recommendations, loading }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const totalSchools     = stats?.total_schools     ?? (loading ? '—' : '0');
  const zeroEnrollment   = stats?.zero_enrollment_schools ?? (loading ? '—' : '0');
  const singleTeacher    = stats?.single_teacher_schools
    ?? schools.filter(s => s.teacher_count === 1).length
    ?? (loading ? '—' : '0');
  const studentsAffected = stats?.students_affected ?? (loading ? '—' : '0');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ 
      background: 'var(--surface-container-lowest)', 
      border: '1px solid var(--outline-variant)', 
      borderRadius: 'var(--radius-lg)', 
      padding: '40px 60px', 
      boxShadow: 'var(--shadow-sm)',
      minHeight: 520,
      fontFamily: 'serif', // Gives it a more formal document feel
      color: 'var(--on-surface)'
    }}>
      {/* Action Bar (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 30 }}>
        <button 
          onClick={() => {
            if (!schools || schools.length === 0) return;
            const headers = ['School ID', 'Name', 'Enrollment', 'Teachers', 'Status', 'District', 'Type'];
            const csvRows = [headers.join(',')];
            schools.forEach(s => {
              csvRows.push(`${s.school_id},"${s.name}",${s.enrollment},${s.teacher_count},${s.status},${s.district},${s.school_type}`);
            });
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SchoolSync_Report_${selectedDistrict?.name || 'All'}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
            background: 'var(--surface-container-highest)', color: 'var(--on-surface)',
            border: '1px solid var(--outline)', borderRadius: 8, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
          Export CSV
        </button>
        <button 
          onClick={handlePrint}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>print</span>
          Export PDF
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="skeleton" style={{ height: 40, width: '40%' }} />
          <div className="skeleton" style={{ height: 20, width: '20%' }} />
          <div className="skeleton" style={{ height: 100, width: '100%', marginTop: 20 }} />
          <div className="skeleton" style={{ height: 200, width: '100%', marginTop: 20 }} />
        </div>
      ) : (
        <div id="printable-report">
          {/* Header */}
          <div style={{ borderBottom: '2px solid var(--on-surface)', paddingBottom: 20, marginBottom: 30 }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>
              Resource Rationalization Report
            </h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', color: 'var(--on-surface-variant)' }}>
              <div><strong>District:</strong> {selectedDistrict?.name || 'All Districts'}</div>
              <div><strong>Date:</strong> {currentDate}</div>
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 8, marginBottom: 16 }}>Key Metrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, textAlign: 'center' }}>
              <div style={{ padding: 16, border: '1px solid var(--outline-variant)', borderRadius: 8 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{totalSchools}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Total Schools</div>
              </div>
              <div style={{ padding: 16, border: '1px solid var(--outline-variant)', borderRadius: 8 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{zeroEnrollment}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Zero-Enrollment</div>
              </div>
              <div style={{ padding: 16, border: '1px solid var(--outline-variant)', borderRadius: 8 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{singleTeacher}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Single-Teacher</div>
              </div>
              <div style={{ padding: 16, border: '1px solid var(--outline-variant)', borderRadius: 8 }}>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{studentsAffected}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Students Affected</div>
              </div>
            </div>
          </div>

          {/* Recommendations Summary */}
          <div>
            <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 8, marginBottom: 16 }}>Recommendations Summary</h2>
            {recommendations.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--on-surface-variant)' }}>No recommendations available for this district.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--on-surface)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px' }}>Type</th>
                    <th style={{ padding: '8px 4px' }}>Primary School</th>
                    <th style={{ padding: '8px 4px' }}>Action Summary</th>
                    <th style={{ padding: '8px 4px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((rec, idx) => {
                    const primarySchool = rec.source_school?.name || rec.school?.name || 'Unknown';
                    const summary = rec.type === 'merge' 
                      ? `Merge with ${rec.target_school?.name}`
                      : `Redistribute ${rec.excess_teachers} teacher(s) to ${rec.target_school?.name}`;
                    
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                        <td style={{ padding: '12px 4px', textTransform: 'capitalize' }}>{rec.type}</td>
                        <td style={{ padding: '12px 4px' }}>{primarySchool}</td>
                        <td style={{ padding: '12px 4px' }}>{summary}</td>
                        <td style={{ padding: '12px 4px' }}>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: 12, 
                            fontSize: '0.8rem', 
                            background: rec.status === 'approved' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                            color: rec.status === 'approved' ? '#00c853' : '#ff9800',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600
                          }}>
                            {rec.status === 'approved' ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid var(--outline-variant)', fontSize: '0.8rem', color: 'var(--on-surface-variant)', textAlign: 'center' }}>
            Generated by SchoolSync Governance Engine. For official use only.
          </div>
        </div>
      )}
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
