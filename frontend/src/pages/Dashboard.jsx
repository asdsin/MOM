import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { customerAPI, diagnosisAPI } from '../api';

const STAT_COLORS = ['#C0392B','#1a7a4a','#1a5fa8','#b7600a'];

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn:  () => customerAPI.list({ limit: 100 }).then(r => r.data),
  });

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn:  () => diagnosisAPI.getSessions().then(r => r.data),
  });

  const total        = customers?.total || 0;
  const completed    = sessions?.filter(s => s.status === 'completed').length || 0;
  const inProgress   = sessions?.filter(s => s.status === 'in_progress').length || 0;
  const recentList   = customers?.data?.slice(0, 6) || [];

  const stats = [
    { label:'총 고객사',       value: total,      icon:'🏭', color: STAT_COLORS[0] },
    { label:'진단 완료',       value: completed,   icon:'✅', color: STAT_COLORS[1] },
    { label:'진단 진행중',     value: inProgress,  icon:'⚡', color: STAT_COLORS[2] },
    { label:'이번달 신규',     value: recentList.length, icon:'📋', color: STAT_COLORS[3] },
  ];

  return (
    <Layout title="대시보드">
      {/* 통계 카드 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        {stats.map((s,i) => (
          <div key={i} style={{
            background:'#fff', borderRadius:20, padding:'22px 20px',
            boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
            borderTop:`3px solid ${s.color}`,
          }}>
            <div style={{fontSize:24, marginBottom:8}}>{s.icon}</div>
            <div style={{fontSize:28, fontWeight:900, color:s.color, letterSpacing:'-.03em'}}>
              {s.value}
            </div>
            <div style={{fontSize:12, color:'rgba(26,10,10,.55)', marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* 최근 고객사 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <div style={{background:'#fff', borderRadius:20, padding:'22px',
                     boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18}}>
            <div style={{fontSize:13, fontWeight:700, color:'#C0392B', letterSpacing:'.08em', textTransform:'uppercase'}}>
              최근 고객사
            </div>
            <button onClick={() => navigate('/customers/new')} style={{
              padding:'6px 14px', background:'#C0392B', color:'#fff', border:'none',
              borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
            }}>+ 등록</button>
          </div>
          {recentList.length === 0
            ? <div style={{color:'rgba(26,10,10,.4)', fontSize:13, padding:'20px 0', textAlign:'center'}}>
                등록된 고객사가 없습니다
              </div>
            : recentList.map(c => (
              <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'12px 0', borderBottom:'1px solid rgba(192,57,43,.08)',
                cursor:'pointer',
              }}>
                <div>
                  <div style={{fontSize:13, fontWeight:700}}>{c.company_nm}</div>
                  <div style={{fontSize:11, color:'rgba(26,10,10,.45)', marginTop:2}}>
                    {c.industry_type || '업종 미지정'}
                  </div>
                </div>
                <div style={{display:'flex', gap:5}}>
                  {c.erp_yn && <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:8,background:'rgba(26,95,168,.1)',color:'#1a5fa8'}}>ERP</span>}
                  {c.mes_yn && <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:8,background:'rgba(26,122,74,.1)',color:'#1a7a4a'}}>MES</span>}
                </div>
              </div>
            ))}
        </div>

        {/* 빠른 진단 시작 */}
        <div style={{background:'radial-gradient(ellipse at 30% 30%, #FEF0EE, #fff)',
                     borderRadius:20, padding:'28px 22px',
                     boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
                     display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div style={{fontSize:30, marginBottom:12}}>🎯</div>
          <div style={{fontSize:18, fontWeight:900, letterSpacing:'-.02em', marginBottom:8}}>
            MOM 수준 진단
          </div>
          <div style={{fontSize:13, color:'rgba(26,10,10,.6)', lineHeight:1.6, marginBottom:20}}>
            고객사를 선택하고 모듈별 현황을 답변하면<br/>
            도입 단계 · 우선순위 · 공수를 자동으로 산정합니다.
          </div>
          <button onClick={() => navigate('/customers')} style={{
            padding:'13px 22px', background:'linear-gradient(135deg, #C0392B, #922B21)',
            color:'#fff', border:'none', borderRadius:14, fontSize:14, fontWeight:700,
            cursor:'pointer', alignSelf:'flex-start',
            boxShadow:'0 4px 16px rgba(192,57,43,.28)',
          }}>
            고객사 선택하기 →
          </button>
        </div>
      </div>
    </Layout>
  );
}
