import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';
import { REL_LABEL, REL_COLOR } from '../../constants';

export default function DependencyTab({ canEdit }) {
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

  return (
    <div className="master-tab-wrap" style={{ maxWidth: 760 }}>
      <div className="card-outer">
        <div className="card-header">현재 의존성 목록</div>
        {deps.length === 0
          ? <div className="empty-state" style={{ padding: '12px 0' }}>등록된 의존성이 없습니다</div>
          : deps.map(d => (
            <div key={d.id} className="data-row">
              <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                <span className="text-sm font-bold text-danger">
                  {getModNm(d.parent_module_cd)}
                </span>
                <span className="master-arrow">&#8594;</span>
                <span className="text-sm font-bold">{getModNm(d.child_module_cd)}</span>
                <span className="badge-sm"
                      style={{ background: `${REL_COLOR[d.rel_type]}15`, color: REL_COLOR[d.rel_type] }}>
                  {REL_LABEL[d.rel_type]}
                </span>
              </div>
              {canEdit && (
                <button onClick={() => deleteMut.mutate(d.id)} className="btn-sm-outline">삭제</button>
              )}
            </div>
          ))
        }
      </div>

      {canEdit && (
        <div className="card-outer">
          <div className="master-panel-title" style={{ fontSize: 13 }}>새 의존성 추가</div>
          <div className="grid-3" style={{ gap: 10 }}>
            <div>
              <label className="form-label-sm">선행 모듈 (부모)</label>
              <select className="form-select" value={form.parent_module_cd}
                      onChange={e => setForm(p => ({...p, parent_module_cd: e.target.value}))}>
                <option value="">선택</option>
                {mods.map(m => <option key={m.id} value={m.module_cd}>{m.module_nm}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label-sm">후행 모듈 (자식)</label>
              <select className="form-select" value={form.child_module_cd}
                      onChange={e => setForm(p => ({...p, child_module_cd: e.target.value}))}>
                <option value="">선택</option>
                {mods.map(m => <option key={m.id} value={m.module_cd}>{m.module_nm}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label-sm">관계 유형</label>
              <select className="form-select" value={form.rel_type}
                      onChange={e => setForm(p => ({...p, rel_type: e.target.value}))}>
                <option value="required">필수</option>
                <option value="recommended">추천</option>
                <option value="optional">선택</option>
              </select>
            </div>
          </div>
          <button onClick={() => createMut.mutate(form)}
                  disabled={!form.parent_module_cd || !form.child_module_cd || createMut.isPending}
                  className="btn-primary"
                  style={{ padding: '11px 22px', fontSize: 13, borderRadius: 12 }}>
            의존성 추가
          </button>
        </div>
      )}
    </div>
  );
}
