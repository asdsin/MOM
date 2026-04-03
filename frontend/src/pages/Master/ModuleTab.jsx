import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';
import { getErrorMessage } from '../../utils/getErrorMessage';
import {
  STAGE_COLORS, STAGE_BG, STATUS_COLOR, STATUS_LABEL, EFFORT_TYPE_LABEL,
} from '../../constants';

export default function ModuleTab({ canEdit }) {
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
    onError:   (e) => toast.error(getErrorMessage(e, '등록 실패')),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => masterAPI.updateModule(id, data),
    onSuccess: () => { qc.invalidateQueries(['master-modules']); toast.success('수정 완료'); setEditing(null); },
    onError:   (e) => toast.error(getErrorMessage(e, '수정 실패')),
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
    <div className="master-tab-wrap">
      <div className="flex-between mb-md">
        <div className="text-sm text-muted">
          총 <strong className="text-danger">{modules.length}</strong>개 모듈
        </div>
        {canEdit && (
          <button onClick={openNew} className="btn-primary-pill">+ 모듈 추가</button>
        )}
      </div>

      {/* 모듈 카드 그리드 */}
      <div className="grid-2 mb-lg" style={{ gap: 14 }}>
        {modules.map(m => (
          <div key={m.id} className="card-outer mb-0" style={{ padding: 18 }}>
            <div className="flex-between mb-sm" style={{ alignItems: 'flex-start' }}>
              <div>
                <span className="badge-sm"
                      style={{ background: STAGE_BG[m.stage_no], color: STAGE_COLORS[m.stage_no], marginRight: 6 }}>
                  단계 {m.stage_no}
                </span>
                <span className="badge-sm"
                      style={{ background: `${STATUS_COLOR[m.status]}18`, color: STATUS_COLOR[m.status] }}>
                  {STATUS_LABEL[m.status]}
                </span>
              </div>
              <span className="text-xs text-muted">v{m.version}</span>
            </div>
            <div className="master-card-title">{m.module_nm}</div>
            <div className="master-card-desc">{m.description}</div>
            <div className="grid-2" style={{ gap: 6, fontSize: 10 }}>
              <div className="master-effort-box master-effort-box--green">
                <span className="master-effort-label">있음(Y): </span>
                <strong className="master-effort-val--green">{m.default_effort_y}주</strong>
                <span className="master-effort-type"> / {EFFORT_TYPE_LABEL[m.effort_type_y]}</span>
              </div>
              <div className="master-effort-box master-effort-box--amber">
                <span className="master-effort-label">없음(N): </span>
                <strong className="master-effort-val--amber">{m.default_effort_n}주</strong>
                <span className="master-effort-type"> / {EFFORT_TYPE_LABEL[m.effort_type_n]}</span>
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-sm mt-sm">
                <button onClick={() => openEdit(m)} className="btn-sm-outline">편집</button>
                {m.status !== 'approved' && (
                  <button onClick={() => approveMut.mutate(m.id)} className="btn-sm-green">승인</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 편집 패널 */}
      {editing && (
        <div className="card-edit">
          <div className="master-panel-title">
            {editing === 'new' ? '새 모듈 추가' : `모듈 편집 — ${editing.module_nm}`}
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label-sm">모듈 코드</label>
              <input className="form-input-sm" value={form.module_cd}
                     onChange={e => setForm(p => ({...p, module_cd: e.target.value}))}
                     placeholder="예: qual" disabled={editing !== 'new'} />
            </div>
            <div>
              <label className="form-label-sm">모듈명</label>
              <input className="form-input-sm" value={form.module_nm}
                     onChange={e => setForm(p => ({...p, module_nm: e.target.value}))}
                     placeholder="품질 관리" />
            </div>
          </div>
          <label className="form-label-sm">설명</label>
          <input className="form-input-sm" value={form.description || ''}
                 onChange={e => setForm(p => ({...p, description: e.target.value}))} />
          <div className="grid-3" style={{ gap: 10 }}>
            <div>
              <label className="form-label-sm">도입 단계</label>
              <select className="form-select" value={form.stage_no}
                      onChange={e => setForm(p => ({...p, stage_no: Number(e.target.value)}))}>
                <option value={1}>단계 1</option>
                <option value={2}>단계 2</option>
                <option value={3}>단계 3</option>
              </select>
            </div>
            <div>
              <label className="form-label-sm">있음(Y) 공수(주)</label>
              <input className="form-input-sm" type="number" step="0.5" value={form.default_effort_y}
                     onChange={e => setForm(p => ({...p, default_effort_y: e.target.value}))} />
            </div>
            <div>
              <label className="form-label-sm">없음(N) 공수(주)</label>
              <input className="form-input-sm" type="number" step="0.5" value={form.default_effort_n}
                     onChange={e => setForm(p => ({...p, default_effort_n: e.target.value}))} />
            </div>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div>
              <label className="form-label-sm">있음(Y) 유형</label>
              <select className="form-select" value={form.effort_type_y}
                      onChange={e => setForm(p => ({...p, effort_type_y: e.target.value}))}>
                {Object.entries(EFFORT_TYPE_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label-sm">없음(N) 유형</label>
              <select className="form-select" value={form.effort_type_n}
                      onChange={e => setForm(p => ({...p, effort_type_n: e.target.value}))}>
                {Object.entries(EFFORT_TYPE_LABEL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <label className="form-label-sm">있음(Y) 산정 근거</label>
          <input className="form-input-sm" value={form.reason_y || ''}
                 onChange={e => setForm(p => ({...p, reason_y: e.target.value}))} />
          <label className="form-label-sm">없음(N) 산정 근거</label>
          <input className="form-input-sm" value={form.reason_n || ''}
                 onChange={e => setForm(p => ({...p, reason_n: e.target.value}))} />
          <label className="form-label-sm">API 경고 문구 (선택)</label>
          <input className="form-input-sm" value={form.api_warn || ''}
                 onChange={e => setForm(p => ({...p, api_warn: e.target.value}))}
                 placeholder="예: ERP API 개방 여부 확인 필수 ..." />

          <div className="flex gap-sm">
            <button onClick={() => setEditing(null)} className="btn-secondary">취소</button>
            <button onClick={handleSave}
                    disabled={createMut.isPending || updateMut.isPending}
                    className="btn-primary flex-1">저장</button>
          </div>
        </div>
      )}
    </div>
  );
}
