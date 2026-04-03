'use strict';
/**
 * DiagnosisEngine — wizflow_v2.html의 판정·공수 로직을 DB 기반으로 이전
 * Phase 1: 모듈 하드코딩 fallback 포함
 * Phase 2: DB 룰만으로 동작
 */
const {
  MasterModule, MasterJudgmentRule, MasterMaturityStage, RelModuleDependency,
  RelModuleMasterdata, DiagnosisSession, DiagnosisAnswer,
  DiagnosisResult, DiagnosisResultEffort, DiagnosisReport,
} = require('../models');

const STAGE_META = {
  1: { badge: 'Stage 1 — 기초 구축',   title: '종이 없는 현장 — 디지털 전환 시작',
       desc: 'WIZ-Flow PWA로 종이·엑셀을 디지털로 전환합니다. ERP 연동 없이 즉시 시작 가능.',
       color: '#C0392B', bg: '#FEF0EE', bc: 'rgba(192,57,43,.2)' },
  2: { badge: 'Stage 2 — 핵심 연동',   title: 'ERP·시스템 연동 + KPI 자동화',
       desc: 'ERP와 API 연동으로 오더·실적 자동 처리. KPI 리포트 자동 생성.',
       color: '#1a7a4a', bg: 'rgba(26,122,74,.05)', bc: 'rgba(26,122,74,.2)' },
  3: { badge: 'Stage 3 — 통합 자동화', title: 'PLC·센서 연동 + 실시간 통합 관제',
       desc: 'PLC·센서 연동으로 설비 데이터 자동 수집. 단일 대시보드 통합 관제.',
       color: '#7B241C', bg: 'rgba(123,36,28,.05)', bc: 'rgba(123,36,28,.2)' },
  4: { badge: 'Stage 4 — AI 최적화',   title: 'AI 예측·자율 실행',
       desc: 'AI로 설비 고장을 사전 감지하고 자동 발주·정비 스케줄을 생성합니다.',
       color: '#b7600a', bg: 'rgba(183,96,10,.05)', bc: 'rgba(183,96,10,.2)' },
};

class DiagnosisEngine {
  /**
   * 의존성 검증 — 선택 모듈 배열이 의존성을 모두 충족하는지 확인
   * @returns {null | {module_cd, missing_labels}}  null이면 정상
   */
  static async validateDependencies(selectedModules) {
    const deps = await RelModuleDependency.findAll({
      where: { rel_type: 'required', is_active: true },
    });
    for (const module_cd of selectedModules) {
      const required = deps
        .filter(d => d.child_module_cd === module_cd)
        .map(d => d.parent_module_cd);
      const missing = required.filter(p => !selectedModules.includes(p));
      if (missing.length > 0) {
        const mods = await MasterModule.findAll({
          where: { module_cd: missing },
          attributes: ['module_cd', 'module_nm'],
        });
        return { module_cd, missing_labels: mods.map(m => m.module_nm) };
      }
    }
    return null;
  }

  /**
   * 공수 산정
   * @param {string[]} selectedModules
   * @param {Object} answers  { module_cd: 'y'|'n' }
   * @returns {{ rows, totalMin, totalMax, apiWarns }}
   */
  static async calcEffort(selectedModules, answers) {
    const rows = [];
    let totalRaw = 2.0;  // 공통 기준정보 2주

    rows.push({
      module_cd: 'common', module_nm: '공통 기준정보 등록',
      answer_val: null, effort_type: 'master', effort_weeks: 2.0,
      reason: '조직·공장·라인·공정·설비·작업자 마스터 등록 (필수 공통)',
      api_warn: null,
    });

    // Single query instead of N+1
    const modules = await MasterModule.findAll({
      where: { module_cd: selectedModules, is_active: true },
    });
    const modMap = new Map(modules.map(m => [m.module_cd, m]));

    for (const module_cd of selectedModules) {
      const mod = modMap.get(module_cd);
      if (!mod) continue;

      const ans = answers[module_cd] || 'n';
      const isY = ans === 'y';
      const effortType  = isY ? mod.effort_type_y  : mod.effort_type_n;
      const effortWeeks = isY ? parseFloat(mod.default_effort_y) : parseFloat(mod.default_effort_n);
      const reason      = isY ? mod.reason_y : mod.reason_n;

      if (effortType === 'skip') continue;

      totalRaw += effortWeeks;
      rows.push({
        module_cd, module_nm: mod.module_nm,
        answer_val: ans, effort_type: effortType,
        effort_weeks: effortWeeks, reason,
        api_warn: (isY && mod.api_warn) ? mod.api_warn : null,
      });
    }

    const apiWarns = rows.filter(r => r.api_warn).map(r => r.api_warn);
    return {
      rows,
      totalRaw,
      totalMin: Math.round(totalRaw * 0.70),
      totalMax: Math.round(totalRaw * 0.70 * 1.35),
      apiWarns,
    };
  }

