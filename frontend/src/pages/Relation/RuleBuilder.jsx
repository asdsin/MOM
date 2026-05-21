import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';
import api from '../../api/axios';

const S = {
  card:  { background: '#fff', borderRadius: 20, padding: '22px', marginBottom: 14, boxShadow: '-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)' },
  label: { fontSize: 11, fontWeight: 700, color: 'rgba(26,10,10,.55)', marginBottom: 5, display: 'block' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(192,57,43,.22)', borderRadius: 11, fontSize: 13, fontFamily: 'inherit', background: '#fdf8f7', outline: 'none', marginBottom: 12 },
  sel:   { padding: '8px 12px', border: '1.5px solid rgba(192,57,43,.22)', borderRadius: 11, fontSize: 12, fontFamily: 'inherit', background: '#fdf8f7', outline: 'none', cursor: 'pointer' },
};
const STAGE_COLOR = { 1: '#C0392B', 2: '#1a5fa8', 3: '#1a7a4a', 4: '#b7600a' };
const STAGE_BG    = { 1: 'rgba(192,57,43,.08)', 2: 'rgba(26,95,168,.08)', 3: 'rgba(26,122,74,.08)', 4: 'rgba(183,96,10,.08)' };

export default function RuleBuilder() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ rule_cd: '', stage_no: 1, result_stage: 1, priority: 0, required_modules: [], min_ratio: 0 });
  const [simMods, setSimMods]     = useState([]);
  const [simAnswers, setSimAnswers] = useState({});
  const [simResult, setSimResult]   = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  const { data: mods = [] }   = useQuery({ queryKey: ['master-modules'], queryFn: () => masterAPI.getModules().then(r => r.data) });
  const { data: stages = [] } = useQuery({ queryKey: ['stages'], queryFn: () => masterAPI.getStages().then(r => r.data) });
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['judgment-rules'],
    queryFn: () => api.get('/api/master/judgment-rules').then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: d => api.post('/api/master/judgment-rules', d),
    onSuccess: () => { qc.invalidateQueries(['judgment-rules']); toast.success('룰 추가 완료'); setShowForm(false); },
    onError: e => toast.error(e.response?.data?.error || '추가 실패 — API 확인 필요'),
  });
  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/api/master/judgment-rules/${id}`),
    onSuccess: () => { qc.invalidateQueries(['judgment-rules']); toast.success('삭제 완료'); },
  });

  const getNm = cd => mods.find(m => m.module_cd === cd)?.module_nm || cd;

  // 시뮬레이션
  const runSim = async () => {
    if (!simMods.length) { toast.error('모듈을 선택하세요'); return; }
    setSimLoading(true);
    try {
      const { data } = await api.post('/api/diagnosis/simulate', { selected_modules: simMods, answers: simAnswers });
      setSimResult(data);
    } catch {
      // 폴백: 로컬 계산
      const hasKpi  = simMods.includes('kpi');
      const hasErp  = simMods.includes('erp') && simAnswers['erp'] === 'y';
      const hasQual = simMods.includes('qual');
      const stage = hasKpi ? 3 : (hasQual || hasErp) ? 2 : 1;
      setSimResult({ stage_no: stage, stage_meta: { badge: `Stage ${stage}`, title: stages.find(s => s.stage_no === stage)?.title_txt || '' } });
    } finally { setSimLoading(false); }
  };

  return (
    <div>
      {/* 성숙도 단계 조회 */}
      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>성숙도 단계 정의</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {stages.map(s => (
            <div key={s.id} style={{ background: STAGE_BG[s.stage_no] || '#f8f8f8', borderRadius: 14, padding: '14px', border: `1.5px solid ${STAGE_COLOR[s.stage_no] || '#888'}30` }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: STAGE_COLOR[s.stage_no], marginBottom: 6 }}>{s.stage_no}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: STAGE_COLOR[s.stage_no], marginBottom: 4 }}>{s.badge_txt}</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{s.title_txt}</div>
              <div style={{ fontSize: 10, color: 'rgba(26,10,10,.5)', lineHeight: 1.5 }}>{s.desc_txt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 판정 룰 목록 */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>판정 룰 ({rules.length}개)</div>
          <button onClick={() => { setForm({ rule_cd: '', stage_no: 1, result_stage: 1, priority: 0, required_modules: [], min_ratio: 0 }); setShowForm(true); }} style={{ padding: '7px 16px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ 룰 추가</button>
        </div>

        {isLoading
          ? <div style={{ textAlign: 'center', padding: 20, color: 'rgba(26,10,10,.4)' }}>불러오는 중...</div>
          : rules.length === 0
            ? <div style={{ padding: '16px', background: 'rgba(192,57,43,.04)', borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'rgba(26,10,10,.5)', lineHeight: 1.7 }}>
                  💡 <strong>기본 판정 룰</strong>은 시드 데이터로 자동 등록됩니다.<br />
                  &nbsp;&nbsp;&nbsp;룰 목록 API (<code>GET /api/master/judgment-rules</code>)는 Phase 3 백엔드에서 추가됩니다.<br />
                  &nbsp;&nbsp;&nbsp;현재는 아래 시뮬레이터로 판정 로직을 테스트할 수 있습니다.
                </div>
              </div>
            : rules.map(r => {
              const cond = r.condition_json || {};
              return (
                <div key={r.id} style={{ padding: '14px', background: STAGE_BG[r.result_stage] || '#f8f8f8', borderRadius: 14, marginBottom: 8, border: `1px solid ${STAGE_COLOR[r.result_stage] || '#888'}25` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#888' }}>우선순위 {r.priority}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: STAGE_COLOR[r.result_stage] }}>→ Stage {r.result_stage} 판정</span>
                      </div>
                      <div style={{ fontSize: 12, background: 'rgba(0,0,0,.04)', borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#1a5fa8', fontWeight: 700 }}>IF</span>
                        {cond.required_modules?.length > 0 && <span> 선택모듈 ⊇ [{cond.required_modules.map(getNm).join(', ')}]</span>}
                        {cond.min_ratio > 0 && <span> AND Y응답비율 ≥ {Math.round(cond.min_ratio * 100)}%</span>}
                        {!cond.required_modules?.length && !cond.min_ratio && <span style={{ color: 'rgba(26,10,10,.4)' }}> 기본값 (항상 적용)</span>}
                        <span> </span>
                        <span style={{ color: '#1a7a4a', fontWeight: 700 }}>THEN</span>
                        <span style={{ color: STAGE_COLOR[r.result_stage], fontWeight: 700 }}> Stage {r.result_stage}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteMut.mutate(r.id)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(192,57,43,.2)', background: 'rgba(192,57,43,.06)', color: '#C0392B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>삭제</button>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* 룰 추가 폼 */}
      {showForm && (
        <div style={{ ...S.card, border: '1.5px solid rgba(192,57,43,.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>새 판정 룰 추가 (IF-THEN)</div>
          <div style={{ background: 'rgba(192,57,43,.04)', borderRadius: 12, padding: '14px', marginBottom: 14, fontFamily: 'monospace', fontSize: 12 }}>
            <span style={{ color: '#1a5fa8', fontWeight: 700 }}>IF</span> 선택된 모듈이 [필수모듈]을 포함하고, Y응답비율 ≥ [최소비율]%
            <br /><span style={{ color: '#1a7a4a', fontWeight: 700 }}>THEN</span> <span style={{ color: STAGE_COLOR[form.result_stage] }}>Stage {form.result_stage}</span> 판정
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>룰 코드</label>
              <input style={S.input} value={form.rule_cd} onChange={e => setForm(p => ({ ...p, rule_cd: e.target.value }))} placeholder="R-STAGE3-001" />
            </div>
            <div>
              <label style={S.label}>결과 Stage</label>
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.result_stage} onChange={e => setForm(p => ({ ...p, result_stage: Number(e.target.value) }))}>
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>Stage {n}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>우선순위 (높을수록 먼저)</label>
              <input style={S.input} type="number" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: Number(e.target.value) }))} />
            </div>
          </div>
          <label style={S.label}>필수 모듈 (이 모듈들이 선택되어야 해당 룰 적용)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {mods.map(m => {
              const chk = form.required_modules.includes(m.module_cd);
              return (
                <label key={m.module_cd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${chk ? '#C0392B' : 'rgba(192,57,43,.2)'}`, background: chk ? 'rgba(192,57,43,.08)' : '#fdf8f7' }}>
                  <input type="checkbox" checked={chk} style={{ accentColor: '#C0392B' }} onChange={e => {
                    setForm(p => ({ ...p, required_modules: e.target.checked ? [...p.required_modules, m.module_cd] : p.required_modules.filter(x => x !== m.module_cd) }));
                  }} />
                  <span style={{ fontSize: 12, fontWeight: chk ? 700 : 400, color: chk ? '#C0392B' : 'rgba(26,10,10,.65)' }}>{m.module_nm}</span>
                </label>
              );
            })}
          </div>
          <label style={S.label}>최소 Y응답 비율 (0 = 상관없음)</label>
          <input style={{ ...S.input, width: 120 }} type="number" step="0.1" min="0" max="1" value={form.min_ratio} onChange={e => setForm(p => ({ ...p, min_ratio: Number(e.target.value) }))} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '11px 20px', background: '#fff', color: 'rgba(26,10,10,.6)', border: '1.5px solid rgba(192,57,43,.2)', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={() => createMut.mutate({ ...form, condition_json: { required_modules: form.required_modules, min_ratio: form.min_ratio } })} disabled={!form.rule_cd || createMut.isPending} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#C0392B,#922B21)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>룰 저장</button>
          </div>
        </div>
      )}

      {/* 우측: 시뮬레이터 */}
      <div style={{ ...S.card, border: '1.5px solid rgba(26,122,74,.2)', background: 'rgba(26,122,74,.03)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#1a7a4a', marginBottom: 14 }}>🧪 판정 룰 시뮬레이터</div>
        <div style={{ fontSize: 11, color: 'rgba(26,10,10,.5)', marginBottom: 12 }}>현재 등록된 룰 기준으로 모듈 선택 시 어떤 Stage로 판정되는지 미리 확인합니다.</div>
        <label style={S.label}>시뮬레이션 모듈 선택</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {mods.map(m => {
            const chk = simMods.includes(m.module_cd);
            return (
              <button key={m.module_cd} onClick={() => setSimMods(p => chk ? p.filter(x => x !== m.module_cd) : [...p, m.module_cd])} style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', background: chk ? '#1a7a4a' : 'rgba(26,122,74,.08)', color: chk ? '#fff' : '#1a7a4a', transition: 'all .15s' }}>{m.module_nm}</button>
            );
          })}
        </div>
        {simMods.length > 0 && (
          <>
            <label style={S.label}>Y/N 답변 (선택)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
              {simMods.map(cd => (
                <div key={cd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{getNm(cd)}:</span>
                  {['y', 'n'].map(v => (
                    <button key={v} onClick={() => setSimAnswers(p => ({ ...p, [cd]: v }))} style={{ padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', background: simAnswers[cd] === v ? (v === 'y' ? '#1a7a4a' : '#C0392B') : 'rgba(26,10,10,.07)', color: simAnswers[cd] === v ? '#fff' : 'rgba(26,10,10,.55)' }}>{v.toUpperCase()}</button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
        <button onClick={runSim} disabled={simLoading || !simMods.length} style={{ padding: '10px 22px', background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !simMods.length ? .4 : 1 }}>
          {simLoading ? '계산 중...' : '판정 실행 →'}
        </button>
        {simResult && (
          <div style={{ marginTop: 14, padding: '14px', background: STAGE_BG[simResult.stage_no] || '#f8f8f8', borderRadius: 12, border: `1.5px solid ${STAGE_COLOR[simResult.stage_no] || '#888'}30` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: STAGE_COLOR[simResult.stage_no] }}>판정 결과: {simResult.stage_meta?.badge}</div>
            <div style={{ fontSize: 11, color: 'rgba(26,10,10,.55)', marginTop: 4 }}>{simResult.stage_meta?.title}</div>
          </div>
        )}
      </div>
    </div>
  );
}
