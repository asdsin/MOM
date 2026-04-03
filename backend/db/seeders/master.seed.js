'use strict';
const bcrypt = require('bcryptjs');
const {
  AuthUser, MasterModule, MasterQuestion, MasterMaturityStage,
  MasterJudgmentRule, MasterTemplateIndustry,
  RelModuleDependency, RelModuleMasterdata,
} = require('../../src/models');

module.exports = async function seed() {
  const isFirstRun = (await MasterModule.count()) === 0;
  console.log(isFirstRun ? '🌱 기준정보 시드 시작...' : '🔄 질문 데이터 최신화 중...');

  // ── 1. 슈퍼관리자 ─────────────────────────────────────────
  if (isFirstRun) {
    const exists = await AuthUser.findOne({ where: { email: 'admin' } });
    if (!exists) {
      await AuthUser.create({
        tenant_id: 'wizfactory', email: 'admin',
        password_hash: await bcrypt.hash('admin1234!', 12),
        name: '시스템 관리자', user_type: 'internal', role_code: 'super_admin',
      });
      console.log('  ✅ 관리자 계정: admin / admin1234!');
    }
  }

  // ── 2. 모듈 (최초 1회) ────────────────────────────────────
  if (!isFirstRun) {
    // 질문만 최신화 후 종료
    await upsertQuestions();
    console.log('🎉 질문 최신화 완료!');
    return;
  }

  const MODULES = [
    { module_cd:'data',  module_nm:'실적·공정 데이터 수집',  stage_no:1,
      description:'디지털 작업지시·실시간 실적·PLC 연동',
      default_effort_y:2.0, effort_type_y:'partial', reason_y:'기존 데이터 이관 + 연동 설정만 필요',
      default_effort_n:6.0, effort_type_n:'build',   reason_n:'디지털 WO + 실적 입력 화면 + UAT 개발',
      status:'approved' },
    { module_cd:'pm',    module_nm:'설비·보전 관리',          stage_no:1,
      description:'PM 점검 디지털화·고장 이력·MTBF 분석',
      default_effort_y:1.0, effort_type_y:'data',    reason_y:'PM 이력 데이터 이관만 필요',
      default_effort_n:5.0, effort_type_n:'build',   reason_n:'PM 기준정보 등록 + 모바일 체크리스트 + UAT',
      status:'approved' },
    { module_cd:'qual',  module_nm:'품질 관리',               stage_no:2,
      description:'불량 등록·LOT 추적·자동 에스컬레이션',
      default_effort_y:2.0, effort_type_y:'partial', reason_y:'에스컬레이션 설정 보완 + LOT 연동',
      default_effort_n:5.0, effort_type_n:'build',   reason_n:'품질 기준정보 + 불량등록·LOT추적 + UAT',
      status:'approved' },
    { module_cd:'sop',   module_nm:'SOP 관리',                stage_no:2,
      description:'표준 작업 절차 디지털화·버전 관리·교육 연계',
      default_effort_y:2.0, effort_type_y:'data',    reason_y:'기존 SOP 문서 디지털 이관',
      default_effort_n:4.0, effort_type_n:'build',   reason_n:'SOP 등록 + 버전관리·승인 워크플로우 + UAT',
      status:'approved' },
    { module_cd:'issue', module_nm:'이슈 관리',               stage_no:2,
      description:'이슈 즉시 등록·자동 알림·조치 이력 추적',
      default_effort_y:1.5, effort_type_y:'partial', reason_y:'자동 알림·배정 설정 보완',
      default_effort_n:4.0, effort_type_n:'build',   reason_n:'이슈 등록·알림·조치이력 + UAT',
      status:'approved' },
    { module_cd:'kpi',   module_nm:'실적 집계',               stage_no:3,
      description:'생산 실적 자동 집계·KPI 리포트·대시보드',
      default_effort_y:2.0, effort_type_y:'partial', reason_y:'KPI 대시보드 연동 설정',
      default_effort_n:5.0, effort_type_n:'build',   reason_n:'실적 집계·KPI 리포트·대시보드 + UAT',
      status:'approved' },
    { module_cd:'erp',   module_nm:'ERP 연동',                stage_no:2,
      description:'ERP API 연동·오더·BOM 자동 처리',
      default_effort_y:6.5, effort_type_y:'api',     reason_y:'ERP API 연동 개발 + BOM 이관',
      api_warn:'ERP API 개방 여부 확인 필수. 폐쇄형 시 DB 직접 접근, +2~4주',
      default_effort_n:0.0, effort_type_n:'skip',    reason_n:'ERP 미보유 — WIZ-Flow 독립 PWA로 시작',
      status:'approved' },
    { module_cd:'infra', module_nm:'현장 인프라',             stage_no:1,
      description:'디바이스·네트워크 환경 구축 컨설팅',
      default_effort_y:0.0, effort_type_y:'skip',    reason_y:'인프라 완비 — 즉시 도입 가능',
      default_effort_n:2.0, effort_type_n:'build',   reason_n:'디바이스 조달·네트워크 설치 컨설팅',
      status:'approved' },
  ];
  const createdMods = await MasterModule.bulkCreate(MODULES);
  const modMap = Object.fromEntries(createdMods.map(m => [m.module_cd, m.id]));
  console.log(`  ✅ 모듈 ${MODULES.length}개 생성`);

  // ── 3. 질문 (upsert — 항상 최신 유지) ──────────────────────
  await upsertQuestions(modMap);
  console.log('  ✅ 질문 8개 생성/갱신');

  // ── 4. 성숙도 단계 ────────────────────────────────────────
  await MasterMaturityStage.bulkCreate([
    { stage_no:1, stage_nm:'Stage 1 — 기초 구축',   badge_txt:'Stage 1 — 기초 구축',
      title_txt:'종이 없는 현장 — 디지털 전환 시작',
      desc_txt:'WIZ-Flow PWA로 종이·엑셀을 디지털로 전환합니다.', color_hex:'C0392B' },
    { stage_no:2, stage_nm:'Stage 2 — 핵심 연동',   badge_txt:'Stage 2 — 핵심 연동',
      title_txt:'ERP·시스템 연동 + KPI 자동화',
      desc_txt:'ERP와 API 연동으로 오더·실적 자동 처리.', color_hex:'1a7a4a' },
    { stage_no:3, stage_nm:'Stage 3 — 통합 자동화', badge_txt:'Stage 3 — 통합 자동화',
      title_txt:'PLC·센서 연동 + 실시간 통합 관제',
      desc_txt:'PLC·센서 연동으로 설비 데이터 자동 수집.', color_hex:'7B241C' },
    { stage_no:4, stage_nm:'Stage 4 — AI 최적화',   badge_txt:'Stage 4 — AI 최적화',
      title_txt:'AI 예측·자율 실행',
      desc_txt:'AI로 설비 고장을 사전 감지합니다.', color_hex:'b7600a' },
  ]);
  console.log('  ✅ 성숙도 단계 4개 생성');

  // ── 5. 판정 룰 ────────────────────────────────────────────
  await MasterJudgmentRule.bulkCreate([
    { rule_cd:'R-STAGE3',  stage_no:3, condition_json:{ required_modules:['kpi'], min_ratio:0 }, result_stage:3, priority:30 },
    { rule_cd:'R-STAGE2A', stage_no:2, condition_json:{ required_modules:['qual'], min_ratio:0 }, result_stage:2, priority:20 },
    { rule_cd:'R-STAGE2B', stage_no:2, condition_json:{ required_modules:['erp'], min_ratio:0 }, result_stage:2, priority:19 },
    { rule_cd:'R-STAGE1',  stage_no:1, condition_json:{}, result_stage:1, priority:0 },
  ]);
  console.log('  ✅ 판정 룰 4개 생성');

  // ── 6. 모듈 의존성 ────────────────────────────────────────
  await RelModuleDependency.bulkCreate([
    { parent_module_cd:'data', child_module_cd:'qual',  rel_type:'required' },
    { parent_module_cd:'data', child_module_cd:'sop',   rel_type:'required' },
    { parent_module_cd:'data', child_module_cd:'erp',   rel_type:'required' },
    { parent_module_cd:'qual', child_module_cd:'issue', rel_type:'required' },
    { parent_module_cd:'data', child_module_cd:'kpi',   rel_type:'required' },
    { parent_module_cd:'qual', child_module_cd:'kpi',   rel_type:'required' },
    { parent_module_cd:'issue',child_module_cd:'kpi',   rel_type:'required' },
  ]);
  console.log('  ✅ 모듈 의존성 7개 생성');

  // ── 7. 수집 자료 체크리스트 ──────────────────────────────
  await RelModuleMasterdata.bulkCreate([
    { module_cd:'common', masterdata_type:'조직/공장 계층', checklist_item:'조직·공장·라인·공정 계층구조 정의서', required_yn:true, priority_tag:'필수', color_hex:'ff9f0a' },
    { module_cd:'common', masterdata_type:'설비 목록',      checklist_item:'설비 목록 엑셀 (코드·이름·PM 주기·점검 항목)', required_yn:true, priority_tag:'필수', color_hex:'ff9f0a' },
    { module_cd:'common', masterdata_type:'작업자 명단',    checklist_item:'작업자 명단 (사번·담당 공정)', required_yn:true, priority_tag:'필수', color_hex:'ff9f0a' },
    { module_cd:'pm',     masterdata_type:'PM 이력',        checklist_item:'PM 이력 엑셀 (최근 6개월)', required_yn:true, priority_tag:'이관', color_hex:'ff453a' },
    { module_cd:'qual',   masterdata_type:'불량 코드',      checklist_item:'불량 유형 코드 정의 (5~10개) + 임계값 기준', required_yn:true, priority_tag:'신규', color_hex:'ff453a' },
    { module_cd:'sop',    masterdata_type:'SOP 문서',       checklist_item:'현행 SOP 문서 전체 (PDF·한글·Word 무관)', required_yn:true, priority_tag:'이관', color_hex:'ff453a' },
    { module_cd:'erp',    masterdata_type:'ERP API 스펙',   checklist_item:'ERP API 스펙 문서 (인증방식·엔드포인트) ← 최우선 확인', required_yn:true, priority_tag:'API 필수', color_hex:'2997ff' },
    { module_cd:'kpi',    masterdata_type:'KPI 목표값',     checklist_item:'KPI 목표값 (생산량·불량률·OEE 등 라인별)', required_yn:true, priority_tag:'기준정보', color_hex:'ff9f0a' },
    { module_cd:'infra',  masterdata_type:'디바이스 현황',  checklist_item:'현장 디바이스 현황 (태블릿·스마트폰 보급 대수 및 OS)', required_yn:true, priority_tag:'인프라', color_hex:'32d2f0' },
  ]);
  console.log('  ✅ 수집자료 체크리스트 9개 생성');

  // ── 8. 업종 템플릿 ────────────────────────────────────────
  await MasterTemplateIndustry.bulkCreate([
    { template_cd:'T-ELEC',   template_nm:'전자조립형',      industry_type:'electronics_assembly',
      default_module_cds:['data','pm','qual','sop','issue'], description:'스마트폰·PCB·전자부품 조립 라인 기본 템플릿' },
    { template_cd:'T-MIXED',  template_nm:'가공·조립 혼합형',industry_type:'mixed_processing',
      default_module_cds:['data','pm','qual','erp'],         description:'금속 가공 + 조립 혼합 라인 기본 템플릿' },
    { template_cd:'T-PRESS',  template_nm:'사출·프레스형',   industry_type:'press_injection',
      default_module_cds:['data','pm','qual'],               description:'사출 성형, 프레스 가공 라인 기본 템플릿' },
  ]);
  console.log('  ✅ 업종 템플릿 3개 생성');
  console.log('🎉 기준정보 시드 완료!');
};

