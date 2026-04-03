// ── customer.routes.js ──────────────────────────────────────
'use strict';
const router = require('express').Router();
const { Op } = require('sequelize');
const { body } = require('express-validator');
const {
  CustomerCompany, CustomerSite, CustomerFactory,
  CustomerLine, CustomerProcess, CustomerEquipment,
  CustomerExternalSystem
} = require('../models');
const { requireInternal, requireManager } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

// 고객사 목록
router.get('/', ...requireInternal, async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = { tenant_id: req.user.tenant_id };
    if (req.user.role_code === 'sales_user') where.sales_user_id = req.user.id;
    if (search) where.company_nm = { [Op.like]: `%${search}%` };
    const { count, rows } = await CustomerCompany.findAndCountAll({
      where, limit: +limit, offset: (+page - 1) * +limit,
      order: [['created_at', 'DESC']],
    });
    res.json({ total: count, page: +page, data: rows });
  } catch (e) { next(e); }
});

// 고객사 등록
router.post('/', ...requireInternal, validate([
  body('company_nm').notEmpty().withMessage('고객사명 필수'),
]), async (req, res, next) => {
  try {
    const company = await CustomerCompany.create({
      ...req.body,
      tenant_id: req.user.tenant_id,
      sales_user_id: req.user.id,
    });
    res.status(201).json(company);
  } catch (e) { next(e); }
});

// 고객사 상세 (공장구조 포함)
router.get('/:id', ...requireInternal, async (req, res, next) => {
  try {
    const company = await CustomerCompany.findOne({
      where: { id: req.params.id, tenant_id: req.user.tenant_id },
      include: [
        { model: CustomerSite, as: 'sites',
          include: [{ model: CustomerFactory, as: 'factories',
            include: [{ model: CustomerLine, as: 'lines',
              include: [{ model: CustomerProcess, as: 'processes' }] }] }] },
        { model: CustomerExternalSystem, as: 'extSystems' },
      ],
    });
    if (!company) return res.status(404).json({ error: '고객사를 찾을 수 없습니다' });
    res.json(company);
  } catch (e) { next(e); }
});

router.put('/:id',    ...requireInternal, async (req, res, next) => {
  try {
    const [n] = await CustomerCompany.update(req.body, { where: { id: req.params.id, tenant_id: req.user.tenant_id } });
    if (!n) return res.status(404).json({ error: '고객사를 찾을 수 없습니다' });
    res.json({ message: '수정 완료' });
  } catch (e) { next(e); }
});

router.delete('/:id', ...requireManager, async (req, res, next) => {
  try {
    const n = await CustomerCompany.destroy({ where: { id: req.params.id, tenant_id: req.user.tenant_id } });
    if (!n) return res.status(404).json({ error: '고객사를 찾을 수 없습니다' });
    res.json({ message: '삭제 완료' });
  } catch (e) { next(e); }
});

// 사업장/공장/라인
router.get( '/:id/sites', ...requireInternal, async (req, res, next) => {
  try { res.json(await CustomerSite.findAll({ where: { company_id: req.params.id } })); } catch (e) { next(e); }
});
router.post('/:id/sites', ...requireInternal, async (req, res, next) => {
  try { res.status(201).json(await CustomerSite.create({ ...req.body, company_id: req.params.id })); } catch (e) { next(e); }
});
router.post('/:id/sites/:sid/factories', ...requireInternal, async (req, res, next) => {
  try { res.status(201).json(await CustomerFactory.create({ ...req.body, site_id: req.params.sid })); } catch (e) { next(e); }
});
router.post('/factories/:fid/lines', ...requireInternal, async (req, res, next) => {
  try { res.status(201).json(await CustomerLine.create({ ...req.body, factory_id: req.params.fid })); } catch (e) { next(e); }
});

// 외부 시스템
router.get( '/:id/external-systems', ...requireInternal, async (req, res, next) => {
  try { res.json(await CustomerExternalSystem.findAll({ where: { company_id: req.params.id } })); } catch (e) { next(e); }
});
router.post('/:id/external-systems', ...requireInternal, async (req, res, next) => {
  try { res.status(201).json(await CustomerExternalSystem.create({ ...req.body, company_id: req.params.id })); } catch (e) { next(e); }
});

module.exports = router;
