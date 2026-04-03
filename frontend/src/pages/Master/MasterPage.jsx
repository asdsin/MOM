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
      {tab === 2 && <RuleTab />}
      {tab === 3 && <TemplateTab />}
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

// ══ 탭 2: 판정 룰 ════════════════════════════════════════════
function RuleTab() {
  const { data: stages = [] } = useQuery({
    queryKey: ['stages'], queryFn: () => masterAPI.getStages().then(r => r.data),
  });
  return (
    <div style={{ maxWidth:720 }}>
      <div style={{ ...S.card, marginBottom:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(26,10,10,.45)', letterSpacing:'.08em',
                      textTransform:'uppercase', marginBottom:14 }}>성숙도 단계 정의</div>
        {stages.map(s => (
          <div key={s.id} style={{ display:'flex', alignItems:'flex-start', gap:16, padding:'14px 0',
                                    borderBottom:'1px solid rgba(192,57,43,.07)' }}>
            <div style={{ width:44, height:44, borderRadius:14, display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:18, fontWeight:900, flexShrink:0,
                          background:`#${s.color_hex}20`, color:`#${s.color_hex}` }}>
              {s.stage_no}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, marginBottom:3, color:`#${s.color_hex}` }}>
                {s.badge_txt}
              </div>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:3 }}>{s.title_txt}</div>
              <div style={{ fontSize:11, color:'rgba(26,10,10,.55)', lineHeight:1.5 }}>{s.desc_txt}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop:14, padding:'12px 14px', background:'rgba(192,57,43,.04)',
                      borderRadius:10, fontSize:11, color:'rgba(26,10,10,.5)', lineHeight:1.6 }}>
          💡 판정 룰 편집은 Phase 3에서 룰빌더 UI와 함께 제공됩니다.<br/>
          현재는 DB에서 직접 관리하거나 <code>/api/master</code> API를 통해 수정하세요.
        </div>
      </div>
    </div>
  );
}

// ══ 탭 3: 업종 템플릿 ════════════════════════════════════════
function TemplateTab() {
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'], queryFn: () => masterAPI.getTemplates().then(r => r.data),
  });
  const { data: mods = [] } = useQuery({
    queryKey: ['master-modules'], queryFn: () => masterAPI.getModules().then(r => r.data),
  });

  const getModNm = (cd) => mods.find(m => m.module_cd === cd)?.module_nm || cd;

  const TMPL_ICONS = { T_ELEC:'📱', T_MIXED:'⚙️', T_PRESS:'🔩' };

  return (
    <div style={{ maxWidth:720 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
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
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {(t.default_module_cds || []).map(cd => (
                <span key={cd} style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:8,
                                        background:'rgba(192,57,43,.08)', color:'#C0392B' }}>
                  {getModNm(cd)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...S.card, marginTop:14 }}>
        <div style={{ fontSize:11, color:'rgba(26,10,10,.5)', lineHeight:1.7 }}>
          💡 <strong>Phase 2 예정:</strong> 템플릿을 고객사에 적용하면 모듈이 자동 선택됩니다.<br/>
          &nbsp;&nbsp;&nbsp;새 템플릿 추가 및 커스터마이징 기능은 Phase 2에서 제공됩니다.
        </div>
      </div>
    </div>
  );
}
