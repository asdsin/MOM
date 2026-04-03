// ── diagnosis.routes.js ─────────────────────────────────────
'use strict';
const router  = require('express').Router();
const ExcelJS = require('exceljs');
const { body } = require('express-validator');
const { sequelize, DiagnosisSession, DiagnosisAnswer, DiagnosisResult,
        DiagnosisResultEffort, DiagnosisReport, MasterModule,
        RelModuleDependency, CustomerCompany } = require('../models');
const DiagnosisEngine = require('../services/DiagnosisEngine');
const { requireInternal, requireAny } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

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
router.post('/sessions', ...requireInternal, validate([
  body('company_id').isInt().withMessage('고객사 ID 필수'),
]), async (req, res, next) => {
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
router.post('/sessions/:id/answers', ...requireInternal, validate([
  body('module_cd').notEmpty().withMessage('module_cd 필수'),
  body('answer_val').isIn(['y', 'n']).withMessage('answer_val은 y 또는 n'),
]), async (req, res, next) => {
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
  const transaction = await sequelize.transaction();
  try {
    const session = await DiagnosisSession.findOne({
      where: { id: req.params.id },
      include: [{ model: DiagnosisAnswer, as: 'answers' }],
    });
    if (!session) { await transaction.rollback(); return res.status(404).json({ error: '세션 없음' }); }

    const selected = session.selected_modules || [];
    const answers  = Object.fromEntries(session.answers.map(a => [a.module_cd, a.answer_val]));

    // 미답변 체크
    const unanswered = selected.filter(m => !answers[m]);
    if (unanswered.length) {
      await transaction.rollback();
      return res.status(400).json({ error: '미답변 모듈', modules: unanswered });
    }

    const effortData = await DiagnosisEngine.calcEffort(selected, answers);
    const stageNo    = await DiagnosisEngine.calcStage(selected, answers);
    const result     = await DiagnosisEngine.saveResult(session, effortData, stageNo, { transaction });
    const checklist  = await DiagnosisEngine.buildChecklist(selected, answers);
    const stageMeta  = await DiagnosisEngine.getStageMeta(stageNo);

    await transaction.commit();

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
  } catch (e) { await transaction.rollback(); next(e); }
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
    const stageMeta = await DiagnosisEngine.getStageMeta(result.stage_no);
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

// ── Excel 보고서 다운로드 ────────────────────────────────────
router.get('/sessions/:id/export-excel', ...requireAny, async (req, res, next) => {
  try {
    const session = await DiagnosisSession.findOne({
      where: { id: req.params.id },
      include: [
        { model: DiagnosisResult, as: 'results',
          include: [{ model: DiagnosisResultEffort, as: 'efforts' }] },
        { model: CustomerCompany, as: 'company' },
      ],
    });
    if (!session || !session.results?.length)
      return res.status(404).json({ error: '결과 없음' });

    const result = session.results[session.results.length - 1];
    const efforts = result.efforts || [];
    const sm = await DiagnosisEngine.getStageMeta(result.stage_no);
    const checklist = await DiagnosisEngine.buildChecklist(
      session.selected_modules || [],
      result.snapshot_json?.answers || {}
    );

    const wb = new ExcelJS.Workbook();
    wb.creator = 'WIZ-Flow MOM 수준진단';
    wb.created = new Date();

    // ── 색상 ──
    const RED = 'C0392B';
    const WHITE = 'FFFFFF';
    const LIGHT_BG = 'FEF0EE';

    // ═══ Sheet 1: 진단 요약 ═══
    const ws1 = wb.addWorksheet('진단 요약');
    ws1.columns = [
      { width: 22 }, { width: 30 }, { width: 16 }, { width: 16 },
    ];

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } };
    const headerFont = { bold: true, color: { argb: WHITE }, size: 11 };
    const thinBorder = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };

    // 타이틀
    ws1.mergeCells('A1:D1');
    const titleCell = ws1.getCell('A1');
    titleCell.value = 'MOM 수준진단 결과 보고서';
    titleCell.font = { bold: true, size: 16, color: { argb: RED } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(1).height = 36;

    // 기본 정보
    const infoRows = [
      ['고객사', session.company?.company_nm || '-'],
      ['진단 일시', new Date(session.created_at).toLocaleDateString('ko-KR')],
      ['판정 단계', sm.badge],
      ['총 소요 기간', `${result.total_weeks_min} ~ ${result.total_weeks_max} 주`],
      ['선택 모듈 수', `${(session.selected_modules || []).length}개`],
    ];
    infoRows.forEach((r, i) => {
      const row = ws1.getRow(i + 3);
      row.getCell(1).value = r[0];
      row.getCell(1).font = { bold: true, size: 11 };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BG } };
      row.getCell(2).value = r[1];
      row.getCell(2).font = { size: 11 };
      [1,2].forEach(c => { row.getCell(c).border = thinBorder; });
    });

    // API 경고
    const warns = result.api_warnings || [];
    if (warns.length) {
      const warnStart = infoRows.length + 4;
      ws1.getCell(`A${warnStart}`).value = '⚠ API 연동 일정 변수';
      ws1.getCell(`A${warnStart}`).font = { bold: true, color: { argb: RED }, size: 11 };
      warns.forEach((w, i) => {
        ws1.getCell(`A${warnStart + 1 + i}`).value = `• ${w}`;
      });
    }

    // ═══ Sheet 2: 공수 상세 ═══
    const ws2 = wb.addWorksheet('공수 상세');
    ws2.columns = [
      { width: 6 }, { width: 22 }, { width: 10 }, { width: 14 },
      { width: 10 }, { width: 40 },
    ];
    const hdr2 = ws2.addRow(['No', '모듈명', '현황', '유형', '공수(주)', '산정 근거']);
    hdr2.eachCell(c => { c.fill = headerFill; c.font = headerFont; c.border = thinBorder; c.alignment = { horizontal: 'center' }; });

    const TYPE_LABEL = {
      build:'신규 구축', partial:'부분 개선', api:'API 연동',
      data:'데이터 이관', master:'기준정보', skip:'해당 없음',
    };

    efforts.forEach((e, i) => {
      const row = ws2.addRow([
        i + 1,
        e.module_nm,
        e.answer_val === 'y' ? '있음(Y)' : e.answer_val === 'n' ? '없음(N)' : '-',
        TYPE_LABEL[e.effort_type] || e.effort_type,
        parseFloat(e.effort_weeks),
        e.reason || '',
      ]);
      row.eachCell(c => { c.border = thinBorder; });
      row.getCell(5).alignment = { horizontal: 'center' };
    });

    // 합계
    const totalRow = ws2.addRow(['', '합계', '', '', efforts.reduce((s, e) => s + parseFloat(e.effort_weeks || 0), 0), '']);
    totalRow.getCell(2).font = { bold: true };
    totalRow.getCell(5).font = { bold: true, color: { argb: RED } };
    totalRow.eachCell(c => { c.border = thinBorder; });

    // 병렬 반영
    ws2.addRow([]);
    const noteRow = ws2.addRow(['', `병렬 진행 반영 → 예상 기간: ${result.total_weeks_min} ~ ${result.total_weeks_max} 주`]);
    noteRow.getCell(2).font = { italic: true, color: { argb: '666666' } };

    // ═══ Sheet 3: 추진 일정 ═══
    const ws3 = wb.addWorksheet('추진 일정');
    ws3.columns = [
      { width: 6 }, { width: 14 }, { width: 30 }, { width: 50 },
    ];
    const hdr3 = ws3.addRow(['No', '주차', '단계', '상세 내용']);
    hdr3.eachCell(c => { c.fill = headerFill; c.font = headerFont; c.border = thinBorder; c.alignment = { horizontal: 'center' }; });

    // 일정 생성 로직 (프론트엔드와 동일)
    const schedule = [];
    let w = 1;
    const pushSch = (weeks, title, body) => {
      schedule.push({ week: `${w}~${w + Math.max(0, weeks - 1)}주`, title, body });
      w += Math.max(1, weeks);
    };
    pushSch(2, '기준정보 수집 및 시스템 등록', '현장 방문 → 기준정보 수집 → 엑셀 정제 → 시스템 등록');
    const buildWks = Math.max(2, Math.round(efforts.filter(r => r.effort_type !== 'master').reduce((s, r) => s + (parseFloat(r.effort_weeks) || 0), 0) * 0.6));
    pushSch(buildWks, '핵심 모듈 개발·배포', efforts.filter(r => r.module_cd !== 'common').map(r => r.module_nm).join(' · '));
    const apiItems = efforts.filter(r => r.effort_type === 'api');
    if (apiItems.length) pushSch(Math.round(apiItems.reduce((s, r) => s + (parseFloat(r.effort_weeks) || 0), 0) * 0.75),
      `API 연동 (${apiItems.map(r => r.module_nm).join(' · ')})`, 'API 스펙 확인 → 개발 → 테스트');
    pushSch(2, 'UAT 및 현장 검증', '공정·라인별 실제 시나리오 검증. 현장 담당자 피드백 반영.');
    if (result.stage_no >= 2) pushSch(3, '전체 라인 확산 및 안정화', '파일럿 후 전 라인 확산. 운영 이슈 모니터링.');

    schedule.forEach((s, i) => {
      const row = ws3.addRow([i + 1, s.week, s.title, s.body]);
      row.eachCell(c => { c.border = thinBorder; });
    });

    // ═══ Sheet 4: 수집 자료 체크리스트 ═══
    const ws4 = wb.addWorksheet('수집 자료 체크리스트');
    ws4.columns = [
      { width: 6 }, { width: 50 }, { width: 14 }, { width: 10 },
    ];
    const hdr4 = ws4.addRow(['No', '체크리스트 항목', '분류', '확인']);
    hdr4.eachCell(c => { c.fill = headerFill; c.font = headerFont; c.border = thinBorder; c.alignment = { horizontal: 'center' }; });

    checklist.forEach((c, i) => {
      const row = ws4.addRow([i + 1, c.text, c.tag, '☐']);
      row.eachCell(cell => { cell.border = thinBorder; });
      row.getCell(4).alignment = { horizontal: 'center' };
    });

    // 응답 전송
    const companyNm = session.company?.company_nm || 'unknown';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = encodeURIComponent(`MOM_진단결과_${companyNm}_${dateStr}.xlsx`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);

    await wb.xlsx.write(res);
    res.end();
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
