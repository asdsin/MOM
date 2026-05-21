import { useState } from 'react';
import Layout from '../../components/Layout';
import DependencyManager from './DependencyManager';
import QuestionMapper    from './QuestionMapper';
import MasterdataMapper  from './MasterdataMapper';
import ExtSystemMapper   from './ExtSystemMapper';
import RuleBuilder       from './RuleBuilder';

const TABS = [
  { id: 'dep',    icon: '🔗', label: '모듈 의존성',    desc: '선행·후행 관계 설정' },
  { id: 'q',      icon: '❓', label: '질문 매핑',       desc: '질문 ↔ 모듈 연결' },
  { id: 'master', icon: '📋', label: '기준정보 매핑',   desc: '수집 자료 자동 연결' },
  { id: 'ext',    icon: '🔌', label: '외부 시스템',     desc: 'ERP/MES/PLC 연동 규칙' },
  { id: 'rule',   icon: '⚖️', label: '판정 룰',         desc: 'Stage 판정·공수 기준' },
];

export default function RelationPage() {
  const [activeTab, setActiveTab] = useState('dep');
  const current = TABS.find(t => t.id === activeTab);

  return (
    <Layout title="연관성 설정 관리">
      <div style={{ maxWidth: 1100 }}>

        {/* 탭바 */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 24,
          background: 'rgba(192,57,43,.08)', borderRadius: 16, padding: 6,
          boxShadow: 'inset -2px -2px 5px rgba(255,220,210,.75), inset 2px 2px 6px rgba(146,43,33,.15)',
          overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 16px', borderRadius: 12, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              background:    activeTab === t.id ? '#fff' : 'none',
              color:         activeTab === t.id ? '#C0392B' : 'rgba(26,10,10,.5)',
              fontWeight:    activeTab === t.id ? 700 : 400,
              fontSize: 13,
              boxShadow:     activeTab === t.id ? '0 2px 8px rgba(192,57,43,.12)' : 'none',
              transition: 'all .2s',
            }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(26,10,10,.4)', marginTop: 1 }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'dep'    && <DependencyManager />}
        {activeTab === 'q'      && <QuestionMapper />}
        {activeTab === 'master' && <MasterdataMapper />}
        {activeTab === 'ext'    && <ExtSystemMapper />}
        {activeTab === 'rule'   && <RuleBuilder />}
      </div>
    </Layout>
  );
}
