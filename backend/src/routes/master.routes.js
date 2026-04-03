// ── master.routes.js ────────────────────────────────────────
'use strict';
const router = require('express').Router();
const {
  MasterModule, MasterQuestion, MasterMaturityStage,
  MasterJudgmentRule, MasterTemplateIndustry,
  RelModuleDependency, RelModuleMasterdata,
} = require('../models');
const { requireInternal, requireManager } = require('../middleware/auth.middleware');

router.get('/modules',    ...requireInternal, async (req, res, next) => {
  try {
    const where = { is_active: true };
    if (req.query.stage_no) where.stage_no = req.query.stage_no;
    res.json(await MasterModule.findAll({ where, order: [['stage_no','ASC'],['id','ASC']] }));
  } catch (e) { next(e); }
});
router.post('/modules',   ...requireManager,  async (req, res, next) => {
  try { res.status(201).json(await MasterModule.create(req.body)); } catch (e) { next(e); }
});
router.put('/modules/:id',...requireManager,  async (req, res, next) => {
  try {
    const mod = await MasterModule.findByPk(req.params.id);
    if (!mod) return res.status(404).json({ error: '모듈 없음' });
    await mod.update({ ...req.body, version: mod.version + 1 });
    res.json({ message: '수정 완료', version: mod.version });
  } catch (e) { next(e); }
});
router.patch('/modules/:id/approve', ...requireManager, async (req, res, next) => {
  try {
    await MasterModule.update({ status: 'approved' }, { where: { id: req.params.id } });
    res.json({ message: '승인 완료' });
  } catch (e) { next(e); }
});

router.get('/questions',    ...requireInternal, async (req, res, next) => {
  try {
    const where = { is_active: true };
    if (req.query.module_id) where.module_id = req.query.module_id;
    res.json(await MasterQuestion.findAll({ where, order: [['sort_order','ASC']] }));
  } catch (e) { next(e); }
});
router.post('/questions',   ...requireManager,  async (req, res, next) => {
  try { res.status(201).json(await MasterQuestion.create(req.body)); } catch (e) { next(e); }
});
router.put('/questions/:id',...requireManager,  async (req, res, next) => {
  try {
    const q = await MasterQuestion.findByPk(req.params.id);
    if (!q) return res.status(404).json({ error: '질문 없음' });
    await q.update({ ...req.body, version: q.version + 1 });
    res.json({ message: '수정 완료' });
  } catch (e) { next(e); }
});

router.get('/stages',     async (req, res, next) => {
  try { res.json(await MasterMaturityStage.findAll({ order: [['stage_no','ASC']] })); } catch (e) { next(e); }
});

router.get('/dependencies',     ...requireInternal, async (req, res, next) => {
  try { res.json(await RelModuleDependency.findAll({ where: { is_active: true } })); } catch (e) { next(e); }
});
router.post('/dependencies',    ...requireManager,  async (req, res, next) => {
  try { res.status(201).json(await RelModuleDependency.create(req.body)); } catch (e) { next(e); }
});
router.delete('/dependencies/:id', ...requireManager, async (req, res, next) => {
  try {
    await RelModuleDependency.update({ is_active: false }, { where: { id: req.params.id } });
    res.json({ message: '삭제 완료' });
  } catch (e) { next(e); }
});

router.get('/masterdata-map', ...requireInternal, async (req, res, next) => {
  try {
    const where = { is_active: true };
    if (req.query.module_cd) where.module_cd = req.query.module_cd;
    res.json(await RelModuleMasterdata.findAll({ where }));
  } catch (e) { next(e); }
});
router.post('/masterdata-map', ...requireManager, async (req, res, next) => {
  try { res.status(201).json(await RelModuleMasterdata.create(req.body)); } catch (e) { next(e); }
});

router.get('/templates', async (req, res, next) => {
  try { res.json(await MasterTemplateIndustry.findAll({ where: { is_active: true } })); } catch (e) { next(e); }
});

module.exports = router;
