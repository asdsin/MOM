import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { diagnosisAPI, customerAPI } from '../../api';
import { useDiagnosisStore } from '../../store';

// 단계별 색상
const STAGE_COLORS = { 1:'#C0392B', 2:'#1a5fa8', 3:'#1a7a4a' };
const STAGE_LABELS = { 1:'단계 1', 2:'단계 2', 3:'단계 3' };

export default function DiagnosisFlow() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const {
    step, setStep, sessionId, initSession,
    availableModules, setAvailableModules,
    selectedModules, toggleModule, canSelect,
    answers, setAnswer, reset,
  } = useDiagnosisStore();

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // 고객사 정보
  const { data: company } = useQuery({
    queryKey: ['customer', companyId],
    queryFn: () => customerAPI.get(companyId).then(r => r.data),
  });

  // 모듈 목록 불러오기
  const { data: modules } = useQuery({
    queryKey: ['available-modules'],
    queryFn: () => diagnosisAPI.getAvailableModules().then(r => r.data),
  });

  useEffect(() => {
    if (modules) setAvailableModules(modules);
  }, [modules]);

  // 세션 생성 (첫 진입 시)
  useEffect(() => {
    if (companyId && company && !sessionId) {
      diagnosisAPI.createSession({ company_id: Number(companyId) })
        .then(r => initSession(r.data.session_id, companyId, company.company_nm))
        .catch(() => toast.error('세션 생성 실패'));
    }
  }, [company]);

  // ── 모듈 클릭 핸들러 ──────────────────────────────────────
  const handleModuleClick = (module_cd) => {
    const result = toggleModule(module_cd);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.removed?.length > 0) {
      const names = result.removed.map(r => availableModules.find(m => m.module_cd === r)?.module_nm).filter(Boolean);
      toast(`연계 해제: ${names.join(', ')}`, { icon:'ℹ️' });
    }
  };

  // ── Step 1 → Step 2 이동 ──────────────────────────────────
  const goStep2 = async () => {
    if (selectedModules.length === 0) { toast.error('최소 1개 모듈을 선택하세요'); return; }
    setLoading(true);
    try {
      await diagnosisAPI.updateModules(sessionId, selectedModules);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || '모듈 저장 실패');
    } finally { setLoading(false); }
  };

  // ── Step 2 → Step 3 (공수 산정) ───────────────────────────
  const goCalculate = async () => {
    const unanswered = selectedModules.filter(m => !answers[m]);
    if (unanswered.length > 0) {
      const names = unanswered.map(m => availableModules.find(x => x.module_cd === m)?.module_nm).join(', ');
      toast.error(`미답변 항목: ${names}`); return;
    }
    setLoading(true);
    try {
      const { data } = await diagnosisAPI.calculate(sessionId);
      navigate(`/diagnosis/result/${sessionId}`, { state: data });
    } catch (err) {
      toast.error(err.response?.data?.error || '공수 산정 실패');
    } finally { setLoading(false); }
  };

  // ── 예상 공수 미리 계산 ───────────────────────────────────
  const estWeeks = selectedModules.reduce((s, id) => {
    const m = availableModules.find(x => x.module_cd === id);
    return s + (m ? m.default_effort_n : 0);
  }, 2);

  const progPct = selectedModules.length
    ? Math.round(Object.keys(answers).filter(k => selectedModules.includes(k)).length / selectedModules.length * 100)
    : 0;

  // ── 스텝바 ────────────────────────────────────────────────
  const StepBar = () => (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24 }}>
      {[['1','모듈 선택'],['2','현황 진단'],['3','공수 결과']].map(([n, label], i) => {
        const st = n === String(step) ? 'on' : Number(n) < step ? 'done' : 'off';
        return (
          <div key={n} style={{ display:'flex', alignItems:'center', gap:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7,
                          color: st==='on'?'#C0392B':st==='done'?'#1a7a4a':'rgba(192,57,43,.35)',
                          fontWeight:700, fontSize:11 }}>
              <div style={{ width:24, height:24, borderRadius:'50%',
                            border:`2px solid currentColor`, display:'flex',
                            alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800,
                            background: st==='on'?'#C0392B':st==='done'?'#1a7a4a':'transparent',
                            color: st!=='off'?'#fff':'currentColor' }}>{st==='done'?'✓':n}</div>
              {label}
            </div>
            {i < 2 && <div style={{width:32,height:1.5,background:'rgba(192,57,43,.15)',margin:'0 6px'}} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <Layout title={`MOM 수준 진단 — ${company?.company_nm || ''}`}>
      <div style={{ maxWidth: 720 }}>
        <StepBar />

        {/* ══ Step 1: 모듈 선택 ══════════════════════════════ */}
        {step === 1 && (
          <>
            <div style={{ fontSize:14, color:'rgba(26,10,10,.6)', marginBottom:20, lineHeight:1.6 }}>
              도입하고 싶은 모듈을 선택하세요. 선행 모듈이 없으면 후행 모듈은 선택할 수 없습니다.
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 }}>
              {(availableModules || []).map(m => {
                const isSel    = selectedModules.includes(m.module_cd);
                const disabled = !canSelect(m.module_cd) && !isSel;
                const stColor  = STAGE_COLORS[m.stage_no] || '#C0392B';

                return (
                  <div key={m.module_cd} onClick={() => !disabled && handleModuleClick(m.module_cd)} style={{
                    background: isSel ? '#FEF0EE' : '#fff',
                    borderRadius: 16, padding:'16px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
                    border: `2px solid ${isSel ? '#C0392B' : 'transparent'}`,
                    boxShadow: isSel
                      ? 'inset -2px -2px 5px rgba(255,220,210,.80), inset 2px 2px 6px rgba(146,43,33,.18)'
                      : '-2px -2px 5px rgba(255,180,170,.50), 2px 2px 6px rgba(146,43,33,.18)',
                    opacity: disabled ? 0.42 : 1,
                    transition:'all .2s', position:'relative',
                  }}>
                    {isSel && (
                      <div style={{ position:'absolute', top:10, right:10, width:18, height:18,
                                    borderRadius:'50%', background:'#C0392B', display:'flex',
                                    alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:800 }}>✓</div>
                    )}
                    {disabled && (
                      <div style={{ position:'absolute', top:10, right:10, fontSize:14, opacity:.5 }}>🔒</div>
                    )}

                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em',
                                  color:stColor, marginBottom:6,
                                  background:`${stColor}15`, padding:'2px 8px',
                                  borderRadius:20, display:'inline-block' }}>
                      {STAGE_LABELS[m.stage_no]}
                    </div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#1a0a0a', marginBottom:3 }}>{m.module_nm}</div>
                    <div style={{ fontSize:10, color:'rgba(26,10,10,.55)', lineHeight:1.4, marginBottom:8 }}>{m.description}</div>

                    {m.requires?.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                        {m.requires.map(r => {
                          const rm = availableModules.find(x => x.module_cd === r);
                          return (
                            <span key={r} style={{ fontSize:8, fontWeight:700, padding:'1px 6px', borderRadius:8,
                                                   background:'rgba(192,57,43,.08)', color:'#C0392B' }}>
                              필수: {rm?.module_nm || r}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 선택 요약 */}
            <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:16,
                          boxShadow:'-2px -2px 5px rgba(255,180,170,.5), 2px 2px 6px rgba(146,43,33,.18)' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(26,10,10,.4)', letterSpacing:'.08em',
                            textTransform:'uppercase', marginBottom:10 }}>선택된 모듈</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, minHeight:24 }}>
                {selectedModules.length === 0
                  ? <span style={{ fontSize:12, color:'rgba(26,10,10,.35)' }}>아직 선택된 모듈이 없습니다</span>
                  : selectedModules.map(id => {
                      const m = availableModules.find(x => x.module_cd === id);
                      return (
                        <span key={id} style={{ padding:'5px 11px', borderRadius:20, fontSize:11, fontWeight:700,
                                               background:'rgba(192,57,43,.08)', color:'#C0392B' }}>
                          {m?.module_nm}
                        </span>
                      );
                    })
                }
              </div>
              {selectedModules.length > 0 && (
                <div style={{ fontSize:11, color:'rgba(26,10,10,.55)', marginTop:10 }}>
                  예상 총 공수: <strong style={{color:'#C0392B'}}>최대 {estWeeks}주 (진단 후 정확 산정)</strong>
                </div>
              )}
            </div>

            <button onClick={goStep2} disabled={selectedModules.length === 0 || loading} style={{
              width:'100%', padding:14, background:'linear-gradient(135deg,#C0392B,#922B21)',
              color:'#fff', border:'none', borderRadius:14, fontSize:14, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit', opacity: selectedModules.length === 0 ? .4 : 1,
            }}>
              {loading ? '저장 중...' : `다음 — 현황 진단 (${selectedModules.length}개 모듈) →`}
            </button>
          </>
        )}

        {/* ══ Step 2: 현황 진단 ══════════════════════════════ */}
        {step === 2 && (
          <>
            {/* 진행 바 */}
            <div style={{ background:'rgba(192,57,43,.15)', borderRadius:4, height:4,
                          marginBottom:20, overflow:'hidden',
                          boxShadow:'inset 1px 1px 3px rgba(146,43,33,.2)' }}>
              <div style={{ height:'100%', width:`${progPct}%`,
                            background:'linear-gradient(90deg,#C0392B,#922B21)',
                            transition:'width .4s', borderRadius:4 }} />
            </div>
            <div style={{ fontSize:11, color:'rgba(26,10,10,.55)', marginBottom:20 }}>
              {Object.keys(answers).filter(k => selectedModules.includes(k)).length} / {selectedModules.length} 항목 답변 완료
            </div>

            {selectedModules.map(module_cd => {
              const m   = availableModules.find(x => x.module_cd === module_cd);
              const ans = answers[module_cd];
              if (!m) return null;

              return (
                <div key={module_cd} style={{ background:'#fff', borderRadius:16, padding:'18px',
                                              marginBottom:12, display:'flex', alignItems:'flex-start', gap:12,
                                              boxShadow:'-2px -2px 5px rgba(255,180,170,.5), 2px 2px 6px rgba(146,43,33,.18)' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:800 }}>{m.module_nm}</span>
                      <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20,
                                     background:`${STAGE_COLORS[m.stage_no]}15`,
                                     color:STAGE_COLORS[m.stage_no] }}>{STAGE_LABELS[m.stage_no]}</span>
                    </div>
                    <div style={{ fontSize:12, fontWeight:600, color:'#1a0a0a', marginBottom:3, lineHeight:1.5 }}>
                      {availableModules.find(x => x.module_cd === module_cd)?.questions?.[0]?.question_txt
                        || `${m.module_nm}를 현재 시스템으로 관리하고 있나요?`}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(26,10,10,.45)', marginBottom:10 }}>
                      {m.description}
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      {['y','n'].map(v => (
                        <button key={v} onClick={() => setAnswer(module_cd, v)} style={{
                          flex:1, padding:9, borderRadius:10, fontFamily:'inherit',
                          fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .15s',
                          background: ans===v
                            ? (v==='y' ? 'rgba(26,122,74,.08)' : 'rgba(192,57,43,.07)')
                            : '#f8f8f8',
                          border: `1.5px solid ${ans===v ? (v==='y'?'rgba(26,122,74,.4)':'rgba(192,57,43,.4)') : 'rgba(192,57,43,.2)'}`,
                          color: ans===v ? (v==='y'?'#1a7a4a':'#C0392B') : 'rgba(26,10,10,.65)',
                        }}>
                          {v==='y' ? '✅ 예 (있음)' : '❌ 아니오 (없음)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ display:'flex', gap:10, marginTop:18 }}>
              <button onClick={() => setStep(1)} style={{
                padding:'12px 18px', background:'#fff', color:'rgba(26,10,10,.6)',
                border:'1.5px solid rgba(192,57,43,.28)', borderRadius:14, fontSize:13,
                fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              }}>← 모듈 재선택</button>
              <button onClick={goCalculate} disabled={loading} style={{
                flex:1, padding:13, background:'linear-gradient(135deg,#C0392B,#922B21)',
                color:'#fff', border:'none', borderRadius:14, fontSize:14, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
              }}>
                {loading ? '산정 중...' : '공수 산정 →'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
