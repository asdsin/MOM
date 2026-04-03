import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { customerAPI, diagnosisAPI } from '../api';
import { STAT_COLORS } from '../constants';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: customers, isLoading: custLoading, isError: custError } = useQuery({
    queryKey: ['customers'],
    queryFn:  () => customerAPI.list({ limit: 100 }).then(r => r.data),
  });

  const { data: sessions, isLoading: sessLoading, isError: sessError } = useQuery({
    queryKey: ['sessions'],
    queryFn:  () => diagnosisAPI.getSessions().then(r => r.data),
  });

  if (custLoading || sessLoading) {
    return (
      <Layout title="대시보드">
        <div className="loading-spinner">불러오는 중...</div>
      </Layout>
    );
  }

  if (custError || sessError) {
    return (
      <Layout title="대시보드">
        <div className="empty-state">데이터를 불러오는데 실패했습니다.</div>
      </Layout>
    );
  }

  const total        = customers?.total || 0;
  const completed    = sessions?.filter(s => s.status === 'completed').length || 0;
  const inProgress   = sessions?.filter(s => s.status === 'in_progress').length || 0;
  const recentList   = customers?.data?.slice(0, 6) || [];

  const stats = [
    { label: '총 고객사',   value: total,             icon: '🏭', color: STAT_COLORS[0] },
    { label: '진단 완료',   value: completed,          icon: '✅', color: STAT_COLORS[1] },
    { label: '진단 진행중', value: inProgress,         icon: '⚡', color: STAT_COLORS[2] },
    { label: '이번달 신규', value: recentList.length,  icon: '📋', color: STAT_COLORS[3] },
  ];

  return (
    <Layout title="대시보드">
      {/* 통계 카드 */}
      <div className="grid-4 mb-lg">
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="icon">{s.icon}</div>
            <div className="value" style={{ color: s.color }}>{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 최근 고객사 + 빠른 진단 */}
      <div className="grid-2" style={{ gap: 20 }}>
        <div className="card-outer">
          <div className="flex-between mb-md">
            <div className="section-title">최근 고객사</div>
            <button onClick={() => navigate('/customers/new')} className="btn-primary-pill">
              + 등록
            </button>
          </div>
          {recentList.length === 0
            ? <div className="empty-state">등록된 고객사가 없습니다</div>
            : recentList.map(c => (
              <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="data-row">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.company_nm}</div>
                  <div className="text-xs" style={{ color: 'var(--t3)', marginTop: 2 }}>
                    {c.industry_type || '업종 미지정'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {c.erp_yn && <span className="badge-erp">ERP</span>}
                  {c.mes_yn && <span className="badge-mes">MES</span>}
                </div>
              </div>
            ))}
        </div>

        {/* 빠른 진단 시작 */}
        <div className="card-cta">
          <div style={{ fontSize: 30, marginBottom: 12 }}>🎯</div>
          <div className="font-black" style={{ fontSize: 18, letterSpacing: '-.02em', marginBottom: 8 }}>
            MOM 수준 진단
          </div>
          <div className="text-sm" style={{ color: 'var(--t2)', lineHeight: 1.6, marginBottom: 20 }}>
            고객사를 선택하고 모듈별 현황을 답변하면<br/>
            도입 단계 · 우선순위 · 공수를 자동으로 산정합니다.
          </div>
          <button onClick={() => navigate('/customers')} className="btn-primary"
                  style={{ alignSelf: 'flex-start' }}>
            고객사 선택하기 →
          </button>
        </div>
      </div>
    </Layout>
  );
}
