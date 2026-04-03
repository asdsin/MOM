import toast from 'react-hot-toast';
import { useDiagnosisStore } from '../../store';
import { STAGE_COLORS, STAGE_LABELS } from '../../constants';

export default function StepModuleSelect({ onNext, loading }) {
  const {
    availableModules, selectedModules, toggleModule, canSelect,
  } = useDiagnosisStore();

  const handleModuleClick = (module_cd) => {
    const result = toggleModule(module_cd);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.removed?.length > 0) {
      const names = result.removed
        .map(r => availableModules.find(m => m.module_cd === r)?.module_nm)
        .filter(Boolean);
      toast(`연계 해제: ${names.join(', ')}`, { icon: 'ℹ️' });
    }
  };

  const estWeeks = selectedModules.reduce((s, id) => {
    const m = availableModules.find(x => x.module_cd === id);
    return s + (m ? m.default_effort_n : 0);
  }, 2);

  return (
    <>
      <div className="text-sm" style={{ color: 'var(--t4)', marginBottom: 20, lineHeight: 1.6 }}>
        도입하고 싶은 모듈을 선택하세요. 선행 모듈이 없으면 후행 모듈은 선택할 수 없습니다.
      </div>

      <div className="grid-2" style={{ gap: 14, marginBottom: 18 }}>
        {(availableModules || []).map(m => {
          const isSel = selectedModules.includes(m.module_cd);
          const disabled = !canSelect(m.module_cd) && !isSel;

          return (
            <div
              key={m.module_cd}
              onClick={() => !disabled && handleModuleClick(m.module_cd)}
              className={`module-card${isSel ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
            >
              {isSel && <div className="check-mark">✓</div>}
              {disabled && <div className="lock-icon">🔒</div>}

              <div className={`badge-sm badge-stage-${m.stage_no}`} style={{ marginBottom: 6 }}>
                {STAGE_LABELS[m.stage_no]}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>
                {m.module_nm}
              </div>
              <div className="text-xs" style={{ color: 'var(--t4)', lineHeight: 1.4, marginBottom: 8 }}>
                {m.description}
              </div>

              {m.requires?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {m.requires.map(r => {
                    const rm = availableModules.find(x => x.module_cd === r);
                    return (
                      <span key={r} className="badge-xs badge-red">
                        필수: {rm?.module_nm || r}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택 요약 */}
      <div className="card-outer-sm" style={{ marginBottom: 16 }}>
        <div className="section-label">선택된 모듈</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 24 }}>
          {selectedModules.length === 0
            ? <span className="text-sm" style={{ color: 'var(--t5)' }}>아직 선택된 모듈이 없습니다</span>
            : selectedModules.map(id => {
                const m = availableModules.find(x => x.module_cd === id);
                return (
                  <span key={id} className="badge badge-red">{m?.module_nm}</span>
                );
              })
          }
        </div>
        {selectedModules.length > 0 && (
          <div className="text-sm" style={{ color: 'var(--t4)', marginTop: 10 }}>
            예상 총 공수: <strong className="text-danger">최대 {estWeeks}주 (진단 후 정확 산정)</strong>
          </div>
        )}
      </div>

      <button
        className="btn-primary btn-block"
        onClick={onNext}
        disabled={selectedModules.length === 0 || loading}
      >
        {loading ? '저장 중...' : `다음 — 현황 진단 (${selectedModules.length}개 모듈) →`}
      </button>
    </>
  );
}
