// ── diagnosis.routes.js ─────────────────────────────────────
'use strict';
const router  = require('express').Router();
const { DiagnosisSession, DiagnosisAnswer, DiagnosisResult,
        DiagnosisResultEffort, DiagnosisReport, MasterModule,
        RelModuleDependency } = require('../models');
const DiagnosisEngine = require('../services/DiagnosisEngine');
const { requireInternal, requireAny } = require('../middleware/auth.middleware');

// ── 의존성 포함 전체 모듈 목록 ──────────────────────────────
router.get('/modules/available', async (req, res, next) => {
  try {
    const modules = await MasterModule.findAll({
      where: { is_active: true }, order: [['stage_no','ASC'],['id','ASC']],
    });
    const deps = await RelModuleDependency.findAll({ where: { rel_type: 'required', is_active: true } });
    const depMap = {};
    deps.forEach(d => {
      if (!depMap[d.child_module_cd]) depMap[d.child_module_cd] = [];
      depMap[d.child_module_cd].push(d.parent_module_cd);
    });
    res.json(modules.map(m => ({
      module_cd:         m.module_cd,
      module_nm:         m.module_nm,
      description:       m.description,
      stage_no:          m.stage_no,
      requires:          depMap[m.module_cd] || [],
      default_effort_y:  parseFloat(m.default_effort_y),
      default_effort_n:  parseFloat(m.default_effort_n),
      effort_type_y:     m.effort_type_y,
      effort_type_n:     m.effort_type_n,
      reason_y:          m.reason_y,
      reason_n:          m.reason_n,
      api_warn:          m.api_warn,
    })));
  } catch (e) { next(e); }
});

// ── 진단 세션 생성 ──────────────────────────────────────────
router.post('/sessions', ...requireInternal, async (req, res, next) => {
  try {
    const { company_id, template_cd, selected_modules = [] } = req.body;
    if (!company_id) return res.status(400).json({ error: 'company_id 필수' });
    const session = await DiagnosisSession.create({
      company_id, user_id: req.user.id,
      template_cd, selected_modules, rule_version: 1,
    });
    res.status(201).json({ session_id: session.id, status: session.status });
  } catch (e) { next(e); }
});

// ── 모듈 선택 저장 + 의존성 검증 ───────────────────────────
router.put('/sessions/:id/modules', ...requireInternal, async (req, res, next) => {
  try {
    const session = await DiagnosisSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: '세션 없음' });
    const selected = req.body.selected_modules || req.body;

    const invalid = await DiagnosisEngine.validateDependencies(selected);
    if (invalid) {
      return res.status(400).json({
        error: `'${invalid.module_cd}' 선택 불가`,
        detail: `선행 모듈 필요: ${invalid.missing_labels.join(', ')}`,
      });
    }
    await session.update({ selected_modules: selected });
    res.json({ message: '모듈 선택 저장', selected });
  } catch (e) { next(e); }
});

// ── 답변 저장 (단건 upsert) ─────────────────────────────────
router.post('/sessions/:id/answers', ...requireInternal, async (req, res, next) => {
  try {
    const session = await DiagnosisSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: '세션 없음' });
    const { module_cd, answer_val } = req.body;
    if (!module_cd || !answer_val) return res.status(400).json({ error: 'module_cd, answer_val 필수' });

    const [ans, created] = await DiagnosisAnswer.findOrCreate({
      where: { session_id: session.id, module_cd },
      defaults: { answer_val },
    });
    if (!created) await ans.update({ answer_val });

    const total    = (session.selected_modules || []).length;
    const answered = await DiagnosisAnswer.count({ where: { session_id: session.id } });
    res.json({ module_cd, answer_val, progress: `${answered}/${total}` });
  } catch (e) { next(e); }
});

// ── 공수 산정 + 판정 결과 저장 ─────────────────────────────
router.post('/sessions/:id/calculate', ...requireInternal, async (req, res, next) => {
  try {
    const session = await DiagnosisSession.findOne({
      where: { id: req.params.id },
      include: [{ model: DiagnosisAnswer, as: 'answers' }],
    });
    if (!session) return res.status(404).json({ error: '세션 없음' });

    const selected = session.selected_modules || [];
    const answers  = Object.fromEntries(session.answers.map(a => [a.module_cd, a.answer_val]));

    // 미답변 체크
    const unanswered = selected.filter(m => !answers[m]);
    if (unanswered.length)
      return res.status(400).json({ error: '미답변 모듈', modules: unanswered });

    const effortData = await DiagnosisEngine.calcEffort(selected, answers);
    const stageNo    = await DiagnosisEngine.calcStage(selected, answers);
    const result     = await DiagnosisEngine.saveResult(session, effortData, stageNo);
    const checklist  = await DiagnosisEngine.buildChecklist(selected, answers);
    const stageMeta  = DiagnosisEngine.getStageMeta(stageNo);

    res.json({
      result_id:       result.id,
      stage_no:        stageNo,
      stage_meta:      stageMeta,
      total_weeks_min: result.total_weeks_min,
      total_weeks_max: result.total_weeks_max,
      effort_rows:     effortData.rows,
      api_warns:       effortData.apiWarns,
      checklist,
    });
  } catch (e) { next(e); }
});

// ── 결과 조회 ───────────────────────────────────────────────
router.get('/sessions/:id/result', ...requireAny, async (req, res, next) => {
  try {
    const session = await DiagnosisSession.findOne({
      where: { id: req.params.id },
      include: [
        { model: DiagnosisResult, as: 'results',
          include: [{ model: DiagnosisResultEffort, as: 'efforts' }] },
      ],
    });
    if (!session || !session.results?.length)
      return res.status(404).json({ error: '결과가 없습니다. 먼저 calculate를 실행하세요.' });

    const result = session.results[session.results.length - 1];
    const stageMeta = DiagnosisEngine.getStageMeta(result.stage_no);
    res.json({
      session_id:      session.id,
      company_id:      session.company_id,
      stage_no:        result.stage_no,
      stage_nm:        result.stage_nm,
      stage_meta:      stageMeta,
      total_weeks_min: result.total_weeks_min,
      total_weeks_max: result.total_weeks_max,
      selected_modules: session.selected_modules,
      module_efforts:  result.efforts,
      api_warnings:    result.api_warnings,
      snapshot:        result.snapshot_json,
    });
  } catch (e) { next(e); }
});

// ── 세션 목록 ───────────────────────────────────────────────
router.get('/sessions', ...requireInternal, async (req, res, next) => {
  try {
    const where = {};
    if (req.query.company_id) where.company_id = req.query.company_id;
    res.json(await DiagnosisSession.findAll({
      where, order: [['created_at','DESC']], limit: 50,
    }));
  } catch (e) { next(e); }
});

module.exports = router;
