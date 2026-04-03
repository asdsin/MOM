import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { diagnosisAPI, customerAPI } from '../../api';
import { useDiagnosisStore } from '../../store';
import { getErrorMessage } from '../../utils/getErrorMessage';
import StepBar from './StepBar';
import StepModuleSelect from './StepModuleSelect';
import StepDiagnosis from './StepDiagnosis';

const STEP_LABELS = ['모듈 선택', '현황 진단', '공수 결과'];

export default function DiagnosisFlow() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const {
    step, setStep, sessionId, initSession,
    availableModules, setAvailableModules,
    selectedModules, answers, reset,
  } = useDiagnosisStore();

  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // 고객사 정보 (companyId 있을 때만)
  const { data: company } = useQuery({
    queryKey: ['customer', companyId],
    queryFn: () => customerAPI.get(companyId).then(r => r.data),
    enabled: !!companyId,
  });

  const { data: modules } = useQuery({
    queryKey: ['available-modules'],
    queryFn: () => diagnosisAPI.getAvailableModules().then(r => r.data),
  });

  useEffect(() => {
    if (modules) setAvailableModules(modules);
  }, [modules]);

  // 마운트 시 스토어 초기화 + 세션 생성
  useEffect(() => {
    reset();

    if (!companyId) {
      // 익명 진단: 즉시 세션 생성
      diagnosisAPI.createSession({})
        .then(r => {
          initSession(r.data.session_id, null, null);
          setSessionReady(true);
        })
        .catch(() => toast.error('세션 생성 실패'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 1회만 실행

  // 고객사 연결 진단: company 로드 후 세션 생성
  useEffect(() => {
    if (companyId && company && !sessionReady) {
      diagnosisAPI.createSession({ company_id: Number(companyId) })
        .then(r => {
          initSession(r.data.session_id, companyId, company.company_nm);
          setSessionReady(true);
        })
        .catch(() => toast.error('세션 생성 실패'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  const goStep2 = async () => {
    if (!sessionId) { toast.error('세션이 준비되지 않았습니다. 잠시 후 다시 시도하세요.'); return; }
    if (selectedModules.length === 0) { toast.error('최소 1개 모듈을 선택하세요'); return; }
    setLoading(true);
    try {
      await diagnosisAPI.updateModules(sessionId, selectedModules);
      setStep(2);
    } catch (err) {
      toast.error(getErrorMessage(err, '모듈 저장 실패'));
    } finally { setLoading(false); }
  };

  const goCalculate = async () => {
    const unanswered = selectedModules.filter(m => !answers[m]);
    if (unanswered.length > 0) {
      const names = unanswered.map(m => availableModules.find(x => x.module_cd === m)?.module_nm).join(', ');
      toast.error(`미답변 항목: ${names}`); return;
    }
    setLoading(true);
    try {
      const { data } = await diagnosisAPI.calculate(sessionId);
      navigate(`/diagnosis/result/${sessionId}`, { state: data });
    } catch (err) {
      toast.error(getErrorMessage(err, '공수 산정 실패'));
    } finally { setLoading(false); }
  };

  const titleSuffix = company?.company_nm ? ` — ${company.company_nm}` : '';

  return (
    <Layout title={`MOM 수준 진단${titleSuffix}`}>
      <div style={{ maxWidth: 720 }}>
        <StepBar step={step} labels={STEP_LABELS} />

        {/* 세션 준비 중 */}
        {!sessionReady && (
          <div className="loading-spinner" style={{ marginTop: 40 }}>세션 준비 중...</div>
        )}

        {sessionReady && step === 1 && (
          <StepModuleSelect onNext={goStep2} loading={loading} />
        )}

        {sessionReady && step === 2 && (
          <StepDiagnosis
            onNext={goCalculate}
            onBack={() => setStep(1)}
            loading={loading}
          />
        )}
      </div>
    </Layout>
  );
}
