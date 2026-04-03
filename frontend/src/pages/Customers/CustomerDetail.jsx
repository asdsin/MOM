import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { customerAPI } from '../../api';
import { SYS_BADGES } from '../../constants';

export default function CustomerDetail() {
  const { id }  = useParams();
  const nav     = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn:  () => customerAPI.get(id).then(r => r.data),
  });

  if (isLoading) return (
    <Layout title="고객사 상세">
      <div className="loading-spinner">불러오는 중...</div>
    </Layout>
  );
  if (!company)  return (
    <Layout title="고객사 상세">
      <div className="empty-state">고객사를 찾을 수 없습니다</div>
    </Layout>
  );

  return (
    <Layout title={company.company_nm}>
      <div style={{ maxWidth: 760 }}>
        {/* 기본 정보 */}
        <div className="card-outer">
          <div className="flex-between" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="font-black" style={{ fontSize: 22, letterSpacing: '-.02em', marginBottom: 6 }}>
                {company.company_nm}
              </div>
              <div className="text-sm text-muted">{company.industry_type || '업종 미지정'}</div>
            </div>
            <button onClick={() => nav(`/diagnosis/${id}`)} className="btn-primary" style={{ fontSize: 13 }}>
              MOM 수준 진단 →
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {SYS_BADGES.filter(b => company[b.key]).map(b => (
              <span key={b.key} className="badge" style={{ background: `${b.color}18`, color: b.color }}>
                {b.label}
              </span>
            ))}
          </div>

          {company.emp_cnt && (
            <div className="text-sm" style={{ marginTop: 12, color: 'var(--t4)' }}>
              종업원 수: <strong>{company.emp_cnt}명</strong>
            </div>
          )}
        </div>

        {/* 공장 구조 */}
        {company.sites?.length > 0 && (
          <div className="card-outer">
            <div className="section-title">공장 구조</div>

            {company.sites.map(site => (
              <div key={site.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>📍 {site.site_nm}</div>
                {site.factories?.map(f => (
                  <div key={f.id} style={{ paddingLeft: 16, marginBottom: 6 }}>
                    <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 4 }}>
                      🏭 {f.factory_nm}
                    </div>
                    {f.lines?.map(l => (
                      <div key={l.id} className="text-sm text-muted" style={{ paddingLeft: 16, marginBottom: 2 }}>
                        └ {l.line_nm} {l.shift_type ? `(${l.shift_type})` : ''}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* 외부 시스템 */}
        {company.extSystems?.length > 0 && (
          <div className="card-outer">
            <div className="section-title">연동 시스템</div>

            {company.extSystems.map(s => (
              <div key={s.id} className="data-row">
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{s.system_type}</span>
                  {s.product_nm && (
                    <span className="text-sm text-muted" style={{ marginLeft: 8 }}>{s.product_nm}</span>
                  )}
                </div>
                <span className={`badge-sm ${s.api_open_yn ? 'badge-green' : 'badge-red'}`}>
                  {s.api_open_yn ? '✅ API 개방' : '🔒 API 미개방'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!company.sites?.length && !company.extSystems?.length && (
          <div className="empty-hint">
            공장 구조와 시스템 정보를 추가하면 더 정확한 진단이 가능합니다.
          </div>
        )}
      </div>
    </Layout>
  );
}