  /**
   * Stage 판정 — DB 룰 → fallback 기본 로직
   */
  static async calcStage(selectedModules, answers) {
    // DB 룰 먼저 시도
    const rules = await MasterJudgmentRule.findAll({
      where: { is_active: true },
      order: [['priority', 'DESC']],
    });

    for (const rule of rules) {
      const cond = rule.condition_json || {};
      const reqMods = cond.required_modules || [];
      const minRatio = cond.min_ratio || 0;
      const yCount = Object.values(answers).filter(v => v === 'y').length;
      const ratio = selectedModules.length ? yCount / selectedModules.length : 0;

      const modsOk = reqMods.every(m => selectedModules.includes(m));
      if (modsOk && ratio >= minRatio) return rule.result_stage;
    }

    // fallback
    if (selectedModules.includes('kpi'))   return 3;
    if (selectedModules.includes('qual') || (selectedModules.includes('erp') && answers['erp'] === 'y')) return 2;
    return 1;
  }

  /**
   * 수집 자료 체크리스트 생성
   */
  static async buildChecklist(selectedModules, answers) {
    const items = [];
    // n 답변 모듈만 필터
    const nModules = selectedModules.filter(m => answers[m] === 'n');

    // Single query for common + all relevant modules
    const allItems = await RelModuleMasterdata.findAll({
      where: { module_cd: ['common', ...nModules], is_active: true },
    });

    // 공통 항목 먼저, 그 다음 모듈별 항목
    const commonItems = allItems.filter(i => i.module_cd === 'common');
    const moduleItems = allItems.filter(i => i.module_cd !== 'common');

    items.push(...commonItems.map(i => ({ text: i.checklist_item, tag: i.priority_tag, color: i.color_hex })));
    items.push(...moduleItems.map(i => ({ text: i.checklist_item, tag: i.priority_tag, color: i.color_hex })));
    return items;
  }

  /**
   * 판정 결과 DB 저장 (스냅샷 포함 — 재현 가능)
   */
  static async saveResult(session, effortData, stageNo, { transaction } = {}) {
    const sm = STAGE_META[stageNo] || STAGE_META[1];
    const result = await DiagnosisResult.create({
      session_id:          session.id,
      stage_no:            stageNo,
      stage_nm:            sm.title,
      total_weeks_min:     effortData.totalMin,
      total_weeks_max:     effortData.totalMax,
      selected_module_cnt: (session.selected_modules || []).length,
      api_warnings:        effortData.apiWarns,
      snapshot_json: {
        selected_modules: session.selected_modules,
        answers:          session.answers?.reduce((acc, a) => ({ ...acc, [a.module_cd]: a.answer_val }), {}) || {},
        stage_meta:       sm,
        effort_rows:      effortData.rows,
        rule_version:     session.rule_version,
        created_at:       new Date().toISOString(),
      },
    }, { transaction });

    // 모듈별 공수 상세 저장
    await DiagnosisResultEffort.bulkCreate(
      effortData.rows.map(r => ({ ...r, result_id: result.id })),
      { transaction }
    );

    await session.update({ status: 'completed', completed_at: new Date() }, { transaction });
    return result;
  }

  static async getStageMeta(stageNo) {
    const stage = await MasterMaturityStage.findOne({ where: { stage_no: stageNo } });
    if (stage) return {
      badge: stage.badge_txt, title: stage.title_txt, desc: stage.desc_txt,
      color: `#${stage.color_hex}`, bg: `#${stage.color_hex}08`, bc: `#${stage.color_hex}30`,
    };
    return STAGE_META[stageNo] || STAGE_META[1];
  }
}

module.exports = DiagnosisEngine;
