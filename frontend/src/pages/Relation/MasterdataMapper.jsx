// ── MasterdataMapper.jsx ─────────────────────────────────────
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';

const S = {
  card:   { background: '#fff', borderRadius: 20, padding: '22px', marginBottom: 14, boxShadow: '-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)' },
  label:  { fontSize: 11, fontWeight: 700, color: 'rgba(26,10,10,.55)', marginBottom: 5, display: 'block' },
  input:  { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(192,57,43,.22)', borderRadius: 11, fontSize: 13, fontFamily: 'inherit', background: '#fdf8f7', outline: 'none', marginBottom: 12 },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(192,57,43,.22)', borderRadius: 11, fontSize: 13, fontFamily: 'inherit', background: '#fdf8f7', outline: 'none', marginBottom: 12, cursor: 'pointer' },
};

const TAG_PRESETS = ['필수', 'API 필수', '이관', '신규', '기준정보', '인프라'];
const TAG_COLORS  = { '필수': 'ff9f0a', 'API 필수': '2997ff', '이관': 'ff453a', '신규': 'ff453a', '기준정보': 'ff9f0a', '인프라': '32d2f0' };

export function MasterdataMapper() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ module_cd: 'common', masterdata_type: '', checklist_item: '', priority_tag: '필수', color_hex: 'ff9f0a', required_yn: true });

  const { data: mods = [] } = useQuery({ queryKey: ['master-modules'], queryFn: () => masterAPI.getModules().then(r => r.data) });
  const { data: items = [], isLoading } = useQuery({ queryKey: ['masterdata-map'], queryFn: () => masterAPI.getMasterdataMap().then(r => r.data) });

  const createMut = useMutation({
    mutationFn: d => masterAPI.createMasterdataMap(d),
    onSuccess: () => { qc.invalidateQueries(['masterdata-map']); toast.success('수집 자료 추가 완료'); setShowForm(false); },
    onError: e => toast.error(e.response?.data?.error || '추가 실패'),
  });

  const modOptions = [{ module_cd: 'common', module_nm: '[공통] 모든 모듈' }, ...mods];
  const grouped = items.reduce((acc, item) => {
    const key = item.module_cd;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>수집 자료 체크리스트 ({items.length}개)</div>
          <button onClick={() => { setForm({ module_cd: 'common', masterdata_type: '', checklist_item: '', priority_tag: '필수', color_hex: 'ff9f0a', required_yn: true }); setShowForm(true); }} style={{ padding: '7px 16px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ 항목 추가</button>
        </div>
        {isLoading
          ? <div style={{ textAlign: 'center', padding: 20, color: 'rgba(26,10,10,.4)' }}>불러오는 중...</div>
          : Object.entries(grouped).map(([modCd, modItems]) => {
            const modNm = modCd === 'common' ? '[공통]' : mods.find(m => m.module_cd === modCd)?.module_nm || modCd;
            return (
              <div key={modCd} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C0392B', letterSpacing: '.06em', marginBottom: 8, padding: '4px 10px', background: 'rgba(192,57,43,.06)', borderRadius: 8, display: 'inline-block' }}>{modNm}</div>
                {modItems.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < modItems.length - 1 ? '1px solid rgba(192,57,43,.06)' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: `#${item.color_hex}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 12, color: '#1a0a0a', lineHeight: 1.45 }}>{item.checklist_item}</div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `#${item.color_hex}18`, color: `#${item.color_hex}` }}>{item.priority_tag}</span>
                    {item.required_yn && <span style={{ fontSize: 9, fontWeight: 700, color: '#C0392B' }}>★</span>}
                  </div>
                ))}
              </div>
            );
          })
        }
      </div>

      {showForm && (
        <div style={{ ...S.card, border: '1.5px solid rgba(192,57,43,.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>수집 자료 항목 추가</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>대상 모듈</label>
              <select style={S.select} value={form.module_cd} onChange={e => setForm(p => ({ ...p, module_cd: e.target.value }))}>
                {modOptions.map(m => <option key={m.module_cd} value={m.module_cd}>{m.module_nm}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>우선순위 태그</label>
              <select style={S.select} value={form.priority_tag} onChange={e => setForm(p => ({ ...p, priority_tag: e.target.value, color_hex: TAG_COLORS[e.target.value] || 'ff9f0a' }))}>
                {TAG_PRESETS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <label style={S.label}>자료 유형</label>
          <input style={S.input} value={form.masterdata_type} onChange={e => setForm(p => ({ ...p, masterdata_type: e.target.value }))} placeholder="예: 설비 목록" />
          <label style={S.label}>체크리스트 문구 ★</label>
          <input style={S.input} value={form.checklist_item} onChange={e => setForm(p => ({ ...p, checklist_item: e.target.value }))} placeholder="예: 설비 목록 엑셀 (코드·이름·PM 주기)" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 14, padding: '10px 12px', background: form.required_yn ? 'rgba(192,57,43,.06)' : '#fdf8f7', borderRadius: 11, border: `1.5px solid ${form.required_yn ? 'rgba(192,57,43,.25)' : 'rgba(192,57,43,.12)'}` }}>
            <input type="checkbox" checked={form.required_yn} onChange={e => setForm(p => ({ ...p, required_yn: e.target.checked }))} style={{ accentColor: '#C0392B' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: form.required_yn ? '#C0392B' : 'rgba(26,10,10,.5)' }}>필수 수집 항목</span>
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '11px 20px', background: '#fff', color: 'rgba(26,10,10,.6)', border: '1.5px solid rgba(192,57,43,.2)', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={() => createMut.mutate(form)} disabled={!form.checklist_item || createMut.isPending} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#C0392B,#922B21)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>추가</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default MasterdataMapper;
