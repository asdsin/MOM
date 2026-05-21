import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';

const S = {
  card:   { background: '#fff', borderRadius: 20, padding: '22px', marginBottom: 14,
            boxShadow: '-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)' },
  label:  { fontSize: 11, fontWeight: 700, color: 'rgba(26,10,10,.55)', marginBottom: 5, display: 'block' },
  input:  { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(192,57,43,.22)', borderRadius: 11, fontSize: 13, fontFamily: 'inherit', background: '#fdf8f7', outline: 'none', marginBottom: 12 },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(192,57,43,.22)', borderRadius: 11, fontSize: 13, fontFamily: 'inherit', background: '#fdf8f7', outline: 'none', marginBottom: 12, cursor: 'pointer' },
};

const ANSWER_TYPE = { yes_no: 'Y/N', score: '점수형', grade: '등급형', multiple: '복수선택' };
const ANSWER_COLOR = { yes_no: '#C0392B', score: '#1a5fa8', grade: '#1a7a4a', multiple: '#b7600a' };

export default function QuestionMapper() {
  const qc = useQueryClient();
  const [selectedMod, setSelectedMod] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question_cd: '', module_id: '', question_txt: '', hint_txt: '', answer_type: 'yes_no', weight: 1.0, required_yn: true, sort_order: 0 });

  const { data: mods = [] } = useQuery({ queryKey: ['master-modules'], queryFn: () => masterAPI.getModules().then(r => r.data) });
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', selectedMod],
    queryFn: () => masterAPI.getQuestions(selectedMod ? { module_id: selectedMod } : {}).then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: d => masterAPI.createQuestion(d),
    onSuccess: () => { qc.invalidateQueries(['questions']); toast.success('질문 등록 완료'); setShowForm(false); },
    onError: e => toast.error(e.response?.data?.error || '등록 실패'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => masterAPI.updateQuestion(id, data),
    onSuccess: () => { qc.invalidateQueries(['questions']); toast.success('수정 완료'); setShowForm(false); },
  });

  const handleEdit = (q) => {
    setForm({ ...q, module_id: q.module_id });
    setShowForm(true);
  };

  const handleSave = () => {
    if (form.id) updateMut.mutate({ id: form.id, data: form });
    else createMut.mutate({ ...form, module_id: selectedMod || form.module_id });
  };

  return (
    <div>
      {/* 모듈 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setSelectedMod('')} style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', background: !selectedMod ? '#C0392B' : 'rgba(192,57,43,.08)', color: !selectedMod ? '#fff' : '#C0392B' }}>전체</button>
        {mods.map(m => (
          <button key={m.id} onClick={() => setSelectedMod(String(m.id))} style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', background: selectedMod === String(m.id) ? '#C0392B' : 'rgba(192,57,43,.08)', color: selectedMod === String(m.id) ? '#fff' : '#C0392B' }}>{m.module_nm}</button>
        ))}
      </div>

      {/* 질문 목록 */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>질문 목록 ({questions.length}개)</div>
          <button onClick={() => { setForm({ question_cd: '', module_id: selectedMod, question_txt: '', hint_txt: '', answer_type: 'yes_no', weight: 1.0, required_yn: true, sort_order: 0 }); setShowForm(true); }} style={{ padding: '7px 16px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ 질문 추가</button>
        </div>

        {isLoading
          ? <div style={{ color: 'rgba(26,10,10,.4)', textAlign: 'center', padding: 20 }}>불러오는 중...</div>
          : questions.length === 0
            ? <div style={{ color: 'rgba(26,10,10,.35)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>등록된 질문이 없습니다</div>
            : questions.map((q, i) => {
              const mod = mods.find(m => m.id === q.module_id);
              const at = ANSWER_TYPE[q.answer_type] || q.answer_type;
              const ac = ANSWER_COLOR[q.answer_type] || '#888';
              return (
                <div key={q.id} style={{ padding: '14px 0', borderBottom: i < questions.length - 1 ? '1px solid rgba(192,57,43,.07)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(192,57,43,.08)', color: '#C0392B' }}>{mod?.module_nm || '모듈 없음'}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: `${ac}18`, color: ac }}>{at}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(26,10,10,.06)', color: 'rgba(26,10,10,.5)' }}>가중치 {q.weight}</span>
                        {q.required_yn && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(192,57,43,.08)', color: '#C0392B' }}>★ 필수</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a0a0a', marginBottom: 4, lineHeight: 1.5 }}>{q.question_txt}</div>
                      {q.hint_txt && <div style={{ fontSize: 11, color: 'rgba(26,10,10,.45)', lineHeight: 1.4 }}>{q.hint_txt}</div>}
                    </div>
                    <button onClick={() => handleEdit(q)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(192,57,43,.2)', background: 'rgba(192,57,43,.06)', color: '#C0392B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: 12 }}>편집</button>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* 질문 등록/편집 폼 */}
      {showForm && (
        <div style={{ ...S.card, border: '1.5px solid rgba(192,57,43,.25)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>{form.id ? '질문 편집' : '새 질문 등록'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>질문 코드</label>
              <input style={S.input} value={form.question_cd} onChange={e => setForm(p => ({ ...p, question_cd: e.target.value }))} placeholder="Q-qual-01" disabled={!!form.id} />
            </div>
            <div>
              <label style={S.label}>대상 모듈</label>
              <select style={S.select} value={form.module_id} onChange={e => setForm(p => ({ ...p, module_id: e.target.value }))}>
                <option value="">선택</option>
                {mods.map(m => <option key={m.id} value={m.id}>{m.module_nm}</option>)}
              </select>
            </div>
          </div>
          <label style={S.label}>질문 내용 ★</label>
          <input style={S.input} value={form.question_txt} onChange={e => setForm(p => ({ ...p, question_txt: e.target.value }))} placeholder="현재 시스템으로 관리하고 있나요?" />
          <label style={S.label}>힌트 (부연 설명)</label>
          <input style={S.input} value={form.hint_txt || ''} onChange={e => setForm(p => ({ ...p, hint_txt: e.target.value }))} placeholder="어떤 기준으로 판단해야 하는지 설명" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={S.label}>답변 유형</label>
              <select style={S.select} value={form.answer_type} onChange={e => setForm(p => ({ ...p, answer_type: e.target.value }))}>
                {Object.entries(ANSWER_TYPE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>가중치 (0~5)</label>
              <input style={S.input} type="number" step="0.1" min="0" max="5" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>정렬 순서</label>
              <input style={S.input} type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, padding: '10px 12px', background: form.required_yn ? 'rgba(192,57,43,.06)' : '#fdf8f7', borderRadius: 11, border: `1.5px solid ${form.required_yn ? 'rgba(192,57,43,.3)' : 'rgba(192,57,43,.15)'}` }}>
                <input type="checkbox" checked={form.required_yn} onChange={e => setForm(p => ({ ...p, required_yn: e.target.checked }))} style={{ accentColor: '#C0392B' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: form.required_yn ? '#C0392B' : 'rgba(26,10,10,.5)' }}>필수 질문</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowForm(false)} style={{ padding: '11px 20px', background: '#fff', color: 'rgba(26,10,10,.6)', border: '1.5px solid rgba(192,57,43,.2)', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            <button onClick={handleSave} disabled={!form.question_txt || createMut.isPending || updateMut.isPending} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg,#C0392B,#922B21)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>저장</button>
          </div>
        </div>
      )}
    </div>
  );
}
