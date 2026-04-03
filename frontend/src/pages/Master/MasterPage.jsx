import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { masterAPI } from '../../api';
import { useAuthStore } from '../../store';

const TABS = ['모듈 관리', '의존성 설정', '판정 룰', '업종 템플릿'];

const STAGE_COLOR = { 1:'#C0392B', 2:'#1a5fa8', 3:'#1a7a4a' };
const STAGE_BG    = { 1:'rgba(192,57,43,.1)', 2:'rgba(26,95,168,.1)', 3:'rgba(26,122,74,.1)' };
const STATUS_COLOR= { draft:'#b7600a', review:'#1a5fa8', approved:'#1a7a4a' };
const STATUS_LABEL= { draft:'초안', review:'검토 중', approved:'승인' };

const TYPE_LABEL = {
  build:'신규 구축', partial:'부분 개선', api:'API 연동',
  data:'데이터 이관', master:'기준정보', skip:'해당 없음',
};

// ── 공통 인라인 스타일 ────────────────────────────────────────
const S = {
  card:  { background:'#fff', borderRadius:20, padding:'22px',
           boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)', marginBottom:16 },
  label: { display:'block', fontSize:11, fontWeight:700, color:'rgba(26,10,10,.55)',
           marginBottom:5, letterSpacing:'.04em' },
  input: { width:'100%', padding:'10px 13px', border:'1.5px solid rgba(192,57,43,.22)',
           borderRadius:11, fontSize:13, fontFamily:'inherit', outline:'none',
           background:'#fdf8f7', marginBottom:12,
           boxShadow:'inset 1px 1px 2px rgba(146,43,33,.10)' },
  select:{ width:'100%', padding:'10px 13px', border:'1.5px solid rgba(192,57,43,.22)',
           borderRadius:11, fontSize:13, fontFamily:'inherit', outline:'none',
           background:'#fdf8f7', marginBottom:12, cursor:'pointer' },
  row2:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  row3:  { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 },
  btnSm: { padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer',
           fontSize:11, fontWeight:700, fontFamily:'inherit' },
  divider:{ borderBottom:'1px solid rgba(192,57,43,.08)', margin:'10px 0' },
};

export default function MasterPage() {
  const [tab, setTab]   = useState(0);
  const { user }        = useAuthStore();
  const canEdit = ['super_admin','system_admin','master_admin'].includes(user?.role_code);

  return (
    <Layout title="기준정보 관리">
      {/* 탭바 */}
      <div style={{ display:'flex', gap:4, background:'rgba(192,57,43,.09)', borderRadius:14,
                    padding:4, marginBottom:22, maxWidth:600,
                    boxShadow:'inset -2px -2px 5px rgba(255,220,210,.75), inset 2px 2px 6px rgba(146,43,33,.15)' }}>
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex:1, padding:'9px 4px', borderRadius:10, border:'none', cursor:'pointer',
            fontSize:12, fontWeight:700, fontFamily:'inherit', whiteSpace:'nowrap',
            background: tab===i ? '#fff' : 'none',
            color:       tab===i ? '#C0392B' : 'rgba(26,10,10,.5)',
            boxShadow:   tab===i ? '0 1px 4px rgba(192,57,43,.12)' : 'none',
            transition:'all .2s',
          }}>{t}</button>
        ))}
      </div>

      {tab === 0 && <ModuleTab canEdit={canEdit} />}
      {tab === 1 && <DependencyTab canEdit={canEdit} />}
      {tab === 2 && <RuleTab canEdit={canEdit} />}
      {tab === 3 && <TemplateTab canEdit={canEdit} />}
    </Layout>
  );
}

