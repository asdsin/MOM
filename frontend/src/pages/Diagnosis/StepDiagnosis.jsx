import { useDiagnosisStore } from '../../store';
import { STAGE_LABELS } from '../../constants';

export default function StepDiagnosis({ onNext, onBack, loading }) {
  const {
    availableModules, selectedModules, answers, setAnswer,
  } = useDiagnosisStore();

  const progPct = selectedModules.length
    ? Math.round(
        Object.keys(answers).filter(k => selectedModules.includes(k)).length
        / selectedModules.length * 100
      )
    : 0;

  const answeredCount = Object.keys(answers).filter(k => selectedModules.includes(k)).length;

  return (
    <>
      {/* 진행 바 */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progPct}%` }} />
      </div>
      <div className="text-sm" style={{ color: 'var(--t4)', marginBottom: 20 }}>
        {answeredCount} / {selectedModules.length} 항목 답변 완료
      </div>

      {selectedModules.map(module_cd => {
        const m = availableModules.find(x => x.module_cd === module_cd);
        const ans = answers[module_cd];
        if (!m) return null;

        return (
          <div key={module_cd} className="card-outer-sm" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>{m.module_nm}</span>
                <span className={`badge-sm badge-stage-${m.stage_no}`}>
                  {STAGE_LABELS[m.stage_no]}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 5, lineHeight: 1.6 }}>
                {m.question_txt || `현재 ${m.module_nm} 기능을 시스템으로 운영하고 있나요?`}
              </div>
              {m.hint_txt && (
                <div className="text-xs" style={{ color: 'var(--t3)', marginBottom: 10, lineHeight: 1.5 }}>
                  {m.hint_txt}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                {['y', 'n'].map(v => (
                  <button
                    key={v}
                    onClick={() => setAnswer(module_cd, v)}
                    className={`answer-btn${ans === v ? (v === 'y' ? ' answer-yes' : ' answer-no') : ''}`}
                  >
                    {v === 'y' ? '✅ 예 (있음)' : '❌ 아니오 (없음)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="btn-secondary" onClick={onBack}>← 모듈 재선택</button>
        <button
          className="btn-primary flex-1"
          onClick={onNext}
          disabled={loading}
        >
          {loading ? '산정 중...' : '공수 산정 →'}
        </button>
      </div>
    </>
  );
}
