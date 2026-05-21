import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { diagnosisAPI, customerAPI } from '../../api';

// 단계별 색상
const STAGE = {
  1: { color:'#C0392B', bg:'rgba(192,57,43,.08)', label:'Stage 1 — 기초 구축' },
  2: { color:'#1a5fa8', bg:'rgba(26,95,168,.08)',  label:'Stage 2 — 핵심 연동' },
  3: { color:'#1a7a4a', bg:'rgba(26,122,74,.08)',  label:'Stage 3 — 통합 자동화' },
  4: { color:'#b7600a', bg:'rgba(183,96,10,.08)',  label:'Stage 4 — AI 최적화' },
};

const S = {
  card: {
    background:'#fff', borderRadius:20, padding:'22px 20px', marginBottom:14,
    boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
  },
};

export default function DiagnosisHistory() {
  const { companyId } = useParams();
  const navigate      = useNavigate();
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [showCompare, setShowCompare] = useState(false);

  const { data: company } = useQuery({
    queryKey: ['customer', companyId],
    queryFn:  () => customerAPI.get(companyId).then(r => r.data),
    enabled:  !!companyId,
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history', companyId],
    queryFn:  () => diagnosisAPI.getHistory(companyId).then(r => r.data),
    enabled:  !!companyId,
  });

  const { data: compareData, isLoading: compareLoading } = useQuery({
    queryKey: ['compare', compareA, compareB],
    queryFn:  () => diagnosisAPI.compare(compareA, compareB).then(r => r.data),
    enabled:  !!(compareA && compareB && showCompare),
  });

  const handleSelectCompare = (sessionId) => {
    if (!compareA) { setCompareA(sessionId); toast('첫 번째 진단 선택됨. 비교할 두 번째를 선택하세요.', { icon:'1️⃣' }); return; }
    if (compareA === sessionId) { setCompareA(null); return; }
    setCompareB(sessionId);
    setShowCompare(true);
  };

  const resetCompare = () => { setCompareA(null); setCompareB(null); setShowCompare(false); };

  const formatDate = (dt) => new Date(dt).toLocaleDateString('ko-KR', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

  return (
    <Layout title={`진단 이력 — ${company?.company_nm || ''}`}>
      <div style={{ maxWidth:860 }}>

        {/* 상단 액션 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:13, color:'rgba(26,10,10,.55)' }}>
            총 <strong style={{color:'#C0392B'}}>{history.length}</strong>회 진단 이력
            {compareA && !compareB && <span style={{marginLeft:12, fontSize:11, color:'#1a5fa8'}}>비교할 두 번째 진단을 선택하세요</span>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {(compareA || compareB) && (
              <button onClick={resetCompare} style={{
                padding:'8px 16px', background:'#fff', color:'rgba(26,10,10,.6)',
                border:'1.5px solid rgba(192,57,43,.25)', borderRadius:20,
                fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              }}>비교 초기화</button>
            )}
            <button onClick={() => navigate(`/diagnosis/${companyId}`)} style={{
              padding:'9px 18px', background:'#C0392B', color:'#fff', border:'none',
              borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
            }}>+ 새 진단 시작</button>
          </div>
        </div>

        {/* ── 비교 결과 ── */}
        {showCompare && compareData && !compareLoading && (
          <ComparePanel data={compareData} onClose={resetCompare} />
        )}

        {/* ── 이력 목록 ── */}
        {isLoading
          ? <div style={{textAlign:'center', padding:40, color:'rgba(26,10,10,.4)'}}>불러오는 중...</div>
          : history.length === 0
            ? <div style={{...S.card, textAlign:'center', padding:40, color:'rgba(26,10,10,.4)'}}>
                아직 진단 이력이 없습니다. 첫 번째 진단을 시작해보세요!
              </div>
            : history.map((h, idx) => {
                const r = h.result;
                const st = STAGE[r?.stage_no] || STAGE[1];
                const isSelA = compareA === h.session_id;
                const isSelB = compareB === h.session_id;
                const isSelected = isSelA || isSelB;

                return (
                  <div key={h.session_id} style={{
                    ...S.card,
                    border: `2px solid ${isSelected ? st.color : 'transparent'}`,
                    background: isSelected ? st.bg : '#fff',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      {/* 왼쪽: 회차 + 날짜 + 결과 */}
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                          <span style={{
                            width:28, height:28, borderRadius:'50%',
                            background: st.color, color:'#fff',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:11, fontWeight:800, flexShrink:0,
                          }}>{history.length - idx}</span>
                          <span style={{ fontSize:12, color:'rgba(26,10,10,.5)' }}>{formatDate(h.created_at)}</span>
                          {h.user_nm && <span style={{ fontSize:11, color:'rgba(26,10,10,.4)' }}>by {h.user_nm}</span>}
                          {isSelA && <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10, background:`${st.color}18`, color:st.color }}>비교 A</span>}
                          {isSelB && <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:10, background:'rgba(26,95,168,.1)', color:'#1a5fa8' }}>비교 B</span>}
                        </div>

                        {r && (
                          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                            <span style={{
                              fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                              background: st.bg, color: st.color,
                            }}>{st.label}</span>
                            <span style={{ fontSize:13, fontWeight:700 }}>
                              {r.total_weeks_min}~{r.total_weeks_max}주
                            </span>
                            <span style={{ fontSize:11, color:'rgba(26,10,10,.5)' }}>
                              {h.module_cnt}개 모듈
                            </span>
                          </div>
                        )}

                        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                          {(h.selected_modules || []).map(m => (
                            <span key={m} style={{
                              fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:8,
                              background:'rgba(192,57,43,.07)', color:'#C0392B',
                            }}>{m}</span>
                          ))}
                        </div>
                      </div>

                      {/* 오른쪽: 액션 버튼 */}
                      <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0, marginLeft:16 }}>
                        <button onClick={() => navigate(`/diagnosis/result/${h.session_id}`)} style={{
                          padding:'7px 14px', background:'rgba(192,57,43,.07)', color:'#C0392B',
                          border:'1px solid rgba(192,57,43,.2)', borderRadius:10,
                          fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                        }}>결과 보기</button>
                        <button onClick={() => window.open(`/api/diagnosis/sessions/${h.session_id}/export-excel`)} style={{
                          padding:'7px 14px', background:'rgba(26,122,74,.07)', color:'#1a7a4a',
                          border:'1px solid rgba(26,122,74,.2)', borderRadius:10,
                          fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                        }}>📊 Excel</button>
                        <button onClick={() => handleSelectCompare(h.session_id)} style={{
                          padding:'7px 14px', background: isSelected ? '#C0392B' : 'rgba(26,95,168,.07)',
                          color: isSelected ? '#fff' : '#1a5fa8',
                          border:`1px solid ${isSelected ? '#C0392B' : 'rgba(26,95,168,.2)'}`,
                          borderRadius:10, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                        }}>{isSelected ? '✓ 선택됨' : '비교 선택'}</button>
                      </div>
                    </div>
                  </div>
                );
              })
        }
      </div>
    </Layout>
  );
}

