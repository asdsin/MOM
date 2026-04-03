import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { customerAPI } from '../../api';

const INDUSTRY_BADGE = {
  'electronics_assembly': { label:'전자조립', color:'#1a5fa8' },
  'mixed_processing':     { label:'가공혼합', color:'#1a7a4a' },
  'press_injection':      { label:'사출프레스', color:'#b7600a' },
};

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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
               placeholder="🔍  고객사명 검색..." style={{
          padding:'10px 16px', border:'1.5px solid rgba(192,57,43,.25)', borderRadius:12,
          fontSize:13, width:280, fontFamily:'inherit', outline:'none', background:'#fdf8f7',
        }} />
        <button onClick={() => navigate('/customers/new')} style={{
          padding:'11px 22px', background:'#C0392B', color:'#fff', border:'none',
          borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer',
        }}>+ 고객사 등록</button>
      </div>

      {isLoading
        ? <div style={{textAlign:'center', padding:40, color:'rgba(26,10,10,.4)'}}>불러오는 중...</div>
        : list.length === 0
          ? <div style={{textAlign:'center', padding:60, color:'rgba(26,10,10,.4)'}}>
              등록된 고객사가 없습니다. 첫 고객사를 등록해보세요!
            </div>
          : <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16}}>
              {list.map(c => {
                const ind = INDUSTRY_BADGE[c.industry_type];
                return (
                  <div key={c.id} onClick={() => navigate(`/customers/${c.id}`)} style={{
                    background:'#fff', borderRadius:18, padding:'20px', cursor:'pointer',
                    boxShadow:'-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)',
                    transition:'transform .2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'}
                  onMouseOut={e  => e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12}}>
                      <div style={{fontSize:14, fontWeight:800, letterSpacing:'-.01em'}}>{c.company_nm}</div>
                      {ind && <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,
                                background:`${ind.color}18`,color:ind.color}}>{ind.label}</span>}
                    </div>
                    <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
                      {c.erp_yn && <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:8,background:'rgba(26,95,168,.1)',color:'#1a5fa8'}}>ERP</span>}
                      {c.mes_yn && <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:8,background:'rgba(26,122,74,.1)',color:'#1a7a4a'}}>MES</span>}
                      {c.wms_yn && <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:8,background:'rgba(183,96,10,.1)',color:'#b7600a'}}>WMS</span>}
                      {c.plc_yn && <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:8,background:'rgba(123,36,28,.1)',color:'#7B241C'}}>PLC</span>}
                    </div>
                    <button onClick={e => { e.stopPropagation(); navigate(`/diagnosis/${c.id}`); }} style={{
                      marginTop:14, width:'100%', padding:'9px', background:'rgba(192,57,43,.06)',
                      color:'#C0392B', border:'1px solid rgba(192,57,43,.2)', borderRadius:12,
                      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                    }}>
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
