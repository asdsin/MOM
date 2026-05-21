import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';
import api from '../../api/axios';

const S = {
  card:   { background: '#fff', borderRadius: 20, padding: '22px', marginBottom: 14, boxShadow: '-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)' },
  label:  { fontSize: 11, fontWeight: 700, color: 'rgba(26,10,10,.55)', marginBottom: 5, display: 'block' },
  input:  { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(192,57,43,.22)', borderRadius: 11, fontSize: 13, fontFamily: 'inherit', background: '#fdf8f7', outline: 'none', marginBottom: 12 },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(192,57,43,.22)', borderRadius: 11, fontSize: 13, fontFamily: 'inherit', background: '#fdf8f7', outline: 'none', marginBottom: 12, cursor: 'pointer' },
};
const SYS_TYPES = ['ERP', 'MES', 'WMS', 'PLC', 'IoT', 'SCADA', 'HR', '기타'];
const IF_TYPES  = [['api', 'API'], ['db', 'DB 직접'], ['file', 'File'], ['none', '미연동']];
const IF_COLOR  = { api: '#1a7a4a', db: '#1a5fa8', file: '#b7600a', none: 'rgba(26,10,10,.35)' };

export default function ExtSystemMapper() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ module_cd: '', system_type: 'ERP', required_yn: false, interface_type: 'api', effort_add_weeks: 0, warn_txt: '' });

  const { data: mods = [] } = useQuery({ queryKey: ['master-modules'], queryFn: () => masterAPI.getModules().then(r => r.data) });

  const { data: extMaps = [], isLoading } = useQuery({
    queryKey: ['ext-system-map'],
    queryFn: () => api.get('/api/master/ext-system-map').then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: d => api.post('/api/master/ext-system-map', d),
    onSuccess: () => { qc.invalidateQueries(['ext-system-map']); toast.success('외부 시스템 매핑 추가 완료'); setShowForm(false); },
    onError: e => toast.error(e.response?.data?.error || '추가 실패'),
  });
  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/api/master/ext-system-map/${id}`),
    onSuccess: () => { qc.invalidateQueries(['ext-system-map']); toast.success('삭제 완료'); },
  });

  const getNm = cd => mods.find(m => m.module_cd === cd)?.module_nm || cd;

  // 모듈 × 시스템 매트릭스
  const matCell = (modCd, sysType) => extMaps.find(m => m.module_cd === modCd && m.system_type === sysType);

  return (
    <div>
      {/* 매트릭스 뷰 */}
      <div style={S.card}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>모듈 × 외부시스템 연동 매트릭스</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 14px', background: '#1A1A2E', color: '#fff', textAlign: 'left', borderRadius: '8px 0 0 0' }}>모듈</th>
                {SYS_TYPES.slice(0, 6).map(s => (
                  <th key={s} style={{ padding: '8px 10px', background: '#1A1A2E', color: '#fff', textAlign: 'center' }}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mods.map((m, mi) => (
                <tr key={m.module_cd} style={{ background: mi % 2 === 0 ? '#fff' : '#fdf8f7' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 12, borderRight: '2px solid rgba(192,57,43,.12)' }}>{m.module_nm}</td>
                  {SYS_TYPES.slice(0, 6).map(s => {
                    const cell = matCell(m.module_cd, s);
                    const ifc = cell?.interface_type;
                    return (
                      <td key={s} style={{ padding: '7px 8px', textAlign: 'center', border: '1px solid rgba(192,57,43,.06)', background: cell?.required_yn ? 'rgba(192,57,43,.06)' : 'transparent' }}>
                        {cell
                          ? <div>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: `${IF_COLOR[ifc]}18`, color: IF_COLOR[ifc] }}>
                                {IF_TYPES.find(i => i[0] === ifc)?.[1] || ifc}
                              </span>
                              {cell.effort_add_weeks > 0 && <div style={{ fontSize: 8, color: '#b7600a', marginTop: 2 }}>+{cell.effort_add_weeks}주</div>}
                            </div>
                          : <span style={{ color: 'rgba(26,10,10,.1)', fontSize: 12 }}>·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          {IF_TYPES.map(([k, l]) => (
            <span key={k} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${IF_COLOR[k]}18`, color: IF_COLOR[k] }}>■ {l}</span>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>외부 시스템 매핑 목록</div>
          <button onClick={() => { setForm({ module_cd: '', system_type: 'ERP', required_yn: false, interface_type: 'api', effort_add_weeks: 0, warn_txt: '' }); setShowForm(true); }} style={{ padding: '7px 16px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ 매핑 추가</button>
        </div>
        {isLoading
          ? <div style={{ textAlign: 'center', padding: 20, color: 'rgba(26,10,10,.4)' }}>불러오는 중...</div>
          : extMaps.length === 0
            ? <div style={{ color: 'rgba(26,10,10,.35)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                등록된 매핑이 없습니다
                <div style={{ fontSize: 11, marginTop: 8, color: 'rgba(26,10,10,.25)' }}>※ 이 기능은 Phase 3에서 백엔드 API 추가가 필요합니다</div>
              </div>
            : extMaps.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(192,57,43,.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C0392B' }}>{getNm(m.module_cd)}</span>
                  <span style={{ fontSize: 14, color: 'rgba(26,10,10,.3)' }}>↔</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{m.system_type}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: `${IF_COLOR[m.interface_type]}18`, color: IF_COLOR[m.interface_type] }}>{IF_TYPES.find(i => i[0] === m.interface_type)?.[1]}</span>
                  {m.effort_add_weeks > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(183,96,10,.1)', color: '#b7600a' }}>+{m.effort_add_weeks}주</span>}
                  {m.required_yn && <span style={{ fontSize: 9, fontWeight: 700, color: '#C0392B' }}>★ 필수</span>}
                </div>
                <button onClick={() => deleteMut.mutate(m.id)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(192,57,43,.2)', background: 'rgba(192,57,43,.06)', color: '#C0392B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
              </div>
            ))
        }
      </div>

      {showForm && (
        <div style={{ ...S.card, border: '1.5px solid rgba(192,57,43,.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>외부 시스템 매핑 추가</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>대상 모듈</label>
              <select style={S.select} value={form.module_cd} onChange={e => setForm(p => ({ ...p, module_cd: e.target.value }))}>
                <option value="">선택</option>
                {mods.map(m => <option key={m.id} value={m.module_cd}>{m.module_nm}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>외부 시스템 유형</label>
              <select style={S.select} value={form.system_type} onChange={e => setForm(p => ({ ...p, system_type: e.target.value }))}>
                {SYS_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>인터페이스 방식</label>
              <select style={S.select} value={form.interface_type} onChange={e => setForm(p => ({ ...p, interface_type: e.target.value }))}>
                {IF_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>추가 공수(주) — API 연동 시</label>
              <input style={S.input} type="number" step="0.5" value={form.effort_add_weeks} onChange={e => setForm(p => ({ ...p, effort_add_weeks: e.target.value }))} />
            </div>
          </div>
          <label style={S.label}>경고 문구 (선택)</label>
          <input style={S.input} value={form.warn_txt || ''} onChange={e => setForm(p => ({ ...p, warn_txt: e.target.value }))} placeholder="예: 폐쇄형 MES 시 DB 직접 접근, +2~4주 추가" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 14, padding: '10px 12px', background: form.required_yn ? 'rgba(192,57,43,.06)' : '#fdf8f7', borderRadius: 11, border: `1.5px solid ${form.required_yn ? 'rgba(192,57,43,.25)' : 'rgba(192,57,43,.12)'}` }}>
            <input type="checkbox" checked={form.required_yn} onChange={e => setForm(p => ({ ...p, required_yn: e.target.checked }))} style={{ accentColor: '#C0392B' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: form.required_yn ? '#C0392B' : 'rgba(26,10,10,.5)' }}>필수 연동</span>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '11px 20px', background: '#fff', color: 'rgba(26,10,10,.6)', border: '1.5px solid rgba(192,57,43,.2)', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={() => createMut.mutate(form)} disabled={!form.module_cd || createMut.isPending} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#C0392B,#922B21)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
          </div>
        </div>
      )}
    </div>
  );
}
