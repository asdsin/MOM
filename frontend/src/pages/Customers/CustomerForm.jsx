import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { customerAPI } from '../../api';
import toast from 'react-hot-toast';

const S = {
  label: { display:'block', fontSize:12, fontWeight:700, color:'rgba(26,10,10,.65)', marginBottom:6 },
  input: { width:'100%', padding:'11px 14px', border:'1.5px solid rgba(192,57,43,.25)',
           borderRadius:12, fontSize:14, fontFamily:'inherit', outline:'none', background:'#fdf8f7', marginBottom:16 },
  row:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  chk:   { display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
           background:'#fdf8f7', borderRadius:12, border:'1.5px solid rgba(192,57,43,.15)', cursor:'pointer' },
};

export default function CustomerForm() {
  const nav = useNavigate();
  const qc  = useQueryClient();
  const [form, setForm] = useState({
    company_nm:'', industry_type:'', production_type:'', emp_cnt:'',
    erp_yn:false, mes_yn:false, wms_yn:false, plc_yn:false,
  });

  const mutation = useMutation({
    mutationFn: (data) => customerAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['customers']);
      toast.success('고객사가 등록됐습니다');
      nav('/customers');
    },
    onError: (err) => toast.error(err.response?.data?.error || '등록 실패'),
  });

  const handle = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Layout title="고객사 등록">
      <div style={{ maxWidth:600 }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px',
                      boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)' }}>

          <label style={S.label}>★ 고객사명</label>
          <input style={S.input} value={form.company_nm}
                 onChange={e => handle('company_nm', e.target.value)} placeholder="(주)한국제조" />

          <div style={S.row}>
            <div>
              <label style={S.label}>업종</label>
              <select style={{...S.input, cursor:'pointer'}} value={form.industry_type}
                      onChange={e => handle('industry_type', e.target.value)}>
                <option value="">선택</option>
                <option value="electronics_assembly">전자조립형</option>
                <option value="mixed_processing">가공·조립 혼합형</option>
                <option value="press_injection">사출·프레스형</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div>
              <label style={S.label}>종업원 수</label>
              <input style={S.input} type="number" value={form.emp_cnt}
                     onChange={e => handle('emp_cnt', e.target.value)} placeholder="150" />
            </div>
          </div>

          <label style={{...S.label, marginBottom:10}}>현행 시스템 보유 여부</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
            {['erp_yn','mes_yn','wms_yn','plc_yn'].map(k => (
              <label key={k} style={{...S.chk,
                background: form[k] ? 'rgba(192,57,43,.06)' : '#fdf8f7',
                borderColor: form[k] ? 'rgba(192,57,43,.35)' : 'rgba(192,57,43,.15)'}}>
                <input type="checkbox" checked={form[k]}
                       onChange={e => handle(k, e.target.checked)} style={{accentColor:'#C0392B'}} />
                <span style={{fontSize:13, fontWeight:700, color: form[k] ? '#C0392B' : 'rgba(26,10,10,.7)'}}>
                  {k.replace('_yn','').toUpperCase()} 보유
                </span>
              </label>
            ))}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => nav(-1)} style={{
              padding:'12px 22px', background:'#fff', color:'rgba(26,10,10,.6)',
              border:'1.5px solid rgba(192,57,43,.25)', borderRadius:14, fontSize:14,
              fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>취소</button>
            <button onClick={() => mutation.mutate(form)}
                    disabled={!form.company_nm || mutation.isPending} style={{
              flex:1, padding:'13px', background:'linear-gradient(135deg,#C0392B,#922B21)',
              color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:700,
              cursor:'pointer', fontFamily:'inherit', opacity: !form.company_nm ? .4 : 1,
            }}>
              {mutation.isPending ? '등록 중...' : '고객사 등록 완료'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
