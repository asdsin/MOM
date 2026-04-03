const jwt = require('jsonwebtoken');
const { AuthUser } = require('../models');

const ROLE_LEVEL = {
  super_admin:     100, system_admin:    90,
  sales_manager:   70,  master_admin:    70,
  consultant:      60,  sales_user:      50,
  customer_admin:  30,  customer_user:   20,
  customer_viewer: 10,
};

/**
 * JWT 검증 + 사용자 정보 req.user에 주입
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: '인증 토큰이 없습니다' });

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await AuthUser.findByPk(payload.sub);
    if (!user || !user.is_active)
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다' });
    if (user.is_locked)
      return res.status(403).json({ error: '계정이 잠겨있습니다. 관리자에게 문의하세요' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: '토큰이 만료됐습니다. 다시 로그인하세요' });
    return res.status(401).json({ error: '유효하지 않은 토큰입니다' });
  }
};

/**
 * 최소 역할 수준 요구
 * @param {number} minLevel
 */
const requireRole = (minLevel) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ error: '로그인이 필요합니다' });
  const level = ROLE_LEVEL[req.user.role_code] ?? 0;
  if (level < minLevel)
    return res.status(403).json({
      error: `권한이 없습니다 (필요: ${minLevel}, 현재: ${level} / ${req.user.role_code})`
    });
  next();
};

// 편의 미들웨어 조합
const requireAny      = [authenticate];
const requireInternal = [authenticate, requireRole(50)];   // 영업사용자+
const requireManager  = [authenticate, requireRole(70)];   // 영업관리자/기준정보관리자+
const requireAdmin    = [authenticate, requireRole(90)];   // 시스템관리자+

/**
 * 테넌트 격리 — 자신의 테넌트 데이터만 접근 (sales_user는 본인 담당 고객만)
 */
const tenantFilter = (req, res, next) => {
  req.tenantId = req.user.tenant_id;
  next();
};

module.exports = {
  authenticate, requireRole,
  requireAny, requireInternal, requireManager, requireAdmin,
  tenantFilter, ROLE_LEVEL,
};
