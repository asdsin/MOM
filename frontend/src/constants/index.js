// ── 공유 상수 (Shared Constants) ─────────────────────────────
// 여러 컴포넌트에서 중복 정의되던 색상·라벨·배지 등을 한곳에 모아 관리합니다.

// ── 대시보드 통계 카드 색상 ─────────────────────────────────────
export const STAT_COLORS = ['#C0392B', '#1a7a4a', '#1a5fa8', '#b7600a'];

// ── 도입 단계 (Stage) ───────────────────────────────────────────
export const STAGE_COLORS = { 1: '#C0392B', 2: '#1a5fa8', 3: '#1a7a4a' };
export const STAGE_BG     = { 1: 'rgba(192,57,43,.1)', 2: 'rgba(26,95,168,.1)', 3: 'rgba(26,122,74,.1)' };
export const STAGE_LABELS = { 1: '단계 1', 2: '단계 2', 3: '단계 3' };

// ── 모듈 상태 (Status) ─────────────────────────────────────────
export const STATUS_COLOR = { draft: '#b7600a', review: '#1a5fa8', approved: '#1a7a4a' };
export const STATUS_LABEL = { draft: '초안', review: '검토 중', approved: '승인' };

// ── 공수 유형 (Effort Type) ─────────────────────────────────────
export const EFFORT_TYPE_LABEL = {
  build:   '신규 구축',
  partial: '부분 개선',
  api:     'API 연동',
  data:    '데이터 이관',
  master:  '기준정보',
  skip:    '해당 없음',
};
export const EFFORT_TYPE_COLOR = {
  build:   '#b7600a',
  partial: '#1a5fa8',
  api:     '#1a7a4a',
  data:    '#1a7a4a',
  master:  '#b7600a',
  skip:    'rgba(26,10,10,.35)',
};

// ── 의존성 관계 유형 (Dependency Relation) ───────────────────────
export const REL_LABEL = { required: '필수', recommended: '추천', optional: '선택' };
export const REL_COLOR = { required: '#C0392B', recommended: '#1a5fa8', optional: '#1a7a4a' };

// ── 룰 결과 단계 색상 ──────────────────────────────────────────
export const RESULT_STAGE_COLOR = { 1: '#C0392B', 2: '#1a7a4a', 3: '#7B241C', 4: '#b7600a' };

// ── 업종 배지 (Industry Badge) ──────────────────────────────────
export const INDUSTRY_BADGE = {
  electronics_assembly: { label: '전자조립',   color: '#1a5fa8' },
  mixed_processing:     { label: '가공혼합',   color: '#1a7a4a' },
  press_injection:      { label: '사출프레스', color: '#b7600a' },
};

// ── 시스템 보유 배지 (System Badges) ────────────────────────────
export const SYS_BADGES = [
  { key: 'erp_yn', label: 'ERP',     color: '#1a5fa8' },
  { key: 'mes_yn', label: 'MES',     color: '#1a7a4a' },
  { key: 'wms_yn', label: 'WMS',     color: '#b7600a' },
  { key: 'plc_yn', label: 'PLC/IoT', color: '#7B241C' },
];

// ── 진단 탭 라벨 ───────────────────────────────────────────────
export const DIAGNOSIS_RESULT_TABS = ['공수 상세', '추진 일정', '수집 자료'];

// ── 마스터 관리 탭 라벨 ─────────────────────────────────────────
export const MASTER_TABS = ['모듈 관리', '의존성 설정', '판정 룰', '업종 템플릿'];

// ── 공통 색상 토큰 (참고용) ─────────────────────────────────────
export const COLORS = {
  red:       '#C0392B',
  redDark:   '#922B21',
  redBg:     '#FEF9F8',
  redFaint:  '#FEF0EE',
  green:     '#1a7a4a',
  blue:      '#1a5fa8',
  amber:     '#b7600a',
  darkRed:   '#7B241C',
  text:      '#1a0a0a',
  textMuted: 'rgba(26,10,10,.55)',
  textLight: 'rgba(26,10,10,.4)',
};
