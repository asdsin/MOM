import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';
import { getErrorMessage } from '../../utils/getErrorMessage';

const TMPL_ICONS = { T_ELEC:'📱', T_MIXED:'⚙️', T_PRESS:'🔩' };

export default function TemplateTab({ canEdit }) {
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
    onError: (e) => toast.error(getErrorMessage(e, '등록 실패')),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => masterAPI.updateTemplate(id, data),
    onSuccess: () => { qc.invalidateQueries(['templates']); toast.success('수정 완료'); setEditing(null); },
    onError: (e) => toast.error(getErrorMessage(e, '수정 실패')),
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

  return (
    <div className="master-tab-wrap" style={{ maxWidth: 820 }}>
      <div className="flex-between mb-md">
        <div className="text-sm text-muted">
          총 <strong className="text-danger">{templates.length}</strong>개 템플릿
        </div>
        {canEdit && (
          <button onClick={openNew} className="btn-primary-pill">+ 템플릿 추가</button>
        )}
      </div>

      <div className="grid-3 mb-md" style={{ gap: 14 }}>
        {templates.map(t => (
          <div key={t.id} className="card-outer mb-0">
            <div style={{ fontSize: 22, marginBottom: 8 }}>
              {TMPL_ICONS[t.template_cd] || '🏭'}
            </div>
            <div className="master-card-title" style={{ fontSize: 14 }}>{t.template_nm}</div>
            <div className="master-card-desc" style={{ marginBottom: 12 }}>{t.description}</div>
            <div className="section-label">기본 권장 모듈</div>
            <div className="flex flex-wrap gap-xs mb-sm">
              {(t.default_module_cds || []).map(cd => (
                <span key={cd} className="badge-xs badge-red">{getModNm(cd)}</span>
              ))}
            </div>
            {canEdit && (
              <div className="flex gap-sm">
                <button onClick={() => openEdit(t)} className="btn-sm-outline">편집</button>
                <button onClick={() => deleteMut.mutate(t.id)} className="btn-sm-outline">삭제</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 편집 패널 */}
      {editing && (
        <div className="card-edit">
          <div className="master-panel-title">
            {editing === 'new' ? '새 업종 템플릿 추가' : `템플릿 편집 — ${editing.template_nm}`}
          </div>
          <div className="grid-3" style={{ gap: 10 }}>
            <div>
              <label className="form-label-sm">템플릿 코드</label>
              <input className="form-input-sm" value={form.template_cd} placeholder="예: T_AUTO"
                     onChange={e => setForm(p => ({...p, template_cd: e.target.value}))}
                     disabled={editing !== 'new'} />
            </div>
            <div>
              <label className="form-label-sm">템플릿명</label>
              <input className="form-input-sm" value={form.template_nm} placeholder="자동차부품"
                     onChange={e => setForm(p => ({...p, template_nm: e.target.value}))} />
            </div>
            <div>
              <label className="form-label-sm">업종</label>
              <input className="form-input-sm" value={form.industry_type} placeholder="자동차부품"
                     onChange={e => setForm(p => ({...p, industry_type: e.target.value}))} />
            </div>
          </div>
          <label className="form-label-sm">설명</label>
          <input className="form-input-sm" value={form.description}
                 onChange={e => setForm(p => ({...p, description: e.target.value}))} />

          <label className="form-label-sm">기본 권장 모듈</label>
          <div className="master-chip-area mb-md">
            {mods.map(m => {
              const sel = (form.default_module_cds||[]).includes(m.module_cd);
              return (
                <button key={m.id} onClick={() => toggleMod(m.module_cd)}
                        className={`master-chip${sel ? ' master-chip--active' : ''}`}>
                  {sel ? '✓ ' : ''}{m.module_nm}
                </button>
              );
            })}
          </div>

          <div className="flex gap-sm">
            <button onClick={() => setEditing(null)} className="btn-secondary">취소</button>
            <button onClick={handleSave}
                    disabled={createMut.isPending || updateMut.isPending || !form.template_cd || !form.template_nm}
                    className="btn-primary flex-1">저장</button>
          </div>
        </div>
      )}
    </div>
  );
}
