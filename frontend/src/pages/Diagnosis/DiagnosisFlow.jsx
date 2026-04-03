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

  const { data: company } = useQuery({
    queryKey: ['customer', companyId],
    queryFn: () => customerAPI.get(companyId).then(r => r.data),
  });

  const { data: modules } = useQuery({
    queryKey: ['available-modules'],
    queryFn: () => diagnosisAPI.getAvailableModules().then(r => r.data),
  });

  useEffect(() => {
    if (modules) setAvailableModules(modules);
  }, [modules]);

  useEffect(() => {
    if (companyId && company && !sessionId) {
      diagnosisAPI.createSession({ company_id: Number(companyId) })
        .then(r => initSession(r.data.session_id, companyId, company.company_nm))
        .catch(() => toast.error('세션 생성 실패'));
    }
  }, [company]);

  const goStep2 = async () => {
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

  return (
    <Layout title={`MOM 수준 진단 — ${company?.company_nm || ''}`}>
      <div style={{ maxWidth: 720 }}>
        <StepBar step={step} labels={STEP_LABELS} />

        {step === 1 && (
          <StepModuleSelect onNext={goStep2} loading={loading} />
        )}

        {step === 2 && (
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
