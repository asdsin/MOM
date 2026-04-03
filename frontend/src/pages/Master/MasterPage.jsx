import { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuthStore } from '../../store';
import { MASTER_TABS } from '../../constants';
import ModuleTab from './ModuleTab';
import DependencyTab from './DependencyTab';
import RuleTab from './RuleTab';
import TemplateTab from './TemplateTab';

export default function MasterPage() {
  const [tab, setTab]   = useState(0);
  const { user }        = useAuthStore();
  const canEdit = ['super_admin','system_admin','master_admin'].includes(user?.role_code);

  return (
    <Layout title="기준정보 관리">
      {/* 탭바 */}
      <div className="tab-bar" style={{ maxWidth: 600 }}>
        {MASTER_TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`tab-btn${tab === i ? ' active' : ''}`}
          >{t}</button>
        ))}
      </div>

      {tab === 0 && <ModuleTab canEdit={canEdit} />}
      {tab === 1 && <DependencyTab canEdit={canEdit} />}
      {tab === 2 && <RuleTab canEdit={canEdit} />}
      {tab === 3 && <TemplateTab canEdit={canEdit} />}
    </Layout>
  );
}