// ══ 탭 0: 모듈 관리 ══════════════════════════════════════════
function ModuleTab({ canEdit }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);  // null | 'new' | module객체
  const [form, setForm]       = useState({});

  const { data: modules = [] } = useQuery({
    queryKey: ['master-modules'],
    queryFn:  () => masterAPI.getModules().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (d) => masterAPI.createModule(d),
    onSuccess: () => { qc.invalidateQueries(['master-modules']); toast.success('모듈 등록 완료'); setEditing(null); },
    onError:   (e) => toast.error(e.response?.data?.error || '등록 실패'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => masterAPI.updateModule(id, data),
    onSuccess: () => { qc.invalidateQueries(['master-modules']); toast.success('수정 완료'); setEditing(null); },
    onError:   (e) => toast.error(e.response?.data?.error || '수정 실패'),
  });
  const approveMut = useMutation({
    mutationFn: (id) => masterAPI.approveModule(id),
    onSuccess: () => { qc.invalidateQueries(['master-modules']); toast.success('승인 완료'); },
  });

  const openNew = () => {
    setForm({ module_cd:'', module_nm:'', description:'', stage_no:1,
              default_effort_y:1.0, effort_type_y:'partial', reason_y:'',
              default_effort_n:4.0, effort_type_n:'build',   reason_n:'', api_warn:'' });
    setEditing('new');
  };
  const openEdit = (m) => { setForm({ ...m }); setEditing(m); };
  const handleSave = () => {
    if (editing === 'new') createMut.mutate(form);
    else updateMut.mutate({ id: editing.id, data: form });
  };

  return (
    <div style={{ maxWidth:860 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:12, color:'rgba(26,10,10,.5)' }}>
          총 <strong style={{color:'#C0392B'}}>{modules.length}</strong>개 모듈
        </div>
        {canEdit && (
          <button onClick={openNew} style={{
            padding:'9px 18px', background:'#C0392B', color:'#fff', border:'none',
            borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
          }}>+ 모듈 추가</button>
        )}
      </div>

      {/* 모듈 카드 그리드 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20 }}>
        {modules.map(m => (
          <div key={m.id} style={{ ...S.card, padding:'18px', marginBottom:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20,
                               background:STAGE_BG[m.stage_no], color:STAGE_COLOR[m.stage_no],
                               marginRight:6 }}>단계 {m.stage_no}</span>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20,
                               background:`${STATUS_COLOR[m.status]}18`, color:STATUS_COLOR[m.status] }}>
                  {STATUS_LABEL[m.status]}
                </span>
              </div>
              <span style={{ fontSize:9, color:'rgba(26,10,10,.35)' }}>v{m.version}</span>
            </div>
            <div style={{ fontSize:13, fontWeight:800, marginBottom:3 }}>{m.module_nm}</div>
            <div style={{ fontSize:10, color:'rgba(26,10,10,.5)', marginBottom:10, lineHeight:1.45 }}>
              {m.description}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, fontSize:10 }}>
              <div style={{ background:'rgba(26,122,74,.07)', borderRadius:8, padding:'6px 9px' }}>
                <span style={{color:'rgba(26,10,10,.45)'}}>있음(Y): </span>
                <strong style={{color:'#1a7a4a'}}>{m.default_effort_y}주</strong>
                <span style={{color:'rgba(26,10,10,.35)'}}> / {TYPE_LABEL[m.effort_type_y]}</span>
              </div>
              <div style={{ background:'rgba(183,96,10,.07)', borderRadius:8, padding:'6px 9px' }}>
                <span style={{color:'rgba(26,10,10,.45)'}}>없음(N): </span>
                <strong style={{color:'#b7600a'}}>{m.default_effort_n}주</strong>
                <span style={{color:'rgba(26,10,10,.35)'}}> / {TYPE_LABEL[m.effort_type_n]}</span>
              </div>
            </div>
            {canEdit && (
              <div style={{ display:'flex', gap:6, marginTop:10 }}>
                <button onClick={() => openEdit(m)} style={{
                  ...S.btnSm, background:'rgba(192,57,43,.07)', color:'#C0392B', border:'1px solid rgba(192,57,43,.2)',
                }}>✏️ 편집</button>
                {m.status !== 'approved' && (
                  <button onClick={() => approveMut.mutate(m.id)} style={{
                    ...S.btnSm, background:'rgba(26,122,74,.07)', color:'#1a7a4a', border:'1px solid rgba(26,122,74,.2)',
                  }}>✅ 승인</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 편집 패널 */}
      {editing && (
        <div style={{ ...S.card, border:'1.5px solid rgba(192,57,43,.25)' }}>
          <div style={{ fontSize:14, fontWeight:800, marginBottom:16, color:'#1a0a0a' }}>
            {editing === 'new' ? '새 모듈 추가' : `모듈 편집 — ${editing.module_nm}`}
          </div>
          <div style={S.row2}>
            <div>
              <label style={S.label}>모듈 코드</label>
              <input style={S.input} value={form.module_cd}
                     onChange={e => setForm(p => ({...p, module_cd: e.target.value}))}
                     placeholder="예: qual" disabled={editing !== 'new'} />
            </div>
            <div>
              <label style={S.label}>모듈명</label>
              <input style={S.input} value={form.module_nm}
                     onChange={e => setForm(p => ({...p, module_nm: e.target.value}))}
                     placeholder="품질 관리" />
            </div>
          </div>
          <label style={S.label}>설명</label>
          <input style={S.input} value={form.description || ''}
                 onChange={e => setForm(p => ({...p, description: e.target.value}))} />
          <div style={S.row3}>
            <div>
              <label style={S.label}>도입 단계</label>
              <select style={S.select} value={form.stage_no}
                      onChange={e => setForm(p => ({...p, stage_no: Number(e.target.value)}))}>
                <option value={1}>단계 1</option>
                <option value={2}>단계 2</option>
                <option value={3}>단계 3</option>
              </select>
            </div>
            <div>
              <label style={S.label}>있음(Y) 공수(주)</label>
              <input style={S.input} type="number" step="0.5" value={form.default_effort_y}
                     onChange={e => setForm(p => ({...p, default_effort_y: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>없음(N) 공수(주)</label>
              <input style={S.input} type="number" step="0.5" value={form.default_effort_n}
                     onChange={e => setForm(p => ({...p, default_effort_n: e.target.value}))} />
            </div>
          </div>
          <div style={S.row2}>
            <div>
              <label style={S.label}>있음(Y) 유형</label>
              <select style={S.select} value={form.effort_type_y}
                      onChange={e => setForm(p => ({...p, effort_type_y: e.target.value}))}>
                {Object.entries(TYPE_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>없음(N) 유형</label>
              <select style={S.select} value={form.effort_type_n}
                      onChange={e => setForm(p => ({...p, effort_type_n: e.target.value}))}>
                {Object.entries(TYPE_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <label style={S.label}>있음(Y) 산정 근거</label>
          <input style={S.input} value={form.reason_y || ''}
                 onChange={e => setForm(p => ({...p, reason_y: e.target.value}))} />
          <label style={S.label}>없음(N) 산정 근거</label>
          <input style={S.input} value={form.reason_n || ''}
                 onChange={e => setForm(p => ({...p, reason_n: e.target.value}))} />
          <label style={S.label}>API 경고 문구 (선택)</label>
          <input style={S.input} value={form.api_warn || ''}
                 onChange={e => setForm(p => ({...p, api_warn: e.target.value}))}
                 placeholder="예: ERP API 개방 여부 확인 필수 ..." />

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setEditing(null)} style={{
              padding:'11px 20px', background:'#fff', color:'rgba(26,10,10,.6)',
              border:'1.5px solid rgba(192,57,43,.2)', borderRadius:12, fontSize:13,
              fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>취소</button>
            <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} style={{
              flex:1, padding:12, background:'linear-gradient(135deg,#C0392B,#922B21)',
              color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit',
            }}>저장</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══ 탭 1: 의존성 설정 ════════════════════════════════════════
function DependencyTab({ canEdit }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ parent_module_cd:'', child_module_cd:'', rel_type:'required' });

  const { data: mods = [] } = useQuery({
    queryKey: ['master-modules'], queryFn: () => masterAPI.getModules().then(r => r.data),
  });
  const { data: deps = [] } = useQuery({
    queryKey: ['dependencies'], queryFn: () => masterAPI.getDependencies().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: (d) => masterAPI.createDependency(d),
    onSuccess: () => { qc.invalidateQueries(['dependencies']); toast.success('의존성 추가 완료'); setForm({parent_module_cd:'',child_module_cd:'',rel_type:'required'}); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => masterAPI.deleteDependency(id),
    onSuccess: () => { qc.invalidateQueries(['dependencies']); toast.success('삭제 완료'); },
  });

  const getModNm = (cd) => mods.find(m => m.module_cd === cd)?.module_nm || cd;

  const REL_LABEL = { required:'필수', recommended:'추천', optional:'선택' };
  const REL_COLOR = { required:'#C0392B', recommended:'#1a5fa8', optional:'#1a7a4a' };

  return (
    <div style={{ maxWidth:760 }}>
      <div style={S.card}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(26,10,10,.45)',
                      letterSpacing:'.08em', textTransform:'uppercase', marginBottom:14 }}>
          현재 의존성 목록
        </div>
        {deps.length === 0
          ? <div style={{color:'rgba(26,10,10,.35)', fontSize:13, padding:'12px 0'}}>등록된 의존성이 없습니다</div>
          : deps.map(d => (
            <div key={d.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                                     padding:'10px 0', borderBottom:'1px solid rgba(192,57,43,.07)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:12, fontWeight:700, color:'#C0392B' }}>
                  {getModNm(d.parent_module_cd)}
                </span>
                <span style={{ fontSize:14, color:'rgba(26,10,10,.35)' }}>→</span>
                <span style={{ fontSize:12, fontWeight:700 }}>{getModNm(d.child_module_cd)}</span>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:20,
                               background:`${REL_COLOR[d.rel_type]}15`, color:REL_COLOR[d.rel_type] }}>
                  {REL_LABEL[d.rel_type]}
                </span>
              </div>
              {canEdit && (
                <button onClick={() => deleteMut.mutate(d.id)} style={{
                  ...S.btnSm, background:'rgba(192,57,43,.07)', color:'#C0392B',
                  border:'1px solid rgba(192,57,43,.15)',
                }}>삭제</button>
              )}
            </div>
          ))
        }
      </div>

      {canEdit && (
        <div style={S.card}>
          <div style={{ fontSize:13, fontWeight:800, marginBottom:14 }}>새 의존성 추가</div>
          <div style={S.row3}>
            <div>
              <label style={S.label}>선행 모듈 (부모)</label>
              <select style={S.select} value={form.parent_module_cd}
                      onChange={e => setForm(p => ({...p, parent_module_cd: e.target.value}))}>
                <option value="">선택</option>
                {mods.map(m => <option key={m.id} value={m.module_cd}>{m.module_nm}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>후행 모듈 (자식)</label>
              <select style={S.select} value={form.child_module_cd}
                      onChange={e => setForm(p => ({...p, child_module_cd: e.target.value}))}>
                <option value="">선택</option>
                {mods.map(m => <option key={m.id} value={m.module_cd}>{m.module_nm}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>관계 유형</label>
              <select style={S.select} value={form.rel_type}
                      onChange={e => setForm(p => ({...p, rel_type: e.target.value}))}>
                <option value="required">필수</option>
                <option value="recommended">추천</option>
                <option value="optional">선택</option>
              </select>
            </div>
          </div>
          <button onClick={() => createMut.mutate(form)}
                  disabled={!form.parent_module_cd || !form.child_module_cd || createMut.isPending} style={{
            padding:'11px 22px', background:'#C0392B', color:'#fff', border:'none',
            borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            opacity: !form.parent_module_cd || !form.child_module_cd ? .4 : 1,
          }}>의존성 추가</button>
        </div>
      )}
    </div>
  );
}

// ══ 탭 2: 판정 룰 (룰빌더) ═══════════════════════════════════
function RuleTab({ canEdit }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | rule객체

  const { data: stages = [] } = useQuery({
    queryKey: ['stages'], queryFn: () => masterAPI.getStages().then(r => r.data),
  });
  const { data: rules = [] } = useQuery({
    queryKey: ['rules'], queryFn: () => masterAPI.getRules().then(r => r.data),
  });
  const { data: mods = [] } = useQuery({
    queryKey: ['master-modules'], queryFn: () => masterAPI.getModules().then(r => r.data),
  });

  const emptyForm = () => ({
    rule_cd: '', result_stage: 1, priority: 0,
    condition_json: { required_modules: [], min_ratio: 0 },
  });
  const [form, setForm] = useState(emptyForm());

  const createMut = useMutation({
    mutationFn: (d) => masterAPI.createRule(d),
    onSuccess: () => { qc.invalidateQueries(['rules']); toast.success('룰 등록 완료'); setEditing(null); },
    onError: (e) => toast.error(e.response?.data?.error || '등록 실패'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => masterAPI.updateRule(id, data),
    onSuccess: () => { qc.invalidateQueries(['rules']); toast.success('수정 완료'); setEditing(null); },
    onError: (e) => toast.error(e.response?.data?.error || '수정 실패'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => masterAPI.deleteRule(id),
    onSuccess: () => { qc.invalidateQueries(['rules']); toast.success('삭제 완료'); },
  });

  const openNew = () => { setForm(emptyForm()); setEditing('new'); };
  const openEdit = (r) => {
    setForm({
      rule_cd: r.rule_cd, result_stage: r.result_stage, priority: r.priority,
      condition_json: r.condition_json || { required_modules: [], min_ratio: 0 },
    });
    setEditing(r);
  };
  const handleSave = () => {
    if (editing === 'new') createMut.mutate(form);
    else updateMut.mutate({ id: editing.id, data: form });
  };

  const toggleModule = (cd) => {
    const cur = form.condition_json.required_modules || [];
    const next = cur.includes(cd) ? cur.filter(m => m !== cd) : [...cur, cd];
    setForm(p => ({ ...p, condition_json: { ...p.condition_json, required_modules: next } }));
  };

  const getModNm = (cd) => mods.find(m => m.module_cd === cd)?.module_nm || cd;

  const RESULT_COLOR = { 1:'#C0392B', 2:'#1a7a4a', 3:'#7B241C', 4:'#b7600a' };

  return (
    <div style={{ maxWidth:820 }}>
      {/* 성숙도 단계 참조 카드 */}
      <div style={{ ...S.card, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(26,10,10,.45)', letterSpacing:'.08em',
                      textTransform:'uppercase', marginBottom:12 }}>성숙도 단계 정의</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {stages.map(s => (
            <div key={s.id} style={{ padding:'10px 12px', borderRadius:12, textAlign:'center',
                                     background:`#${s.color_hex}10`, border:`1px solid #${s.color_hex}30` }}>
              <div style={{ fontSize:18, fontWeight:900, color:`#${s.color_hex}`, marginBottom:2 }}>{s.stage_no}</div>
              <div style={{ fontSize:10, fontWeight:700, color:`#${s.color_hex}` }}>{s.badge_txt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 룰 목록 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:12, color:'rgba(26,10,10,.5)' }}>
          총 <strong style={{color:'#C0392B'}}>{rules.length}</strong>개 판정 룰
          <span style={{ marginLeft:8, fontSize:10, color:'rgba(26,10,10,.35)' }}>
            (우선순위 높은 순서대로 평가)
          </span>
        </div>
        {canEdit && (
          <button onClick={openNew} style={{
            padding:'9px 18px', background:'#C0392B', color:'#fff', border:'none',
            borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
          }}>+ 룰 추가</button>
        )}
      </div>

      {rules.map((r, idx) => {
        const cond = r.condition_json || {};
        const reqMods = cond.required_modules || [];
        return (
          <div key={r.id} style={{ ...S.card, padding:'16px 18px', marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:800, color:'rgba(26,10,10,.35)',
                                 background:'rgba(26,10,10,.06)', padding:'2px 8px', borderRadius:8 }}>
                    #{idx+1} 우선순위 {r.priority}
                  </span>
                  <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:10,
                                 background:`${RESULT_COLOR[r.result_stage]}15`,
                                 color: RESULT_COLOR[r.result_stage] }}>
                    → Stage {r.result_stage}
                  </span>
                  <span style={{ fontSize:10, color:'rgba(26,10,10,.35)' }}>v{r.version}</span>
                </div>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:4, color:'#1a0a0a' }}>
                  {r.rule_cd}
                </div>
                {/* 조건 시각화 */}
                <div style={{ fontSize:11, color:'rgba(26,10,10,.6)', lineHeight:1.7 }}>
                  {reqMods.length > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ color:'rgba(26,10,10,.4)', fontSize:10 }}>필수 모듈:</span>
                      {reqMods.map(cd => (
                        <span key={cd} style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:8,
                                                background:'rgba(192,57,43,.08)', color:'#C0392B' }}>
                          {getModNm(cd)}
                        </span>
                      ))}
                    </div>
                  )}
                  {(cond.min_ratio || 0) > 0 && (
                    <div style={{ fontSize:10, color:'rgba(26,10,10,.5)' }}>
                      최소 Y 비율: <strong>{Math.round(cond.min_ratio * 100)}%</strong>
                    </div>
                  )}
                  {reqMods.length === 0 && !cond.min_ratio && (
                    <div style={{ fontSize:10, color:'rgba(26,10,10,.35)', fontStyle:'italic' }}>
                      조건 없음 (Fallback 룰)
                    </div>
                  )}
                </div>
              </div>
              {canEdit && (
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => openEdit(r)} style={{
                    ...S.btnSm, background:'rgba(192,57,43,.07)', color:'#C0392B', border:'1px solid rgba(192,57,43,.2)',
                  }}>편집</button>
                  <button onClick={() => deleteMut.mutate(r.id)} style={{
                    ...S.btnSm, background:'rgba(192,57,43,.07)', color:'#C0392B', border:'1px solid rgba(192,57,43,.15)',
                  }}>삭제</button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 룰 편집 패널 (룰빌더) */}
      {editing && (
        <div style={{ ...S.card, border:'1.5px solid rgba(192,57,43,.25)', marginTop:16 }}>
          <div style={{ fontSize:14, fontWeight:800, marginBottom:16, color:'#1a0a0a' }}>
            {editing === 'new' ? '새 판정 룰 추가' : `룰 편집 — ${editing.rule_cd}`}
          </div>

          <div style={S.row3}>
            <div>
              <label style={S.label}>룰 코드</label>
              <input style={S.input} value={form.rule_cd} placeholder="예: R-STAGE3"
                     onChange={e => setForm(p => ({...p, rule_cd: e.target.value}))}
                     disabled={editing !== 'new'} />
            </div>
            <div>
              <label style={S.label}>결과 단계</label>
              <select style={S.select} value={form.result_stage}
                      onChange={e => setForm(p => ({...p, result_stage: Number(e.target.value)}))}>
                {stages.map(s => <option key={s.id} value={s.stage_no}>Stage {s.stage_no} — {s.badge_txt}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>우선순위 (높을수록 먼저)</label>
              <input style={S.input} type="number" value={form.priority}
                     onChange={e => setForm(p => ({...p, priority: Number(e.target.value)}))} />
            </div>
          </div>

          {/* 조건 빌더: 필수 모듈 선택 */}
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>조건: 필수 모듈 (선택된 모듈이 모두 포함되어야 판정)</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'12px', background:'rgba(192,57,43,.03)',
                          borderRadius:12, border:'1px dashed rgba(192,57,43,.15)' }}>
              {mods.map(m => {
                const selected = (form.condition_json.required_modules || []).includes(m.module_cd);
                return (
                  <button key={m.id} onClick={() => toggleModule(m.module_cd)} style={{
                    padding:'6px 12px', borderRadius:10, border: selected ? '1.5px solid #C0392B' : '1.5px solid rgba(26,10,10,.12)',
                    background: selected ? 'rgba(192,57,43,.1)' : '#fff',
                    color: selected ? '#C0392B' : 'rgba(26,10,10,.5)',
                    fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                    transition:'all .15s',
                  }}>
                    {selected ? '✓ ' : ''}{m.module_nm}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 조건 빌더: 최소 Y 비율 */}
          <div style={{ marginBottom:16 }}>
            <label style={S.label}>조건: 최소 Y(있음) 답변 비율 ({Math.round((form.condition_json.min_ratio || 0)*100)}%)</label>
            <input type="range" min="0" max="100" step="5"
                   value={Math.round((form.condition_json.min_ratio || 0)*100)}
                   onChange={e => setForm(p => ({...p, condition_json: {...p.condition_json, min_ratio: Number(e.target.value)/100}}))}
                   style={{ width:'100%', accentColor:'#C0392B' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(26,10,10,.35)' }}>
              <span>0% (조건 없음)</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* 조건 미리보기 */}
          <div style={{ padding:'12px 14px', background:'rgba(192,57,43,.04)', borderRadius:10,
                        marginBottom:16, fontSize:11, color:'rgba(26,10,10,.6)', lineHeight:1.7 }}>
            <strong>미리보기:</strong>{' '}
            {(form.condition_json.required_modules || []).length > 0
              ? `[${(form.condition_json.required_modules||[]).map(cd=>getModNm(cd)).join(', ')}] 모듈이 모두 선택되고`
              : '(모듈 조건 없음)'}
            {(form.condition_json.min_ratio||0) > 0
              ? ` + Y 비율 ≥ ${Math.round(form.condition_json.min_ratio*100)}%`
              : ''}
            {' → '}
            <strong style={{color:RESULT_COLOR[form.result_stage]}}>Stage {form.result_stage}</strong> 판정
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setEditing(null)} style={{
              padding:'11px 20px', background:'#fff', color:'rgba(26,10,10,.6)',
              border:'1.5px solid rgba(192,57,43,.2)', borderRadius:12, fontSize:13,
              fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>취소</button>
            <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || !form.rule_cd} style={{
              flex:1, padding:12, background:'linear-gradient(135deg,#C0392B,#922B21)',
              color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit',
              opacity: !form.rule_cd ? .4 : 1,
            }}>저장</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══ 탭 3: 업종 템플릿 ════════════════════════════════════════
function TemplateTab({ canEdit }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'], queryFn: () => masterAPI.getTemplates().then(r => r.data),
  });
  const { data: mods = [] } = useQuery({
    queryKey: ['master-modules'], queryFn: () => masterAPI.getModules().then(r => r.data),
  });

  const emptyForm = () => ({ template_cd:'', template_nm:'', industry_type:'', description:'', default_module_cds:[] });
  const [form, setForm] = useState(emptyForm());

  const createMut = useMutation({
    mutationFn: (d) => masterAPI.createTemplate(d),
    onSuccess: () => { qc.invalidateQueries(['templates']); toast.success('템플릿 등록 완료'); setEditing(null); },
    onError: (e) => toast.error(e.response?.data?.error || '등록 실패'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => masterAPI.updateTemplate(id, data),
    onSuccess: () => { qc.invalidateQueries(['templates']); toast.success('수정 완료'); setEditing(null); },
    onError: (e) => toast.error(e.response?.data?.error || '수정 실패'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => masterAPI.deleteTemplate(id),
    onSuccess: () => { qc.invalidateQueries(['templates']); toast.success('삭제 완료'); },
  });

  const openNew = () => { setForm(emptyForm()); setEditing('new'); };
  const openEdit = (t) => {
    setForm({ template_cd: t.template_cd, template_nm: t.template_nm, industry_type: t.industry_type || '',
              description: t.description || '', default_module_cds: t.default_module_cds || [] });
    setEditing(t);
  };
  const handleSave = () => {
    if (editing === 'new') createMut.mutate(form);
    else updateMut.mutate({ id: editing.id, data: form });
  };
  const toggleMod = (cd) => {
    const cur = form.default_module_cds || [];
    setForm(p => ({...p, default_module_cds: cur.includes(cd) ? cur.filter(m=>m!==cd) : [...cur, cd]}));
  };

  const getModNm = (cd) => mods.find(m => m.module_cd === cd)?.module_nm || cd;
  const TMPL_ICONS = { T_ELEC:'📱', T_MIXED:'⚙️', T_PRESS:'🔩' };

  return (
    <div style={{ maxWidth:820 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:12, color:'rgba(26,10,10,.5)' }}>
          총 <strong style={{color:'#C0392B'}}>{templates.length}</strong>개 템플릿
        </div>
        {canEdit && (
          <button onClick={openNew} style={{
            padding:'9px 18px', background:'#C0392B', color:'#fff', border:'none',
            borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
          }}>+ 템플릿 추가</button>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16 }}>
        {templates.map(t => (
          <div key={t.id} style={{ ...S.card, marginBottom:0 }}>
            <div style={{ fontSize:22, marginBottom:8 }}>
              {TMPL_ICONS[t.template_cd] || '🏭'}
            </div>
            <div style={{ fontSize:14, fontWeight:800, marginBottom:4 }}>{t.template_nm}</div>
            <div style={{ fontSize:10, color:'rgba(26,10,10,.5)', marginBottom:12, lineHeight:1.45 }}>
              {t.description}
            </div>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(26,10,10,.4)',
                          letterSpacing:'.06em', marginBottom:6 }}>기본 권장 모듈</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
              {(t.default_module_cds || []).map(cd => (
                <span key={cd} style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:8,
                                        background:'rgba(192,57,43,.08)', color:'#C0392B' }}>
                  {getModNm(cd)}
                </span>
              ))}
            </div>
            {canEdit && (
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => openEdit(t)} style={{
                  ...S.btnSm, background:'rgba(192,57,43,.07)', color:'#C0392B', border:'1px solid rgba(192,57,43,.2)',
                }}>편집</button>
                <button onClick={() => deleteMut.mutate(t.id)} style={{
                  ...S.btnSm, background:'rgba(192,57,43,.07)', color:'#C0392B', border:'1px solid rgba(192,57,43,.15)',
                }}>삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 편집 패널 */}
      {editing && (
        <div style={{ ...S.card, border:'1.5px solid rgba(192,57,43,.25)' }}>
          <div style={{ fontSize:14, fontWeight:800, marginBottom:16, color:'#1a0a0a' }}>
            {editing === 'new' ? '새 업종 템플릿 추가' : `템플릿 편집 — ${editing.template_nm}`}
          </div>
          <div style={S.row3}>
            <div>
              <label style={S.label}>템플릿 코드</label>
              <input style={S.input} value={form.template_cd} placeholder="예: T_AUTO"
                     onChange={e => setForm(p => ({...p, template_cd: e.target.value}))}
                     disabled={editing !== 'new'} />
            </div>
            <div>
              <label style={S.label}>템플릿명</label>
              <input style={S.input} value={form.template_nm} placeholder="자동차부품"
                     onChange={e => setForm(p => ({...p, template_nm: e.target.value}))} />
            </div>
            <div>
              <label style={S.label}>업종</label>
              <input style={S.input} value={form.industry_type} placeholder="자동차부품"
                     onChange={e => setForm(p => ({...p, industry_type: e.target.value}))} />
            </div>
          </div>
          <label style={S.label}>설명</label>
          <input style={S.input} value={form.description}
                 onChange={e => setForm(p => ({...p, description: e.target.value}))} />

          <label style={S.label}>기본 권장 모듈</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'12px', background:'rgba(192,57,43,.03)',
                        borderRadius:12, border:'1px dashed rgba(192,57,43,.15)', marginBottom:16 }}>
            {mods.map(m => {
              const sel = (form.default_module_cds||[]).includes(m.module_cd);
              return (
                <button key={m.id} onClick={() => toggleMod(m.module_cd)} style={{
                  padding:'6px 12px', borderRadius:10,
                  border: sel ? '1.5px solid #C0392B' : '1.5px solid rgba(26,10,10,.12)',
                  background: sel ? 'rgba(192,57,43,.1)' : '#fff',
                  color: sel ? '#C0392B' : 'rgba(26,10,10,.5)',
                  fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                }}>
                  {sel ? '✓ ' : ''}{m.module_nm}
                </button>
              );
            })}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setEditing(null)} style={{
              padding:'11px 20px', background:'#fff', color:'rgba(26,10,10,.6)',
              border:'1.5px solid rgba(192,57,43,.2)', borderRadius:12, fontSize:13,
              fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>취소</button>
            <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending || !form.template_cd || !form.template_nm} style={{
              flex:1, padding:12, background:'linear-gradient(135deg,#C0392B,#922B21)',
              color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit',
              opacity: !form.template_cd || !form.template_nm ? .4 : 1,
            }}>저장</button>
          </div>
        </div>
      )}
    </div>
  );
}
