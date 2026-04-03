export default function StepBar({ step, labels }) {
  return (
    <div className="step-bar">
      {labels.map((label, i) => {
        const n = i + 1;
        const cls = n === step ? 'active' : n < step ? 'done' : '';
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div className={`step-item ${cls}`}>
              <div className="circle">{cls === 'done' ? '✓' : n}</div>
              {label}
            </div>
            {i < labels.length - 1 && <div className="step-connector" />}
          </div>
        );
      })}
    </div>
  );
}
