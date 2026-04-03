import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { customerAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/getErrorMessage';

export default function CustomerForm() {
  const nav = useNavigate();
  const qc  = useQueryClient();
  const [form, setForm] = useState({
    company_nm: '', industry_type: '', production_type: '', emp_cnt: '',
    erp_yn: false, mes_yn: false, wms_yn: false, plc_yn: false,
  });

  const mutation = useMutation({
    mutationFn: (data) => customerAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['customers']);
      toast.success('고객사가 등록됐습니다');
      nav('/customers');
    },
    onError: (err) => toast.error(getErrorMessage(err, '등록 실패')),
  });

  const handle = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Layout title="고객사 등록">
      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <label className="form-label">★ 고객사명</label>
          <input className="form-input" value={form.company_nm}
                 onChange={e => handle('company_nm', e.target.value)} placeholder="(주)한국제조" />

          <div className="grid-2">
            <div>
              <label className="form-label">업종</label>
              <select className="form-select" value={form.industry_type}
                      onChange={e => handle('industry_type', e.target.value)}>
                <option value="">선택</option>
                <option value="electronics_assembly">전자조립형</option>
                <option value="mixed_processing">가공·조립 혼합형</option>
                <option value="press_injection">사출·프레스형</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div>
              <label className="form-label">종업원 수</label>
              <input className="form-input" type="number" value={form.emp_cnt}
                     onChange={e => handle('emp_cnt', e.target.value)} placeholder="150" />
            </div>
          </div>

          <label className="form-label" style={{ marginBottom: 10 }}>현행 시스템 보유 여부</label>
          <div className="form-checkbox-group">
            {['erp_yn', 'mes_yn', 'wms_yn', 'plc_yn'].map(k => (
              <label key={k} className={`form-checkbox${form[k] ? ' checked' : ''}`}>
                <input type="checkbox" checked={form[k]}
                       onChange={e => handle(k, e.target.checked)} />
                <span>{k.replace('_yn', '').toUpperCase()} 보유</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => nav(-1)} className="btn-secondary">취소</button>
            <button onClick={() => mutation.mutate(form)}
                    disabled={!form.company_nm || mutation.isPending}
                    className="btn-primary flex-1">
              {mutation.isPending ? '등록 중...' : '고객사 등록 완료'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
