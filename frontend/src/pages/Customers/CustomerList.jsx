import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { customerAPI } from '../../api';
import { INDUSTRY_BADGE } from '../../constants';

export default function CustomerList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn:  () => customerAPI.list({ search, limit: 50 }).then(r => r.data),
  });
  const list = data?.data || [];

  return (
    <Layout title="고객사 관리">
      <div className="flex-between mb-md">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  고객사명 검색..."
          className="form-search"
        />
        <button onClick={() => navigate('/customers/new')} className="btn-primary-pill">
          + 고객사 등록
        </button>
      </div>

      {isLoading
        ? <div className="loading-spinner">불러오는 중...</div>
        : list.length === 0
          ? <div className="empty-state" style={{ padding: 60 }}>
              등록된 고객사가 없습니다. 첫 고객사를 등록해보세요!
            </div>
          : <div className="grid-auto">
              {list.map(c => {
                const ind = INDUSTRY_BADGE[c.industry_type];
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="customer-card"
                  >
                    <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-.01em' }}>{c.company_nm}</div>
                      {ind && (
                        <span className="badge-sm" style={{ background: `${ind.color}18`, color: ind.color }}>
                          {ind.label}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {c.erp_yn && <span className="badge-erp">ERP</span>}
                      {c.mes_yn && <span className="badge-mes">MES</span>}
                      {c.wms_yn && <span className="badge-wms">WMS</span>}
                      {c.plc_yn && <span className="badge-plc">PLC</span>}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/diagnosis/${c.id}`); }}
                      className="btn-diagnosis"
                    >
                      MOM 수준 진단 시작 →
                    </button>
                  </div>
                );
              })}
            </div>
      }
    </Layout>
  );
}
