// ── auth.routes.js ──────────────────────────────────────────
'use strict';
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { body } = require('express-validator');
const { AuthUser, AuthLoginHistory, AuthAuditLog } = require('../models');
const { requireAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

router.post('/register', validate([
  body('email').notEmpty().withMessage('email 필수'),
  body('password').isLength({ min: 6 }).withMessage('비밀번호 6자 이상'),
  body('name').notEmpty().withMessage('name 필수'),
]), async (req, res, next) => {
  try {
    const { email, password, name, tenant_id = 'default', role_code = 'sales_user' } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: 'email, password, name 필수' });
    if (await AuthUser.findOne({ where: { email } }))
      return res.status(400).json({ error: '이미 사용 중인 이메일입니다' });
    const password_hash = await bcrypt.hash(password, 12);
    const user = await AuthUser.create({ email, password_hash, name, tenant_id, role_code });
    res.status(201).json({ message: '계정이 생성됐습니다', user_id: user.id });
  } catch (e) { next(e); }
});

router.post('/login', validate([
  body('email').notEmpty().withMessage('아이디를 입력해주세요'),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요'),
]), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;
    const ua = req.headers['user-agent'] || '';
    const user = await AuthUser.findOne({ where: { email } });
    const fail = async () => {
      if (user) await AuthLoginHistory.create({ user_id: user.id, ip_addr: ip, user_agent: ua, success: false });
    };
    if (!user) { await fail(); return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' }); }
    if (user.is_locked) return res.status(403).json({ error: '계정이 잠겨있습니다' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      const failCnt = user.fail_count + 1;
      const locked = failCnt >= (parseInt(process.env.MAX_LOGIN_FAIL) || 5);
      await user.update({ fail_count: failCnt, is_locked: locked });
      await fail();
      if (locked) return res.status(403).json({ error: `${failCnt}회 실패로 계정이 잠겼습니다` });
      return res.status(401).json({ error: `비밀번호 오류 (${failCnt}/${process.env.MAX_LOGIN_FAIL || 5})` });
    }
    await user.update({ fail_count: 0, last_login_at: new Date() });
    await AuthLoginHistory.create({ user_id: user.id, ip_addr: ip, user_agent: ua, success: true });
    const token = jwt.sign(
      { sub: user.id, tenant: user.tenant_id, role: user.role_code },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    const { password_hash, ...safeUser } = user.toJSON();
    res.json({ access_token: token, token_type: 'Bearer', user: safeUser });
  } catch (e) { next(e); }
});

router.get('/me', require('../middleware/auth.middleware').authenticate, (req, res) => {
  const { password_hash, ...safe } = req.user.toJSON();
  res.json(safe);
});

router.post('/unlock/:id', ...requireAdmin, async (req, res, next) => {
  try {
    const user = await AuthUser.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: '사용자 없음' });
    await user.update({ is_locked: false, fail_count: 0 });
    await AuthAuditLog.create({ user_id: req.user.id, action_type: 'UNLOCK_ACCOUNT', target_id: String(req.params.id) });
    res.json({ message: `${user.email} 잠금 해제 완료` });
  } catch (e) { next(e); }
});

module.exports = router;
