import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { diagnosisAPI } from '../../api';
import { useDiagnosisStore } from '../../store';
import { EFFORT_TYPE_LABEL, EFFORT_TYPE_COLOR, DIAGNOSIS_RESULT_TABS } from '../../constants';

export default function DiagnosisResult() {
  const { sessionId } = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();
  const { reset }     = useDiagnosisStore();
  const [curTab, setCurTab] = useState(0);

  const { data: apiResult } = useQuery({
    queryKey: ['result', sessionId],
    queryFn: () => diagnosisAPI.getResult(sessionId).then(r => r.data),
    enabled: !state,
  });

  const result = state || apiResult;
  if (!result) return (
    <Layout title="진단 결과">
      <div className="loading-spinner">불러오는 중...</div>
    </Layout>
  );

  const sm = result.stage_meta;
  const rows = result.effort_rows || result.module_efforts || [];

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await diagnosisAPI.exportExcel(sessionId);
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MOM_진단결과_${sessionId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel 보고서 다운로드 완료');
    } catch (e) {
      console.error(e);
      toast.error('Excel 다운로드 실패');
    } finally {
      setExporting(false);
    }
  };

  // 추진 일정 자동 생성
  const buildSchedule = () => {
    const sch = []; let w = 1;
    const push = (weeks, title, body, color) => {
      sch.push({ week: `${w}~${w + Math.max(0, weeks - 1)}주`, title, body, color });
      w += Math.max(1, weeks);
    };
    push(2, '기준정보 수집 및 시스템 등록', '현장 방문 → 기준정보 수집 → 엑셀 정제 → 시스템 등록', '#b7600a');
    const buildWks = Math.max(2, Math.round(rows.filter(r => r.effort_type !== 'master').reduce((s, r) => s + (parseFloat(r.effort_weeks) || 0), 0) * 0.6));
    push(buildWks, '핵심 모듈 개발·배포', rows.filter(r => r.module_cd !== 'common').map(r => r.module_nm).join('·'), '#1a7a4a');
    const apiItems = rows.filter(r => r.effort_type === 'api');
    if (apiItems.length) push(
      Math.round(apiItems.reduce((s, r) => s + (parseFloat(r.effort_weeks) || 0), 0) * 0.75),
      `API 연동 (${apiItems.map(r => r.module_nm).join('·')})`,
      'API 스펙 확인 → 개발 → 테스트', '#1a5fa8'
    );
    push(2, 'UAT 및 현장 검증', '공정·라인별 실제 시나리오 검증. 현장 담당자 피드백 반영.', '#7B241C');
    if (result.stage_no >= 2) push(3, '전체 라인 확산 및 안정화', '파일럿 후 전 라인 확산. 운영 이슈 모니터링.', '#1a7a4a');
    return sch;
  };

  const checklist = result.checklist || [];

  const summaryStats = [
    { v: `${result.total_weeks_min}~${result.total_weeks_max}주`, l: '총 소요 기간', c: sm?.color || '#C0392B' },
    { v: '2주', l: '기준정보 등록', c: '#b7600a' },
    { v: `${rows.filter(r => r.module_cd !== 'common').reduce((s, r) => s + (parseFloat(r.effort_weeks) || 0), 0)}주`, l: '개발·이관·연동', c: '#1a5fa8' },
    { v: `${(result.selected_modules || []).length}개`, l: '선택 모듈', c: '#1a7a4a' },
  ];

  return (
    <Layout title="공수 산정 결과">
      <div style={{ maxWidth: 720 }}>

        {/* 판정 카드 */}
        <div className="result-judgment" style={{
          background: sm?.bg || '#FEF0EE',
          border: `1.5px solid ${sm?.bc || 'rgba(192,57,43,.2)'}`,
        }}>
          <span className="badge" style={{
            background: sm?.bg, color: sm?.color,
            border: `1px solid ${sm?.bc}`, marginBottom: 14, display: 'inline-block',
          }}>
            {sm?.badge || `Stage ${result.stage_no}`}
          </span>
          <div className="font-black" style={{ fontSize: 22, letterSpacing: '-.02em', color: sm?.color || '#C0392B', marginBottom: 10 }}>
            {sm?.title}
          </div>
          <div className="text-sm" style={{ color: 'var(--t2)', lineHeight: 1.6 }}>{sm?.desc}</div>
        </div>

        {/* 공수 요약 카드 4개 */}
        <div className="grid-4" style={{ gap: 10, marginBottom: 14 }}>
          {summaryStats.map(c => (
            <div key={c.l} className="result-stat">
              <div className="value" style={{ color: c.c }}>{c.v}</div>
              <div className="label">{c.l}</div>
            </div>
          ))}
        </div>

        {/* API 경고 */}
        {result.api_warns?.length > 0 && (
          <div className="api-warn">
            <div className="title">⚠ API 연동 일정 변수</div>
            {result.api_warns.map((w, idx) => (
              <div key={`warn-${idx}`} className="item">• {w}</div>
            ))}
          </div>
        )}

        {/* 탭 */}
        <div className="tab-bar" style={{ marginBottom: 14 }}>
          {DIAGNOSIS_RESULT_TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setCurTab(i)}
              className={`tab-btn${curTab === i ? ' active' : ''}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="card-outer" style={{ marginBottom: 16 }}>

          {/* 탭 0: 공수 상세 */}
          {curTab === 0 && rows.map(r => (
            <div key={r.module_cd || r.module_nm} className="data-row" style={{ alignItems: 'flex-start', gap: 8 }}>
              <div className="flex-1">
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.module_nm}</div>
                <div className="text-xs" style={{ color: 'var(--t3)', marginTop: 2 }}>{r.reason}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {r.answer_val && (
                  <span className="text-sm" style={{ color: r.answer_val === 'y' ? 'var(--green)' : 'var(--red)' }}>
                    {r.answer_val === 'y' ? '✅ 있음' : '❌ 없음'}
                  </span>
                )}
                <span className="badge-xs" style={{
                  background: `${EFFORT_TYPE_COLOR[r.effort_type] || '#888'}18`,
                  color: EFFORT_TYPE_COLOR[r.effort_type] || '#888',
                }}>
                  {EFFORT_TYPE_LABEL[r.effort_type] || r.effort_type}
                </span>
                <span className="font-black text-danger" style={{ fontSize: 14, minWidth: 30, textAlign: 'right' }}>
                  {parseFloat(r.effort_weeks) > 0 ? `${r.effort_weeks}주` : '—'}
                </span>
              </div>
            </div>
          ))}
          {curTab === 0 && (
            <div className="footnote">
              ※ 병렬 진행 반영 — 총 기간은 합산의 약 70~75%로 산정합니다.
            </div>
          )}

          {/* 탭 1: 추진 일정 */}
          {curTab === 1 && buildSchedule().map((s, i, arr) => (
            <div key={s.title} className="timeline-item" style={{ paddingBottom: i < arr.length - 1 ? 18 : 0 }}>
              <div className="timeline-dot" style={{ background: s.color }} />
              {i < arr.length - 1 && <div className="timeline-line" />}
              <div className="text-xs font-bold" style={{ color: 'var(--t3)', marginBottom: 2 }}>{s.week}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{s.title}</div>
              <div className="text-sm" style={{ color: 'var(--t2)', lineHeight: 1.5 }}>{s.body}</div>
            </div>
          ))}

          {/* 탭 2: 수집 자료 */}
          {curTab === 2 && (
            checklist.length === 0
              ? <div className="empty-state">수집 자료 정보가 없습니다</div>
              : checklist.map((c, i) => (
                <div key={c.tag || `check-${i}`} className="data-row" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7, background: `#${c.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0, marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.45 }}>{c.text}</div>
                    <span className="badge-xs" style={{
                      background: `#${c.color}18`, color: `#${c.color}`,
                      display: 'inline-block', marginTop: 4,
                    }}>{c.tag}</span>
                  </div>
                  <div style={{ fontSize: 16, flexShrink: 0 }}>☐</div>
                </div>
              ))
          )}
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExport} disabled={exporting}
                  className="btn-primary flex-1 btn-block"
                  style={{ opacity: exporting ? .6 : 1 }}>
            {exporting ? '다운로드 중...' : '📊 Excel 보고서 다운로드'}
          </button>
          <button onClick={() => { reset(); navigate('/customers'); }}
                  className="btn-secondary flex-1">
            ↺ 다시 진단하기
          </button>
        </div>
      </div>
    </Layout>
  );
}