// ── 질문 upsert (최초/재기동 모두 항상 최신 유지) ──────────
async function upsertQuestions(modMapArg) {
  // modMapArg 없으면 DB에서 직접 조회
  let modMap = modMapArg;
  if (!modMap) {
    const mods = await MasterModule.findAll();
    modMap = Object.fromEntries(mods.map(m => [m.module_cd, m.id]));
  }

  const QUESTIONS = [
    { qcd:'Q-infra-01', mcd:'infra',
      qtxt:'현장 작업자에게 태블릿 또는 스마트폰이 지급되어 있고, 공장 내 Wi-Fi 또는 LTE 망이 작업 구역을 커버하고 있나요?',
      hint:'예) 작업자 1인당 태블릿 1대 이상 지급 + 공장 Wi-Fi 커버리지 90% 이상' },
    { qcd:'Q-data-01', mcd:'data',
      qtxt:'작업지시가 종이 없이 태블릿·화면으로 발행되고, 생산 수량·불량을 현장에서 시스템에 직접 입력하고 있나요?',
      hint:'예) 작업자가 태블릿에서 작업지시 확인 후 완료 수량·불량을 앱에 바로 입력' },
    { qcd:'Q-pm-01', mcd:'pm',
      qtxt:'설비 예방점검(PM) 계획과 점검 결과가 시스템에 기록되고, 고장 발생 이력을 조회할 수 있나요?',
      hint:'예) 모바일 점검표로 PM 수행 기록 + 고장 접수·조치 이력 시스템 저장' },
    { qcd:'Q-qual-01', mcd:'qual',
      qtxt:'불량이 발생했을 때 작업자가 시스템에 즉시 입력하고, 어느 LOT(생산 배치)에서 발생했는지 추적이 가능한가요?',
      hint:'예) 불량 발생 즉시 앱에 유형·수량 입력 + LOT 번호별 불량 이력 조회' },
    { qcd:'Q-sop-01', mcd:'sop',
      qtxt:'현장 작업자가 작업 시 종이가 아닌 태블릿·모니터 화면에서 표준 작업 절차(SOP)를 확인하며 작업하고 있나요?',
      hint:'예) 작업 시작 시 화면에 SOP 자동 표시, 개정 시 현장에 즉시 반영' },
    { qcd:'Q-issue-01', mcd:'issue',
      qtxt:'설비 고장·품질 이상·작업 지연 등 문제가 발생했을 때 담당자가 시스템에 즉시 등록하고, 관련자에게 자동 알림이 전달되나요?',
      hint:'예) 문제 발생 즉시 앱에 사진+내용 등록 → 팀장·담당자에게 자동 알림' },
    { qcd:'Q-erp-01', mcd:'erp',
      qtxt:'현재 ERP(SAP·Oracle·영림원·더존 등)를 운영 중이며, 외부 시스템과 API로 데이터를 주고받을 수 있나요?',
      hint:'※ ERP가 없으면 아니오 선택. API 개방 여부는 사전에 IT 담당자 확인 필수' },
    { qcd:'Q-kpi-01', mcd:'kpi',
      qtxt:'생산량·불량률·OEE 등 성과 지표(KPI)가 엑셀 취합 없이 시스템에서 자동으로 집계되어 대시보드로 조회되나요?',
      hint:'예) 실시간 대시보드에서 KPI 확인 가능, 일·주·월 리포트 자동 생성' },
  ];

  for (const q of QUESTIONS) {
    if (!modMap[q.mcd]) continue;
    await MasterQuestion.upsert({
      question_cd:  q.qcd,
      module_id:    modMap[q.mcd],
      question_txt: q.qtxt,
      hint_txt:     q.hint,
    });
  }
}
