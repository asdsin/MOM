import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { diagnosisAPI } from '../../api';
import { useDiagnosisStore } from '../../store';

const EFFORT_TYPE_LABEL = {
  build:'신규 구축', partial:'부분 개선', api:'API 연동',
  data:'데이터 이관', master:'기준정보', skip:'해당 없음',
};
const EFFORT_TYPE_COLOR = {
  build:'#b7600a', partial:'#1a5fa8', api:'#1a7a4a',
  data:'#1a7a4a',  master:'#b7600a',  skip:'rgba(26,10,10,.35)',
};

export default function DiagnosisResult() {
  const { sessionId } = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();
  const { reset }     = useDiagnosisStore();
  const [curTab, setCurTab] = useState(0);

  // state에 결과 있으면 직접 사용, 없으면 API 조회
  const { data: apiResult } = useQuery({
    queryKey: ['result', sessionId],
    queryFn: () => diagnosisAPI.getResult(sessionId).then(r => r.data),
    enabled: !state,
  });

  const result = state || apiResult;
  if (!result) return <Layout title="진단 결과"><div style={{padding:40, color:'rgba(26,10,10,.4)'}}>불러오는 중...</div></Layout>;

  const sm = result.stage_meta;
  const rows = result.effort_rows || result.module_efforts || [];

  // 엑셀 다운로드 (백엔드 API 연동 → Phase 3에서 추가, 지금은 JSON)
  const handleExport = () => {
    const data = JSON.stringify(result, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `MOM_진단결과_${sessionId}_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('결과 파일 다운로드 완료');
  };

  const TABS = ['공수 상세', '추진 일정', '수집 자료'];

  // 추진 일정 자동 생성
  const buildSchedule = () => {
    const sch = []; let w = 1;
    const push = (weeks, title, body, color) => {
      sch.push({ week:`${w}~${w+Math.max(0,weeks-1)}주`, title, body, color });
      w += Math.max(1, weeks);
    };
    push(2, '기준정보 수집 및 시스템 등록', '현장 방문 → 기준정보 수집 → 엑셀 정제 → 시스템 등록', '#b7600a');
    const buildItems = rows.filter(r=>['build','data','partial'].includes(r.effort_type||r.effort_weeks));
    const buildWks = Math.max(2, Math.round(rows.filter(r=>r.effort_type!=='master').reduce((s,r)=>s+(parseFloat(r.effort_weeks)||0),0)*0.6));
    push(buildWks, '핵심 모듈 개발·배포', rows.filter(r=>r.module_cd!=='common').map(r=>r.module_nm).join('·'), '#1a7a4a');
    const apiItems = rows.filter(r=>r.effort_type==='api');
    if (apiItems.length) push(Math.round(apiItems.reduce((s,r)=>s+(parseFloat(r.effort_weeks)||0),0)*0.75),
      `API 연동 (${apiItems.map(r=>r.module_nm).join('·')})`, 'API 스펙 확인 → 개발 → 테스트', '#1a5fa8');
    push(2, 'UAT 및 현장 검증', '공정·라인별 실제 시나리오 검증. 현장 담당자 피드백 반영.', '#7B241C');
    if (result.stage_no >= 2) push(3, '전체 라인 확산 및 안정화', '파일럿 후 전 라인 확산. 운영 이슈 모니터링.', '#1a7a4a');
    return sch;
  };

  // 수집 자료 체크리스트
  const checklist = result.checklist || [];

  return (
    <Layout title="공수 산정 결과">
      <div style={{ maxWidth:720 }}>

        {/* 판정 카드 */}
        <div style={{
          background: sm?.bg || '#FEF0EE',
          border: `1.5px solid ${sm?.bc || 'rgba(192,57,43,.2)'}`,
          borderRadius: 20, padding:'28px 24px', marginBottom:14, textAlign:'center',
          boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
        }}>
          <span style={{ display:'inline-block', padding:'4px 14px', borderRadius:20, fontSize:11,
                         fontWeight:700, background:sm?.bg, color:sm?.color,
                         border:`1px solid ${sm?.bc}`, marginBottom:14 }}>
            {sm?.badge || `Stage ${result.stage_no}`}
          </span>
          <div style={{ fontSize:22, fontWeight:900, letterSpacing:'-.02em',
                        color:sm?.color||'#C0392B', marginBottom:10 }}>
            {sm?.title}
          </div>
          <div style={{ fontSize:13, color:'rgba(26,10,10,.65)', lineHeight:1.6 }}>{sm?.desc}</div>
        </div>

        {/* 공수 요약 카드 4개 */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
          {[
            { v:`${result.total_weeks_min}~${result.total_weeks_max}주`, l:'총 소요 기간', c:sm?.color||'#C0392B' },
            { v:'2주', l:'기준정보 등록', c:'#b7600a' },
            { v:`${rows.filter(r=>r.module_cd!=='common').reduce((s,r)=>s+(parseFloat(r.effort_weeks)||0),0)}주`, l:'개발·이관·연동', c:'#1a5fa8' },
            { v:`${(result.selected_modules||[]).length}개`, l:'선택 모듈', c:'#1a7a4a' },
          ].map((c,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:16, padding:'16px 14px', textAlign:'center',
                                  boxShadow:'-2px -2px 5px rgba(255,180,170,.5), 2px 2px 6px rgba(146,43,33,.18)' }}>
              <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-.03em', color:c.c, marginBottom:3 }}>{c.v}</div>
              <div style={{ fontSize:11, color:'rgba(26,10,10,.5)', fontWeight:500 }}>{c.l}</div>
            </div>
          ))}
        </div>

        {/* API 경고 */}
        {result.api_warns?.length > 0 && (
          <div style={{ background:'rgba(192,57,43,.05)', border:'1.5px solid rgba(192,57,43,.2)',
                        borderRadius:14, padding:14, marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#C0392B', marginBottom:6 }}>⚠ API 연동 일정 변수</div>
            {result.api_warns.map((w,i) => (
              <div key={i} style={{ fontSize:11, color:'rgba(26,10,10,.65)', lineHeight:1.6 }}>• {w}</div>
            ))}
          </div>
        )}

        {/* 탭 */}
        <div style={{ display:'flex', gap:4, background:'rgba(192,57,43,.1)', borderRadius:14,
                      padding:4, marginBottom:14,
                      boxShadow:'inset -2px -2px 5px rgba(255,220,210,.80), inset 2px 2px 6px rgba(146,43,33,.18)' }}>
          {TABS.map((t,i) => (
            <button key={i} onClick={() => setCurTab(i)} style={{
              flex:1, padding:'9px 4px', borderRadius:10, border:'none',
              fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              background: curTab===i ? '#fff' : 'none',
              color: curTab===i ? '#C0392B' : 'rgba(26,10,10,.55)',
              boxShadow: curTab===i ? '0 1px 4px rgba(192,57,43,.12)' : 'none',
              transition:'all .2s',
            }}>{t}</button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div style={{ background:'#fff', borderRadius:20, padding:'20px',
                      boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
                      marginBottom:16 }}>

          {/* ── 탭 0: 공수 상세 ── */}
          {curTab === 0 && rows.map((r,i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                                  padding:'12px 0', borderBottom:'1px solid rgba(192,57,43,.08)',
                                  gap:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{r.module_nm}</div>
                <div style={{ fontSize:10, color:'rgba(26,10,10,.45)', marginTop:2 }}>{r.reason}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                {r.answer_val && (
                  <span style={{ fontSize:11, color:r.answer_val==='y'?'#1a7a4a':'#C0392B' }}>
                    {r.answer_val==='y' ? '✅ 있음' : '❌ 없음'}
                  </span>
                )}
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:8,
                               background:`${EFFORT_TYPE_COLOR[r.effort_type] || '#888'}18`,
                               color:EFFORT_TYPE_COLOR[r.effort_type] || '#888' }}>
                  {EFFORT_TYPE_LABEL[r.effort_type] || r.effort_type}
                </span>
                <span style={{ fontSize:14, fontWeight:800, color:'#C0392B', minWidth:30, textAlign:'right' }}>
                  {parseFloat(r.effort_weeks) > 0 ? `${r.effort_weeks}주` : '—'}
                </span>
              </div>
            </div>
          ))}
          {curTab === 0 && (
            <div style={{ marginTop:10, fontSize:10, color:'rgba(26,10,10,.4)', padding:8,
                          background:'rgba(192,57,43,.04)', borderRadius:8, lineHeight:1.6 }}>
              ※ 병렬 진행 반영 — 총 기간은 합산의 약 70~75%로 산정합니다.
            </div>
          )}

          {/* ── 탭 1: 추진 일정 ── */}
          {curTab === 1 && buildSchedule().map((s,i,arr) => (
            <div key={i} style={{ position:'relative', paddingLeft:22, paddingBottom: i<arr.length-1?18:0 }}>
              <div style={{ position:'absolute', left:0, top:4, width:10, height:10,
                            borderRadius:'50%', background:s.color }} />
              {i<arr.length-1 && <div style={{ position:'absolute', left:4, top:14, width:2,
                                               height:'calc(100% - 4px)', background:'rgba(192,57,43,.15)' }} />}
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(26,10,10,.4)', marginBottom:2 }}>{s.week}</div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{s.title}</div>
              <div style={{ fontSize:11, color:'rgba(26,10,10,.6)', lineHeight:1.5 }}>{s.body}</div>
            </div>
          ))}

          {/* ── 탭 2: 수집 자료 ── */}
          {curTab === 2 && (
            checklist.length === 0
              ? <div style={{color:'rgba(26,10,10,.4)', fontSize:13, textAlign:'center', padding:'20px 0'}}>
                  수집 자료 정보가 없습니다
                </div>
              : checklist.map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 0',
                                      borderBottom:'1px solid rgba(192,57,43,.08)' }}>
                  <div style={{ width:22, height:22, borderRadius:7, background:`#${c.color}`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:10, fontWeight:800, color:'#fff', flexShrink:0, marginTop:1 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:'#1a0a0a', lineHeight:1.45 }}>{c.text}</div>
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:8,
                                   background:`#${c.color}18`, color:`#${c.color}`,
                                   display:'inline-block', marginTop:4 }}>{c.tag}</span>
                  </div>
                  <div style={{ fontSize:16, flexShrink:0 }}>☐</div>
                </div>
              ))
          )}
        </div>

        {/* 버튼 */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleExport} style={{
            flex:1, padding:15, background:'linear-gradient(135deg,#C0392B,#922B21)',
            color:'#fff', border:'none', borderRadius:14, fontSize:14, fontWeight:700,
            cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center',
            justifyContent:'center', gap:8, boxShadow:'0 4px 16px rgba(192,57,43,.28)',
          }}>📊 결과 저장</button>
          <button onClick={() => { reset(); navigate('/customers'); }} style={{
            flex:1, padding:15, background:'#fff', color:'rgba(26,10,10,.65)',
            border:'1.5px solid rgba(192,57,43,.28)', borderRadius:14, fontSize:14,
            fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          }}>↺ 다시 진단하기</button>
        </div>
      </div>
    </Layout>
  );
}
