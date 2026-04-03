import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { RESULT_STAGE_COLOR } from '../../constants';

export default function RuleTab({ canEdit }) {
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
    onError: (e) => toast.error(getErrorMessage(e, '등록 실패')),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => masterAPI.updateRule(id, data),
    onSuccess: () => { qc.invalidateQueries(['rules']); toast.success('수정 완료'); setEditing(null); },
    onError: (e) => toast.error(getErrorMessage(e, '수정 실패')),
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

  return (
    <div className="master-tab-wrap" style={{ maxWidth: 820 }}>
      {/* 성숙도 단계 참조 카드 */}
      <div className="card-outer mb-md">
        <div className="card-header">성숙도 단계 정의</div>
        <div className="grid-4" style={{ gap: 8 }}>
          {stages.map(s => (
            <div key={s.id} className="master-stage-cell"
                 style={{ background: `#${s.color_hex}10`, borderColor: `#${s.color_hex}30` }}>
              <div className="master-stage-num" style={{ color: `#${s.color_hex}` }}>{s.stage_no}</div>
              <div className="master-stage-label" style={{ color: `#${s.color_hex}` }}>{s.badge_txt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 룰 목록 */}
      <div className="flex-between mb-sm">
        <div className="text-sm text-muted">
          총 <strong className="text-danger">{rules.length}</strong>개 판정 룰
          <span className="master-hint">(우선순위 높은 순서대로 평가)</span>
        </div>
        {canEdit && (
          <button onClick={openNew} className="btn-primary-pill">+ 룰 추가</button>
        )}
      </div>

      {rules.map((r, idx) => {
        const cond = r.condition_json || {};
        const reqMods = cond.required_modules || [];
        return (
          <div key={r.id} className="card-outer" style={{ padding: '16px 18px', marginBottom: 10 }}>
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
              <div className="flex-1">
                <div className="flex gap-sm mb-sm" style={{ alignItems: 'center' }}>
                  <span className="badge-xs" style={{ background: 'rgba(26,10,10,.06)', color: 'rgba(26,10,10,.35)' }}>
                    #{idx+1} 우선순위 {r.priority}
                  </span>
                  <span className="badge"
                        style={{ background: `${RESULT_STAGE_COLOR[r.result_stage]}15`,
                                 color: RESULT_STAGE_COLOR[r.result_stage] }}>
                    &rarr; Stage {r.result_stage}
                  </span>
                  <span className="text-xs text-muted">v{r.version}</span>
                </div>
                <div className="text-sm font-bold mb-sm">{r.rule_cd}</div>
                {/* 조건 시각화 */}
                <div className="master-rule-conditions">
                  {reqMods.length > 0 && (
                    <div className="flex flex-wrap gap-xs mb-sm" style={{ alignItems: 'center' }}>
                      <span className="master-cond-label">필수 모듈:</span>
                      {reqMods.map(cd => (
                        <span key={cd} className="badge-xs badge-red">{getModNm(cd)}</span>
                      ))}
                    </div>
                  )}
                  {(cond.min_ratio || 0) > 0 && (
                    <div className="text-xs text-muted">
                      최소 Y 비율: <strong>{Math.round(cond.min_ratio * 100)}%</strong>
                    </div>
                  )}
                  {reqMods.length === 0 && !cond.min_ratio && (
                    <div className="master-fallback-hint">조건 없음 (Fallback 룰)</div>
                  )}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-sm" style={{ flexShrink: 0 }}>
                  <button onClick={() => openEdit(r)} className="btn-sm-outline">편집</button>
                  <button onClick={() => deleteMut.mutate(r.id)} className="btn-sm-outline">삭제</button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 룰 편집 패널 (룰빌더) */}
      {editing && (
        <div className="card-edit mt-md">
          <div className="master-panel-title">
            {editing === 'new' ? '새 판정 룰 추가' : `룰 편집 — ${editing.rule_cd}`}
          </div>

          <div className="grid-3" style={{ gap: 10 }}>
            <div>
              <label className="form-label-sm">룰 코드</label>
              <input className="form-input-sm" value={form.rule_cd} placeholder="예: R-STAGE3"
                     onChange={e => setForm(p => ({...p, rule_cd: e.target.value}))}
                     disabled={editing !== 'new'} />
            </div>
            <div>
              <label className="form-label-sm">결과 단계</label>
              <select className="form-select" value={form.result_stage}
                      onChange={e => setForm(p => ({...p, result_stage: Number(e.target.value)}))}>
                {stages.map(s => <option key={s.id} value={s.stage_no}>Stage {s.stage_no} — {s.badge_txt}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label-sm">우선순위 (높을수록 먼저)</label>
              <input className="form-input-sm" type="number" value={form.priority}
                     onChange={e => setForm(p => ({...p, priority: Number(e.target.value)}))} />
            </div>
          </div>

          {/* 조건 빌더: 필수 모듈 선택 */}
          <div className="mb-md">
            <label className="form-label-sm">조건: 필수 모듈 (선택된 모듈이 모두 포함되어야 판정)</label>
            <div className="master-chip-area">
              {mods.map(m => {
                const selected = (form.condition_json.required_modules || []).includes(m.module_cd);
                return (
                  <button key={m.id} onClick={() => toggleModule(m.module_cd)}
                          className={`master-chip${selected ? ' master-chip--active' : ''}`}>
                    {selected ? '✓ ' : ''}{m.module_nm}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 조건 빌더: 최소 Y 비율 */}
          <div className="mb-md">
            <label className="form-label-sm">
              조건: 최소 Y(있음) 답변 비율 ({Math.round((form.condition_json.min_ratio || 0)*100)}%)
            </label>
            <input type="range" min="0" max="100" step="5"
                   className="master-range"
                   value={Math.round((form.condition_json.min_ratio || 0)*100)}
                   onChange={e => setForm(p => ({...p, condition_json: {...p.condition_json, min_ratio: Number(e.target.value)/100}}))} />
            <div className="flex-between text-xs text-muted">
              <span>0% (조건 없음)</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* 조건 미리보기 */}
          <div className="master-preview mb-md">
            <strong>미리보기:</strong>{' '}
            {(form.condition_json.required_modules || []).length > 0
              ? `[${(form.condition_json.required_modules||[]).map(cd=>getModNm(cd)).join(', ')}] 모듈이 모두 선택되고`
              : '(모듈 조건 없음)'}
            {(form.condition_json.min_ratio||0) > 0
              ? ` + Y 비율 ≥ ${Math.round(form.condition_json.min_ratio*100)}%`
              : ''}
            {' → '}
            <strong style={{color:RESULT_STAGE_COLOR[form.result_stage]}}>Stage {form.result_stage}</strong> 판정
          </div>

          <div className="flex gap-sm">
            <button onClick={() => setEditing(null)} className="btn-secondary">취소</button>
            <button onClick={handleSave}
                    disabled={createMut.isPending || updateMut.isPending || !form.rule_cd}
                    className="btn-primary flex-1">저장</button>
          </div>
        </div>
      )}
    </div>
  );
}