// ── 비교 패널 컴포넌트 ─────────────────────────────────────────
function ComparePanel({ data, onClose }) {
  const { session_a: a, session_b: b, diff } = data;
  const stA = STAGE[a.stage_no] || STAGE[1];
  const stB = STAGE[b.stage_no] || STAGE[1];
  const formatDate = (dt) => new Date(dt).toLocaleDateString('ko-KR', { month:'short', day:'numeric' });

  return (
    <div style={{
      background:'#fff', borderRadius:20, padding:'22px 20px', marginBottom:20,
      border:'2px solid rgba(192,57,43,.2)',
      boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div style={{ fontSize:14, fontWeight:800 }}>📊 진단 비교 분석</div>
        <button onClick={onClose} style={{
          background:'none', border:'none', cursor:'pointer', fontSize:16, color:'rgba(26,10,10,.4)'
        }}>✕</button>
      </div>

      {/* A vs B 헤더 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 40px 1fr', gap:12, marginBottom:18, alignItems:'center' }}>
        {[{s: a, st: stA, label:'A'}, null, {s: b, st: stB, label:'B'}].map((item, i) => {
          if (!item) return <div key={i} style={{ textAlign:'center', fontSize:18, color:'rgba(26,10,10,.3)' }}>vs</div>;
          const { s, st, label } = item;
          return (
            <div key={i} style={{ background: st.bg, borderRadius:14, padding:'14px', textAlign:'center', border:`1.5px solid ${st.color}` }}>
              <div style={{ fontSize:10, fontWeight:700, color: st.color, marginBottom:4 }}>진단 {label} — {formatDate(s.created_at)}</div>
              <div style={{ fontSize:13, fontWeight:800, color: st.color }}>{st.label}</div>
              <div style={{ fontSize:12, marginTop:4 }}>{s.total_weeks_min}~{s.total_weeks_max}주</div>
            </div>
          );
        })}
      </div>

      {/* 변화 요약 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'단계 변화', value: diff.stage_change.from === diff.stage_change.to ? '변화 없음' : `Stage ${diff.stage_change.from} → ${diff.stage_change.to}`,
            color: diff.stage_change.to > diff.stage_change.from ? '#1a7a4a' : diff.stage_change.to < diff.stage_change.from ? '#C0392B' : 'rgba(26,10,10,.5)' },
          { label:'공수 변화', value: diff.effort_change.delta === 0 ? '변화 없음' : `${diff.effort_change.delta > 0 ? '+' : ''}${diff.effort_change.delta.toFixed(1)}주`,
            color: diff.effort_change.delta > 0 ? '#C0392B' : diff.effort_change.delta < 0 ? '#1a7a4a' : 'rgba(26,10,10,.5)' },
          { label:'모듈 변화', value: `+${diff.modules_added.length} / -${diff.modules_removed.length}`,
            color:'#1a5fa8' },
        ].map((c,i) => (
          <div key={i} style={{ background:'#fafafa', borderRadius:12, padding:'12px', textAlign:'center', border:'1px solid rgba(192,57,43,.1)' }}>
            <div style={{ fontSize:10, color:'rgba(26,10,10,.45)', marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize:16, fontWeight:800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 모듈 추가/제거 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {diff.modules_added.length > 0 && (
          <div style={{ background:'rgba(26,122,74,.05)', borderRadius:12, padding:'12px', border:'1px solid rgba(26,122,74,.15)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#1a7a4a', marginBottom:6 }}>새로 추가된 모듈</div>
            {diff.modules_added.map(m => <div key={m} style={{ fontSize:12, color:'#1a7a4a' }}>✅ {m}</div>)}
          </div>
        )}
        {diff.modules_removed.length > 0 && (
          <div style={{ background:'rgba(192,57,43,.05)', borderRadius:12, padding:'12px', border:'1px solid rgba(192,57,43,.15)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#C0392B', marginBottom:6 }}>제거된 모듈</div>
            {diff.modules_removed.map(m => <div key={m} style={{ fontSize:12, color:'#C0392B' }}>❌ {m}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
