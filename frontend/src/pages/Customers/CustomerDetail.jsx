import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { customerAPI } from '../../api';

export default function CustomerDetail() {
  const { id }  = useParams();
  const nav     = useNavigate();

  const { data: company, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn:  () => customerAPI.get(id).then(r => r.data),
  });

  if (isLoading) return (
    <Layout title="고객사 상세">
      <div style={{padding:40, color:'rgba(26,10,10,.4)', textAlign:'center'}}>불러오는 중...</div>
    </Layout>
  );
  if (!company)  return (
    <Layout title="고객사 상세">
      <div style={{padding:40}}>고객사를 찾을 수 없습니다</div>
    </Layout>
  );

  const SYS_BADGES = [
    { key:'erp_yn', label:'ERP', color:'#1a5fa8' },
    { key:'mes_yn', label:'MES', color:'#1a7a4a' },
    { key:'wms_yn', label:'WMS', color:'#b7600a' },
    { key:'plc_yn', label:'PLC/IoT', color:'#7B241C' },
  ];

  return (
    <Layout title={company.company_nm}>
      <div style={{ maxWidth:760 }}>
        {/* 기본 정보 */}
        <div style={{
          background:'#fff', borderRadius:20, padding:'24px', marginBottom:16,
          boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <div>
              <div style={{fontSize:22, fontWeight:900, letterSpacing:'-.02em', marginBottom:6}}>
                {company.company_nm}
              </div>
              <div style={{fontSize:12, color:'rgba(26,10,10,.5)'}}>{company.industry_type || '업종 미지정'}</div>
            </div>
            <button onClick={() => nav(`/diagnosis/${id}`)} style={{
              padding:'11px 20px', background:'linear-gradient(135deg,#C0392B,#922B21)',
              color:'#fff', border:'none', borderRadius:14, fontSize:13, fontWeight:700,
              cursor:'pointer',
            }}>MOM 수준 진단 →</button>
          </div>

          <div style={{display:'flex', gap:6, marginTop:14, flexWrap:'wrap'}}>
            {SYS_BADGES.filter(b => company[b.key]).map(b => (
              <span key={b.key} style={{
                fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:10,
                background:`${b.color}18`, color:b.color,
              }}>{b.label}</span>
            ))}
          </div>

          {company.emp_cnt && (
            <div style={{marginTop:12, fontSize:12, color:'rgba(26,10,10,.55)'}}>
              종업원 수: <strong>{company.emp_cnt}명</strong>
            </div>
          )}
        </div>

        {/* 공장 구조 */}
        {company.sites?.length > 0 && (
          <div style={{
            background:'#fff', borderRadius:20, padding:'22px',
            boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
            marginBottom:16,
          }}>
            <div style={{
              fontSize:12, fontWeight:700, color:'#C0392B', letterSpacing:'.08em',
              textTransform:'uppercase', marginBottom:14,
            }}>공장 구조</div>

            {company.sites.map(site => (
              <div key={site.id} style={{marginBottom:14}}>
                <div style={{fontSize:13, fontWeight:700, marginBottom:6}}>📍 {site.site_nm}</div>
                {site.factories?.map(f => (
                  <div key={f.id} style={{paddingLeft:16, marginBottom:6}}>
                    <div style={{fontSize:12, color:'rgba(26,10,10,.7)', marginBottom:4}}>
                      🏭 {f.factory_nm}
                    </div>
                    {f.lines?.map(l => (
                      <div key={l.id} style={{
                        paddingLeft:16, fontSize:11, color:'rgba(26,10,10,.5)', marginBottom:2,
                      }}>
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
          <div style={{
            background:'#fff', borderRadius:20, padding:'22px',
            boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
          }}>
            <div style={{
              fontSize:12, fontWeight:700, color:'#C0392B', letterSpacing:'.08em',
              textTransform:'uppercase', marginBottom:14,
            }}>연동 시스템</div>

            {company.extSystems.map(s => (
              <div key={s.id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 0', borderBottom:'1px solid rgba(192,57,43,.07)',
              }}>
                <div>
                  <span style={{fontSize:13, fontWeight:700}}>{s.system_type}</span>
                  {s.product_nm && <span style={{fontSize:11, color:'rgba(26,10,10,.5)', marginLeft:8}}>{s.product_nm}</span>}
                </div>
                <span style={{
                  fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:10,
                  background: s.api_open_yn ? 'rgba(26,122,74,.1)' : 'rgba(192,57,43,.08)',
                  color: s.api_open_yn ? '#1a7a4a' : '#C0392B',
                }}>
                  {s.api_open_yn ? '✅ API 개방' : '🔒 API 미개방'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!company.sites?.length && !company.extSystems?.length && (
          <div style={{
            background:'rgba(192,57,43,.04)', borderRadius:14, padding:'20px',
            textAlign:'center', fontSize:13, color:'rgba(26,10,10,.4)',
          }}>
            공장 구조와 시스템 정보를 추가하면 더 정확한 진단이 가능합니다.
          </div>
        )}
      </div>
    </Layout>
  );
}
